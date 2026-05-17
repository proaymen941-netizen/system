import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  role: text("role").notNull().default("employee"),
  department: text("department"),
  position: text("position"),
  phone: text("phone"),
  email: text("email"),
  status: text("status").notNull().default("active"),
  workLocationLat: real("work_location_lat"),
  workLocationLng: real("work_location_lng"),
  workLocationRadius: real("work_location_radius").default(500),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, createdAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
