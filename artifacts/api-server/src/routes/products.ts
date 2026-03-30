import { Router } from "express";
import { db, productsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function getWorkspaceId(email: string): Promise<string | null> {
  const users = await db.select({ workspaceId: usersTable.workspaceId })
    .from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  return users[0]?.workspaceId ?? null;
}

router.get("/products", async (req, res) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) { res.status(400).json({ error: "Email is required." }); return; }

    const workspaceId = await getWorkspaceId(email);
    if (!workspaceId) { res.json({ products: [] }); return; }

    const rows = await db.select().from(productsTable)
      .where(eq(productsTable.workspaceId, workspaceId));

    const products = rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: r.price,
    }));

    res.json({ products });
  } catch (err: any) {
    console.error("products/get error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to load products." });
  }
});

router.post("/products", async (req, res) => {
  try {
    const { email, product } = req.body as {
      email?: string;
      product?: { id?: string; name?: string; price?: number };
    };
    if (!email || !product?.id || !product?.name || product?.price === undefined) {
      res.status(400).json({ error: "email, product.id, product.name, and product.price are required." });
      return;
    }

    const workspaceId = await getWorkspaceId(email.toLowerCase());
    if (!workspaceId) { res.status(400).json({ error: "User has no workspace." }); return; }

    await db.insert(productsTable).values({
      id: product.id,
      workspaceId,
      name: product.name.trim(),
      price: product.price,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: productsTable.id,
      set: {
        name: product.name.trim(),
        price: product.price,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("products/post error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to save product." });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) { res.status(400).json({ error: "Email is required." }); return; }

    const workspaceId = await getWorkspaceId(email);
    if (!workspaceId) { res.status(400).json({ error: "User has no workspace." }); return; }

    await db.delete(productsTable).where(
      and(eq(productsTable.id, id), eq(productsTable.workspaceId, workspaceId))
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error("products/delete error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to delete product." });
  }
});

export default router;
