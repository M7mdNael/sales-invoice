import { Router } from "express";
import { db } from "@workspace/db";
import { invoicesTable, usersTable } from "@workspace/db";
import { eq, and, isNull, isNotNull } from "drizzle-orm";

const router = Router();

async function getWorkspaceId(email: string): Promise<string | null> {
  const users = await db.select({ workspaceId: usersTable.workspaceId })
    .from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  return users[0]?.workspaceId ?? null;
}

router.get("/invoices", async (req, res) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    const includeDeleted = req.query.deleted === "true";

    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const workspaceId = await getWorkspaceId(email);
    if (!workspaceId) {
      res.json({ invoices: [] });
      return;
    }

    const rows = includeDeleted
      ? await db.select().from(invoicesTable)
          .where(and(eq(invoicesTable.workspaceId, workspaceId), isNotNull(invoicesTable.deletedAt)))
      : await db.select().from(invoicesTable)
          .where(and(eq(invoicesTable.workspaceId, workspaceId), isNull(invoicesTable.deletedAt)));

    const invoices = rows.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoiceNumber,
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

    res.json({ invoices });
  } catch (err: any) {
    console.error("invoices/get error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to load invoices." });
  }
});

router.post("/invoices", async (req, res) => {
  try {
    const { email, invoice } = req.body as {
      email?: string;
      invoice?: {
        id: string;
        invoiceNumber: string;
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

    if (!email || !invoice) {
      res.status(400).json({ error: "Email and invoice are required." });
      return;
    }

    const workspaceId = await getWorkspaceId(email.trim().toLowerCase());
    if (!workspaceId) {
      res.status(400).json({ error: "User has no workspace. Please complete registration." });
      return;
    }

    await db.insert(invoicesTable).values({
      id: invoice.id,
      workspaceId,
      invoiceNumber: invoice.invoiceNumber,
      companyId: invoice.companyId ?? "",
      companyName: invoice.companyName ?? "",
      customerName: invoice.customerName,
      date: invoice.date,
      itemsJson: JSON.stringify(invoice.items),
      total: invoice.total,
      creatorEmail: invoice.creatorEmail,
      creatorName: invoice.creatorName,
    });

    res.json({ success: true, id: invoice.id });
  } catch (err: any) {
    console.error("invoices/post error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to create invoice." });
  }
});

router.put("/invoices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, invoice } = req.body as {
      email?: string;
      invoice?: {
        companyId: string;
        companyName: string;
        customerName: string;
        items: any[];
        total: number;
      };
    };

    if (!email || !invoice) {
      res.status(400).json({ error: "Email and invoice are required." });
      return;
    }

    const workspaceId = await getWorkspaceId(email.trim().toLowerCase());
    if (!workspaceId) {
      res.status(400).json({ error: "User has no workspace." });
      return;
    }

    await db.update(invoicesTable).set({
      companyId: invoice.companyId ?? "",
      companyName: invoice.companyName ?? "",
      customerName: invoice.customerName,
      itemsJson: JSON.stringify(invoice.items),
      total: invoice.total,
      updatedAt: new Date(),
    }).where(and(eq(invoicesTable.id, id), eq(invoicesTable.workspaceId, workspaceId)));

    res.json({ success: true });
  } catch (err: any) {
    console.error("invoices/put error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to update invoice." });
  }
});

router.delete("/invoices/:id", async (req, res) => {
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
      await db.delete(invoicesTable).where(and(eq(invoicesTable.id, id), eq(invoicesTable.workspaceId, workspaceId)));
    } else {
      await db.update(invoicesTable).set({ deletedAt: new Date() })
        .where(and(eq(invoicesTable.id, id), eq(invoicesTable.workspaceId, workspaceId)));
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("invoices/delete error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to delete invoice." });
  }
});

router.post("/invoices/:id/restore", async (req, res) => {
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

    await db.update(invoicesTable).set({ deletedAt: null })
      .where(and(eq(invoicesTable.id, id), eq(invoicesTable.workspaceId, workspaceId)));

    res.json({ success: true });
  } catch (err: any) {
    console.error("invoices/restore error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to restore invoice." });
  }
});

export default router;
