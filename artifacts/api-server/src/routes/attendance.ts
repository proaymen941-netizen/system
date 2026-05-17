import { Router } from "express";
import { db, attendanceTable, employeesTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.post("/attendance/checkin", requireAuth, async (req, res) => {
  const employee = (req as any).employee;
  const { latitude, longitude, notes } = req.body;
  const today = new Date().toISOString().split("T")[0];

  const existing = await db.select().from(attendanceTable)
    .where(and(eq(attendanceTable.employeeId, employee.id), eq(attendanceTable.date, today)));
  if (existing.length > 0 && existing[0].checkInTime) {
    res.status(400).json({ error: "لقد قمت بتسجيل الحضور بالفعل اليوم" });
    return;
  }

  const now = new Date();
  const hour = now.getHours();
  const status = hour >= 9 ? "late" : "present";

  if (existing.length > 0) {
    const [record] = await db.update(attendanceTable)
      .set({ checkInTime: now, checkInLat: latitude, checkInLng: longitude, status, notes })
      .where(eq(attendanceTable.id, existing[0].id))
      .returning();
    res.status(201).json({ ...record, employeeName: employee.name });
  } else {
    const [record] = await db.insert(attendanceTable).values({
      employeeId: employee.id,
      date: today,
      checkInTime: now,
      checkInLat: latitude,
      checkInLng: longitude,
      status,
      notes,
    }).returning();
    res.status(201).json({ ...record, employeeName: employee.name });
  }
});

router.post("/attendance/checkout", requireAuth, async (req, res) => {
  const employee = (req as any).employee;
  const { latitude, longitude, notes } = req.body;
  const today = new Date().toISOString().split("T")[0];

  const [record] = await db.select().from(attendanceTable)
    .where(and(eq(attendanceTable.employeeId, employee.id), eq(attendanceTable.date, today)));
  if (!record || !record.checkInTime) {
    res.status(400).json({ error: "لم تقم بتسجيل الحضور بعد" });
    return;
  }
  if (record.checkOutTime) {
    res.status(400).json({ error: "لقد قمت بتسجيل الانصراف بالفعل" });
    return;
  }

  const now = new Date();
  const checkIn = new Date(record.checkInTime);
  const totalHours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

  const [updated] = await db.update(attendanceTable)
    .set({ checkOutTime: now, checkOutLat: latitude, checkOutLng: longitude, totalHours: Math.round(totalHours * 100) / 100, notes: notes || record.notes })
    .where(eq(attendanceTable.id, record.id))
    .returning();
  res.json({ ...updated, employeeName: employee.name });
});

router.get("/attendance/today", requireAuth, async (req, res) => {
  const employee = (req as any).employee;
  const today = new Date().toISOString().split("T")[0];
  const [record] = await db.select().from(attendanceTable)
    .where(and(eq(attendanceTable.employeeId, employee.id), eq(attendanceTable.date, today)));
  res.json(record ? { ...record, employeeName: employee.name } : null);
});

router.get("/attendance/live", requireAuth, async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const records = await db.select({ att: attendanceTable, emp: employeesTable })
    .from(attendanceTable)
    .leftJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id))
    .where(and(eq(attendanceTable.date, today)));

  const activeEmployees = await db.select().from(employeesTable).where(eq(employeesTable.status, "active"));
  const checkedIn = records.filter(r => r.att.checkInTime && !r.att.checkOutTime);

  res.json({
    checkedIn: checkedIn.length,
    total: activeEmployees.length,
    records: checkedIn.map(r => ({ ...r.att, employeeName: r.emp?.name })),
  });
});

router.get("/attendance", requireAuth, async (req, res) => {
  const { employeeId, date, startDate, endDate } = req.query as Record<string, string>;
  const currentEmployee = (req as any).employee;

  let query = db.select({ att: attendanceTable, emp: employeesTable })
    .from(attendanceTable)
    .leftJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id));

  const records = await query;
  let filtered = records;

  const targetId = employeeId ? parseInt(employeeId) :
    (currentEmployee.role === "employee" ? currentEmployee.id : undefined);
  if (targetId) filtered = filtered.filter(r => r.att.employeeId === targetId);
  if (date) filtered = filtered.filter(r => r.att.date === date);
  if (startDate) filtered = filtered.filter(r => r.att.date >= startDate);
  if (endDate) filtered = filtered.filter(r => r.att.date <= endDate);

  res.json(filtered.map(r => ({ ...r.att, employeeName: r.emp?.name })));
});

export default router;
