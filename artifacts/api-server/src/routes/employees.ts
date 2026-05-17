import { Router } from "express";
import { db, employeesTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { hashPassword } from "../lib/auth";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.get("/employees", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  const { department, status, search } = req.query as Record<string, string>;
  let employees = await db.select().from(employeesTable);
  if (department) employees = employees.filter(e => e.department === department);
  if (status) employees = employees.filter(e => e.status === status);
  if (search) employees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.username.toLowerCase().includes(search.toLowerCase()) ||
    (e.nameAr && e.nameAr.includes(search))
  );
  res.json(employees.map(({ passwordHash: _, ...e }) => e));
});

router.post("/employees", requireAuth, requireRole("admin"), async (req, res) => {
  const { password, ...rest } = req.body;
  if (!password) {
    res.status(400).json({ error: "Password required" });
    return;
  }
  const passwordHash = hashPassword(password);
  const [employee] = await db.insert(employeesTable).values({ ...rest, passwordHash }).returning();
  const { passwordHash: _, ...safe } = employee;
  res.status(201).json(safe);
});

router.get("/employees/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, id));
  if (!employee) { res.status(404).json({ error: "Employee not found" }); return; }
  const { passwordHash: _, ...safe } = employee;
  res.json(safe);
});

router.patch("/employees/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  const id = parseInt(req.params.id);
  const { password, ...updateData } = req.body;
  const updates: Record<string, unknown> = { ...updateData };
  if (password) updates.passwordHash = hashPassword(password);
  const [employee] = await db.update(employeesTable).set(updates).where(eq(employeesTable.id, id)).returning();
  if (!employee) { res.status(404).json({ error: "Employee not found" }); return; }
  const { passwordHash: _, ...safe } = employee;
  res.json(safe);
});

router.delete("/employees/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  await db.update(employeesTable).set({ status: "inactive" }).where(eq(employeesTable.id, id));
  res.json({ message: "تم تعطيل الموظف بنجاح" });
});

export default router;
