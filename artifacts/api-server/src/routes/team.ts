import { Router } from "express";
import { db, employeesTable, usersTable, invoicesTable, returnsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

const router = Router();

async function getWorkspaceId(email: string): Promise<string | null> {
  const users = await db.select({ workspaceId: usersTable.workspaceId })
    .from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  return users[0]?.workspaceId ?? null;
}

router.get("/team", async (req, res) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) { res.status(400).json({ error: "Email is required." }); return; }

    const workspaceId = await getWorkspaceId(email);
    if (!workspaceId) { res.json({ members: [] }); return; }

    const employees = await db.select().from(employeesTable)
      .where(eq(employeesTable.email, email));

    const [allInvoices, allReturns] = await Promise.all([
      db.select({ creatorEmail: invoicesTable.creatorEmail, creatorName: invoicesTable.creatorName, createdAt: invoicesTable.createdAt })
        .from(invoicesTable).where(and(eq(invoicesTable.workspaceId, workspaceId), isNull(invoicesTable.deletedAt))),
      db.select({ creatorEmail: returnsTable.creatorEmail, creatorName: returnsTable.creatorName, createdAt: returnsTable.createdAt })
        .from(returnsTable).where(and(eq(returnsTable.workspaceId, workspaceId), isNull(returnsTable.deletedAt))),
    ]);

    const members = employees.map((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.trim();
      const invoiceCount = allInvoices.filter((i) => i.creatorName === fullName).length;
      const returnCount = allReturns.filter((r) => r.creatorName === fullName).length;

      const allActivity = [
        ...allInvoices.filter((i) => i.creatorName === fullName).map((i) => i.createdAt),
        ...allReturns.filter((r) => r.creatorName === fullName).map((r) => r.createdAt),
      ].filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());

      return {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        isAdmin: emp.isAdmin,
        invoiceCount,
        returnCount,
        lastActive: allActivity[0] ?? null,
        joinedAt: emp.createdAt,
      };
    });

    members.sort((a, b) => {
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return new Date(a.joinedAt ?? 0).getTime() - new Date(b.joinedAt ?? 0).getTime();
    });

    res.json({ members });
  } catch (err: any) {
    console.error("team/get error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to load team." });
  }
});

router.delete("/team/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = (req.query.adminEmail as string)?.trim().toLowerCase();
    if (!adminEmail) { res.status(400).json({ error: "adminEmail is required." }); return; }

    const admin = await db.select().from(employeesTable)
      .where(eq(employeesTable.id, (req.query.adminId as string) ?? ""))
      .limit(1);

    const adminCheck = await db.select().from(employeesTable)
      .where(and(eq(employeesTable.email, adminEmail), eq(employeesTable.isAdmin, true)))
      .limit(1);

    if (adminCheck.length === 0) {
      res.status(403).json({ error: "Only admins can remove team members." });
      return;
    }

    const target = await db.select().from(employeesTable)
      .where(and(eq(employeesTable.id, id), eq(employeesTable.email, adminEmail)))
      .limit(1);

    if (target.length === 0) {
      res.status(404).json({ error: "Member not found." });
      return;
    }

    if (target[0].isAdmin) {
      res.status(400).json({ error: "Cannot remove the admin." });
      return;
    }

    await db.delete(employeesTable).where(eq(employeesTable.id, id));
    res.json({ success: true });
  } catch (err: any) {
    console.error("team/delete error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to remove member." });
  }
});

export default router;
