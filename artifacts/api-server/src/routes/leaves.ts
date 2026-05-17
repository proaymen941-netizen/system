import { Router } from "express";
import { db, leavesTable, employeesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.get("/leaves", requireAuth, async (req, res) => {
  const { employeeId, status } = req.query as Record<string, string>;
  const currentEmployee = (req as any).employee;

  const records = await db.select({ leave: leavesTable, emp: employeesTable })
    .from(leavesTable)
    .leftJoin(employeesTable, eq(leavesTable.employeeId, employeesTable.id));

  let filtered = records;
  if (currentEmployee.role === "employee") {
    filtered = filtered.filter(r => r.leave.employeeId === currentEmployee.id);
  } else if (employeeId) {
    filtered = filtered.filter(r => r.leave.employeeId === parseInt(employeeId));
  }
  if (status) filtered = filtered.filter(r => r.leave.status === status);

  res.json(filtered.map(r => ({ ...r.leave, employeeName: r.emp?.name })));
});

router.post("/leaves", requireAuth, async (req, res) => {
  const employee = (req as any).employee;
  const { leaveType, startDate, endDate, reason } = req.body;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const [leave] = await db.insert(leavesTable).values({
    employeeId: employee.id,
    leaveType,
    startDate,
    endDate,
    days,
    reason,
    status: "pending",
  }).returning();
  res.status(201).json({ ...leave, employeeName: employee.name });
});

router.get("/leaves/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [record] = await db.select({ leave: leavesTable, emp: employeesTable })
    .from(leavesTable)
    .leftJoin(employeesTable, eq(leavesTable.employeeId, employeesTable.id))
    .where(eq(leavesTable.id, id));
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...record.leave, employeeName: record.emp?.name });
});

router.post("/leaves/:id/approve", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  const id = parseInt(req.params.id);
  const reviewer = (req as any).employee;
  const [leave] = await db.update(leavesTable)
    .set({ status: "approved", reviewedBy: reviewer.id })
    .where(eq(leavesTable.id, id))
    .returning();
  res.json(leave);
});

router.post("/leaves/:id/reject", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  const id = parseInt(req.params.id);
  const reviewer = (req as any).employee;
  const { note } = req.body || {};
  const [leave] = await db.update(leavesTable)
    .set({ status: "rejected", reviewedBy: reviewer.id, reviewNote: note })
    .where(eq(leavesTable.id, id))
    .returning();
  res.json(leave);
});

export default router;
