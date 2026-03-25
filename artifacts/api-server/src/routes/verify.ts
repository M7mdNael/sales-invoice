import { Router } from "express";
import { Resend } from "resend";

const router = Router();

const otpStore = new Map<string, { code: string; expiresAt: number }>();

async function getResendClient(): Promise<{ client: Resend; from: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error("Replit connector env vars not found");
  }

  const data = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=resend`,
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  ).then((r) => r.json());

  const settings = data?.items?.[0]?.settings;
  if (!settings?.api_key) throw new Error("Resend not connected");

  return {
    client: new Resend(settings.api_key),
    from: settings.from_email ?? "noreply@resend.dev",
  };
}

router.post("/verify/send", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: "Invalid email address." });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email.trim().toLowerCase(), {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const { client, from } = await getResendClient();

    await client.emails.send({
      from,
      to: email.trim(),
      subject: "Your Sales Manager verification code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1A73E8;margin-bottom:8px">Sales Manager</h2>
          <p style="color:#374151;margin-bottom:24px">Here is your verification code:</p>
          <div style="background:#F3F4F6;border-radius:12px;padding:24px;text-align:center">
            <span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#111827">${code}</span>
          </div>
          <p style="color:#6B7280;font-size:13px;margin-top:20px">
            This code expires in 10 minutes. If you did not request this, you can ignore this email.
          </p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("verify/send error:", err);
    res.status(500).json({ error: "Failed to send verification email. Please try again." });
  }
});

router.post("/verify/check", (req, res) => {
  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) {
    res.status(400).json({ error: "Email and code are required." });
    return;
  }

  const key = email.trim().toLowerCase();
  const record = otpStore.get(key);

  if (!record) {
    res.status(400).json({ error: "No verification code found. Please request a new one." });
    return;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    return;
  }

  if (record.code !== code.trim()) {
    res.status(400).json({ error: "Incorrect code. Please try again." });
    return;
  }

  otpStore.delete(key);
  res.json({ success: true });
});

export default router;
