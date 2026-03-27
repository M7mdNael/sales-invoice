import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, workspacesTable, invoicesTable, returnsTable } from "@workspace/db";
import { eq, and, isNull, desc, count } from "drizzle-orm";

const router = Router();

router.get("/workspace", async (req, res) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (users.length === 0 || !users[0].workspaceId) {
      res.status(404).json({ error: "No workspace found." });
      return;
    }

    const workspaceId = users[0].workspaceId;
    const ws = await db.select().from(workspacesTable).where(eq(workspacesTable.id, workspaceId)).limit(1);
    if (ws.length === 0) {
      res.status(404).json({ error: "Workspace not found." });
      return;
    }

    const members = await db.select({
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
    }).from(usersTable).where(eq(usersTable.workspaceId, workspaceId));

    res.json({
      id: ws[0].id,
      inviteCode: ws[0].inviteCode,
      ownerEmail: ws[0].ownerEmail,
      members,
    });
  } catch (err: any) {
    console.error("workspace/get error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to load workspace." });
  }
});

router.get("/workspace/members", async (req, res) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const userRows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (userRows.length === 0 || !userRows[0].workspaceId) {
      res.json({ members: [], inviteCode: "", ownerEmail: "" });
      return;
    }

    const workspaceId = userRows[0].workspaceId;
    const ws = await db.select().from(workspacesTable).where(eq(workspacesTable.id, workspaceId)).limit(1);

    const members = await db.select({
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      phone: usersTable.phone,
    }).from(usersTable).where(eq(usersTable.workspaceId, workspaceId));

    const membersWithActivity = await Promise.all(members.map(async (member) => {
      const [invoiceCounts] = await db
        .select({ total: count() })
        .from(invoicesTable)
        .where(and(
          eq(invoicesTable.workspaceId, workspaceId),
          eq(invoicesTable.creatorEmail, member.email),
          isNull(invoicesTable.deletedAt),
        ));

      const [returnCounts] = await db
        .select({ total: count() })
        .from(returnsTable)
        .where(and(
          eq(returnsTable.workspaceId, workspaceId),
          eq(returnsTable.creatorEmail, member.email),
          isNull(returnsTable.deletedAt),
        ));

      const recentInvoices = await db
        .select({
          id: invoicesTable.id,
          invoiceNumber: invoicesTable.invoiceNumber,
          customerName: invoicesTable.customerName,
          companyName: invoicesTable.companyName,
          total: invoicesTable.total,
          date: invoicesTable.date,
        })
        .from(invoicesTable)
        .where(and(
          eq(invoicesTable.workspaceId, workspaceId),
          eq(invoicesTable.creatorEmail, member.email),
          isNull(invoicesTable.deletedAt),
        ))
        .orderBy(desc(invoicesTable.date))
        .limit(5);

      const recentReturns = await db
        .select({
          id: returnsTable.id,
          returnNumber: returnsTable.returnNumber,
          customerName: returnsTable.customerName,
          companyName: returnsTable.companyName,
          total: returnsTable.total,
          date: returnsTable.date,
        })
        .from(returnsTable)
        .where(and(
          eq(returnsTable.workspaceId, workspaceId),
          eq(returnsTable.creatorEmail, member.email),
          isNull(returnsTable.deletedAt),
        ))
        .orderBy(desc(returnsTable.date))
        .limit(5);

      return {
        ...member,
        invoiceCount: invoiceCounts?.total ?? 0,
        returnCount: returnCounts?.total ?? 0,
        recentInvoices,
        recentReturns,
      };
    }));

    res.json({
      inviteCode: ws[0]?.inviteCode ?? "",
      ownerEmail: ws[0]?.ownerEmail ?? "",
      members: membersWithActivity,
    });
  } catch (err: any) {
    console.error("workspace/members error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to load workspace members." });
  }
});

router.post("/workspace/join", async (req, res) => {
  try {
    const { email, inviteCode } = req.body as { email?: string; inviteCode?: string };
    if (!email || !inviteCode) {
      res.status(400).json({ error: "Email and invite code are required." });
      return;
    }

    const emailKey = email.trim().toLowerCase();
    const codeKey = inviteCode.trim().toUpperCase();

    const ws = await db.select().from(workspacesTable).where(eq(workspacesTable.inviteCode, codeKey)).limit(1);
    if (ws.length === 0) {
      res.status(404).json({ error: "Invalid invite code. Please check and try again." });
      return;
    }

    const workspace = ws[0];

    if (workspace.ownerEmail === emailKey) {
      res.status(400).json({ error: "You are already the owner of this workspace." });
      return;
    }

    const existingUsers = await db.select().from(usersTable).where(eq(usersTable.email, emailKey)).limit(1);
    if (existingUsers.length === 0) {
      res.status(404).json({ error: "User account not found. Please complete registration first." });
      return;
    }

    await db.update(usersTable).set({ workspaceId: workspace.id }).where(eq(usersTable.email, emailKey));

    res.json({ success: true, workspaceId: workspace.id, inviteCode: workspace.inviteCode });
  } catch (err: any) {
    console.error("workspace/join error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to join workspace." });
  }
});

export default router;
