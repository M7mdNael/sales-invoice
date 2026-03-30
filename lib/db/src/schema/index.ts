import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  email: text("email").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  workspaceId: text("workspace_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workspacesTable = pgTable("workspaces", {
  id: text("id").primaryKey(),
  inviteCode: text("invite_code").notNull().unique(),
  ownerEmail: text("owner_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoicesTable = pgTable("invoices", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  companyId: text("company_id").notNull().default(""),
  companyName: text("company_name").notNull().default(""),
  customerName: text("customer_name").notNull(),
  date: text("date").notNull(),
  itemsJson: text("items_json").notNull(),
  total: real("total").notNull(),
  creatorEmail: text("creator_email").notNull(),
  creatorName: text("creator_name").notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const returnsTable = pgTable("returns", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  returnNumber: text("return_number").notNull(),
  originalInvoiceId: text("original_invoice_id").notNull().default(""),
  originalInvoiceNumber: text("original_invoice_number").notNull().default(""),
  companyId: text("company_id").notNull().default(""),
  companyName: text("company_name").notNull().default(""),
  customerName: text("customer_name").notNull().default(""),
  date: text("date").notNull(),
  itemsJson: text("items_json").notNull(),
  total: real("total").notNull(),
  creatorEmail: text("creator_email").notNull(),
  creatorName: text("creator_name").notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companiesTable = pgTable("companies", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull(),
  notes: text("notes").notNull().default(""),
  ownerEmail: text("owner_email").notNull().default(""),
  membersJson: text("members_json").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type Workspace = typeof workspacesTable.$inferSelect;
export type Invoice = typeof invoicesTable.$inferSelect;
export type Return = typeof returnsTable.$inferSelect;
export type CompanyRow = typeof companiesTable.$inferSelect;
export type ProductRow = typeof productsTable.$inferSelect;
