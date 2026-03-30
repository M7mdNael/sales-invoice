import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, workspacesTable, employeesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { email, firstName, lastName, employeeId } = req.body as {
      email?: string;
      firstName?: string;
      lastName?: string;
      employeeId?: string;
    };

    if (!email || !firstName) {
      res.status(400).json({ error: "Email and first name are required." });
      return;
    }

    const emailKey = email.trim().toLowerCase();
    const first = firstName.trim();
    const last = (lastName ?? "").trim();

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, emailKey)).limit(1);
    let workspaceId: string;

    if (existing.length > 0 && existing[0].workspaceId) {
      workspaceId = existing[0].workspaceId;
    } else {
      workspaceId = randomUUID();
      await db.insert(workspacesTable).values({
        id: workspaceId,
        inviteCode: randomUUID().replace(/-/g, "").substring(0, 6).toUpperCase(),
        ownerEmail: emailKey,
      }).onConflictDoNothing();

      await db.insert(usersTable).values({
        email: emailKey,
        firstName: first,
        lastName: last,
        phone: "",
        workspaceId,
      }).onConflictDoUpdate({
        target: usersTable.email,
        set: { workspaceId },
      });
    }

    const existingEmployees = await db.select().from(employeesTable)
      .where(eq(employeesTable.email, emailKey));
    const isFirstEmployee = existingEmployees.length === 0;

    let resolvedEmployeeId: string;
    let isAdmin: boolean;

    if (employeeId) {
      const existingEmp = await db.select().from(employeesTable)
        .where(and(eq(employeesTable.id, employeeId), eq(employeesTable.email, emailKey)))
        .limit(1);

      if (existingEmp.length > 0) {
        await db.update(employeesTable).set({ firstName: first, lastName: last })
          .where(eq(employeesTable.id, employeeId));
        resolvedEmployeeId = employeeId;
        isAdmin = existingEmp[0].isAdmin;
      } else {
        resolvedEmployeeId = employeeId;
        isAdmin = isFirstEmployee;
        await db.insert(employeesTable).values({
          id: resolvedEmployeeId,
          email: emailKey,
          firstName: first,
          lastName: last,
          isAdmin,
        }).onConflictDoUpdate({
          target: employeesTable.id,
          set: { firstName: first, lastName: last },
        });
      }
    } else {
      resolvedEmployeeId = randomUUID();
      isAdmin = isFirstEmployee;
      await db.insert(employeesTable).values({
        id: resolvedEmployeeId,
        email: emailKey,
        firstName: first,
        lastName: last,
        isAdmin,
      });
    }

    res.json({ success: true, workspaceId, employeeId: resolvedEmployeeId, isAdmin });
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

    res.json({ ...users[0] });
  } catch (err: any) {
    console.error("auth/profile error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to load profile." });
  }
});

export default router;
