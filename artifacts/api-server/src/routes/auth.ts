import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, workspacesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function getUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const existing = await db.select().from(workspacesTable).where(eq(workspacesTable.inviteCode, code)).limit(1);
    if (existing.length === 0) return code;
  }
  return randomUUID().replace(/-/g, "").substring(0, 6).toUpperCase();
}

router.post("/auth/register", async (req, res) => {
  try {
    const { email, firstName, lastName, phone } = req.body as {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    };

    if (!email || !firstName) {
      res.status(400).json({ error: "Email and first name are required." });
      return;
    }

    const emailKey = email.trim().toLowerCase();

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, emailKey)).limit(1);

    let workspaceId: string;
    let inviteCode: string;

    if (existing.length > 0 && existing[0].workspaceId) {
      workspaceId = existing[0].workspaceId;
      const ws = await db.select().from(workspacesTable).where(eq(workspacesTable.id, workspaceId)).limit(1);
      inviteCode = ws[0]?.inviteCode ?? "";

      await db.update(usersTable).set({
        firstName: firstName.trim(),
        lastName: (lastName ?? "").trim(),
        phone: (phone ?? "").trim(),
      }).where(eq(usersTable.email, emailKey));
    } else {
      inviteCode = await getUniqueInviteCode();
      workspaceId = randomUUID();

      await db.insert(workspacesTable).values({
        id: workspaceId,
        inviteCode,
        ownerEmail: emailKey,
      }).onConflictDoNothing();

      await db.insert(usersTable).values({
        email: emailKey,
        firstName: firstName.trim(),
        lastName: (lastName ?? "").trim(),
        phone: (phone ?? "").trim(),
        workspaceId,
      }).onConflictDoUpdate({
        target: usersTable.email,
        set: {
          firstName: firstName.trim(),
          lastName: (lastName ?? "").trim(),
          phone: (phone ?? "").trim(),
          workspaceId,
        },
      });
    }

    res.json({ success: true, workspaceId, inviteCode });
  } catch (err: any) {
    console.error("auth/register error:", err?.message ?? err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.get("/auth/profile", async (req, res) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (users.length === 0) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const user = users[0];
    let inviteCode = "";

    if (user.workspaceId) {
      const ws = await db.select().from(workspacesTable).where(eq(workspacesTable.id, user.workspaceId)).limit(1);
      inviteCode = ws[0]?.inviteCode ?? "";
    }

    res.json({ ...user, inviteCode });
  } catch (err: any) {
    console.error("auth/profile error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to load profile." });
  }
});

export default router;
