import { Router } from "express";
import { db, companiesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function getWorkspaceId(email: string): Promise<string | null> {
  const users = await db.select({ workspaceId: usersTable.workspaceId })
    .from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  return users[0]?.workspaceId ?? null;
}

router.get("/companies", async (req, res) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) { res.status(400).json({ error: "Email is required." }); return; }

    const workspaceId = await getWorkspaceId(email);
    if (!workspaceId) { res.json({ companies: [] }); return; }

    const rows = await db.select().from(companiesTable)
      .where(eq(companiesTable.workspaceId, workspaceId));

    const companies = rows.map((r) => ({
      id: r.id,
      name: r.name,
      notes: r.notes,
      ownerEmail: r.ownerEmail,
      members: JSON.parse(r.membersJson),
    }));

    res.json({ companies });
  } catch (err: any) {
    console.error("companies/get error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to load companies." });
  }
});

router.post("/companies", async (req, res) => {
  try {
    const { email, company } = req.body as {
      email?: string;
      company?: { id?: string; name?: string; notes?: string; ownerEmail?: string; members?: string[] };
    };
    if (!email || !company?.id || !company?.name) {
      res.status(400).json({ error: "email, company.id, and company.name are required." });
      return;
    }

    const workspaceId = await getWorkspaceId(email.toLowerCase());
    if (!workspaceId) { res.status(400).json({ error: "User has no workspace." }); return; }

    await db.insert(companiesTable).values({
      id: company.id,
      workspaceId,
      name: company.name.trim(),
      notes: (company.notes ?? "").trim(),
      ownerEmail: (company.ownerEmail ?? email).toLowerCase(),
      membersJson: JSON.stringify(company.members ?? []),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: companiesTable.id,
      set: {
        name: company.name.trim(),
        notes: (company.notes ?? "").trim(),
        membersJson: JSON.stringify(company.members ?? []),
        updatedAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("companies/post error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to save company." });
  }
});

router.delete("/companies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) { res.status(400).json({ error: "Email is required." }); return; }

    const workspaceId = await getWorkspaceId(email);
    if (!workspaceId) { res.status(400).json({ error: "User has no workspace." }); return; }

    await db.delete(companiesTable).where(
      and(eq(companiesTable.id, id), eq(companiesTable.workspaceId, workspaceId))
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error("companies/delete error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to delete company." });
  }
});

export default router;
