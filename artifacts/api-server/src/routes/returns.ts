import { Router } from "express";
import { db } from "@workspace/db";
import { returnsTable, usersTable } from "@workspace/db";
import { eq, and, isNull, isNotNull } from "drizzle-orm";

const router = Router();

async function getWorkspaceId(email: string): Promise<string | null> {
  const users = await db.select({ workspaceId: usersTable.workspaceId })
    .from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  return users[0]?.workspaceId ?? null;
}

router.get("/returns", async (req, res) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    const includeDeleted = req.query.deleted === "true";

    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const workspaceId = await getWorkspaceId(email);
    if (!workspaceId) {
      res.json({ returns: [] });
      return;
    }

    const rows = includeDeleted
      ? await db.select().from(returnsTable)
          .where(and(eq(returnsTable.workspaceId, workspaceId), isNotNull(returnsTable.deletedAt)))
      : await db.select().from(returnsTable)
          .where(and(eq(returnsTable.workspaceId, workspaceId), isNull(returnsTable.deletedAt)));

    const returns = rows.map((r) => ({
      id: r.id,
      returnNumber: r.returnNumber,
      originalInvoiceId: r.originalInvoiceId,
      originalInvoiceNumber: r.originalInvoiceNumber,
      companyId: r.companyId,
      companyName: r.companyName,
      customerName: r.customerName,
      date: r.date,
      items: JSON.parse(r.itemsJson),
      total: r.total,
      creatorEmail: r.creatorEmail,
      creatorName: r.creatorName,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ returns });
  } catch (err: any) {
    console.error("returns/get error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to load returns." });
  }
});

router.post("/returns", async (req, res) => {
  try {
    const { email, ret } = req.body as {
      email?: string;
      ret?: {
        id: string;
        returnNumber: string;
        originalInvoiceId: string;
        originalInvoiceNumber: string;
        companyId: string;
        companyName: string;
        customerName: string;
        date: string;
        items: any[];
        total: number;
        creatorEmail: string;
        creatorName: string;
      };
    };

    if (!email || !ret) {
      res.status(400).json({ error: "Email and return are required." });
      return;
    }

    const workspaceId = await getWorkspaceId(email.trim().toLowerCase());
    if (!workspaceId) {
      res.status(400).json({ error: "User has no workspace." });
      return;
    }

    await db.insert(returnsTable).values({
      id: ret.id,
      workspaceId,
      returnNumber: ret.returnNumber,
      originalInvoiceId: ret.originalInvoiceId ?? "",
      originalInvoiceNumber: ret.originalInvoiceNumber ?? "",
      companyId: ret.companyId ?? "",
      companyName: ret.companyName ?? "",
      customerName: ret.customerName ?? "",
      date: ret.date,
      itemsJson: JSON.stringify(ret.items),
      total: ret.total,
      creatorEmail: ret.creatorEmail,
      creatorName: ret.creatorName,
    });

    res.json({ success: true, id: ret.id });
  } catch (err: any) {
    console.error("returns/post error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to create return." });
  }
});

router.put("/returns/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, ret } = req.body as {
      email?: string;
      ret?: {
        companyId: string;
        companyName: string;
        customerName: string;
        items: any[];
        total: number;
      };
    };

    if (!email || !ret) {
      res.status(400).json({ error: "Email and return are required." });
      return;
    }

    const workspaceId = await getWorkspaceId(email.trim().toLowerCase());
    if (!workspaceId) {
      res.status(400).json({ error: "User has no workspace." });
      return;
    }

    await db.update(returnsTable).set({
      companyId: ret.companyId ?? "",
      companyName: ret.companyName ?? "",
      customerName: ret.customerName ?? "",
      itemsJson: JSON.stringify(ret.items),
      total: ret.total,
      updatedAt: new Date(),
    }).where(and(eq(returnsTable.id, id), eq(returnsTable.workspaceId, workspaceId)));

    res.json({ success: true });
  } catch (err: any) {
    console.error("returns/put error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to update return." });
  }
});

router.delete("/returns/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const email = (req.query.email as string)?.trim().toLowerCase();
    const permanent = req.query.permanent === "true";

    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const workspaceId = await getWorkspaceId(email);
    if (!workspaceId) {
      res.status(400).json({ error: "User has no workspace." });
      return;
    }

    if (permanent) {
      await db.delete(returnsTable).where(and(eq(returnsTable.id, id), eq(returnsTable.workspaceId, workspaceId)));
    } else {
      await db.update(returnsTable).set({ deletedAt: new Date() })
        .where(and(eq(returnsTable.id, id), eq(returnsTable.workspaceId, workspaceId)));
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("returns/delete error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to delete return." });
  }
});

router.post("/returns/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body as { email?: string };

    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const workspaceId = await getWorkspaceId(email.trim().toLowerCase());
    if (!workspaceId) {
      res.status(400).json({ error: "User has no workspace." });
      return;
    }

    await db.update(returnsTable).set({ deletedAt: null })
      .where(and(eq(returnsTable.id, id), eq(returnsTable.workspaceId, workspaceId)));

    res.json({ success: true });
  } catch (err: any) {
    console.error("returns/restore error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to restore return." });
  }
});

export default router;
