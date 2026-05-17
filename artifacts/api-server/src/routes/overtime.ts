import { Router } from "express";
import { db, overtimeTable, employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.get("/overtime", requireAuth, async (req, res) => {
  const { employeeId, status } = req.query as Record<string, string>;
  const currentEmployee = (req as any).employee;

  const records = await db.select({ ot: overtimeTable, emp: employeesTable })
    .from(overtimeTable)
    .leftJoin(employeesTable, eq(overtimeTable.employeeId, employeesTable.id));

  let filtered = records;
  if (currentEmployee.role === "employee") {
    filtered = filtered.filter(r => r.ot.employeeId === currentEmployee.id);
  } else if (employeeId) {
    filtered = filtered.filter(r => r.ot.employeeId === parseInt(employeeId));
  }
  if (status) filtered = filtered.filter(r => r.ot.status === status);

  res.json(filtered.map(r => ({ ...r.ot, employeeName: r.emp?.name })));
});

router.post("/overtime", requireAuth, async (req, res) => {
  const employee = (req as any).employee;
  const { date, hours, reason } = req.body;
  const [ot] = await db.insert(overtimeTable).values({
    employeeId: employee.id,
    date,
    hours,
    reason,
    status: "pending",
  }).returning();
  res.status(201).json({ ...ot, employeeName: employee.name });
});

router.post("/overtime/:id/approve", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  const id = parseInt(req.params.id);
  const reviewer = (req as any).employee;
  const [ot] = await db.update(overtimeTable)
    .set({ status: "approved", reviewedBy: reviewer.id })
    .where(eq(overtimeTable.id, id))
    .returning();
  res.json(ot);
});

router.post("/overtime/:id/reject", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  const id = parseInt(req.params.id);
  const reviewer = (req as any).employee;
  const { note } = req.body || {};
  const [ot] = await db.update(overtimeTable)
    .set({ status: "rejected", reviewedBy: reviewer.id, reviewNote: note })
    .where(eq(overtimeTable.id, id))
    .returning();
  res.json(ot);
});

export default router;
