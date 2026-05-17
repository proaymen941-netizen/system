import { pgTable, serial, integer, text, real, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";

export const overtimeTable = pgTable("overtime", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employeesTable.id),
  date: date("date").notNull(),
  hours: real("hours").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by"),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOvertimeSchema = createInsertSchema(overtimeTable).omit({ id: true, createdAt: true });
export type InsertOvertime = z.infer<typeof insertOvertimeSchema>;
export type Overtime = typeof overtimeTable.$inferSelect;
