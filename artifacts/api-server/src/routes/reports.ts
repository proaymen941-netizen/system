import { Router } from "express";
import { db, attendanceTable, employeesTable, leavesTable, overtimeTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.get("/reports/dashboard", requireAuth, async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;

  const [activeEmployees, todayRecords, pendingLeaves, pendingOt, monthRecords] = await Promise.all([
    db.select().from(employeesTable).where(eq(employeesTable.status, "active")),
    db.select().from(attendanceTable).where(eq(attendanceTable.date, today)),
    db.select().from(leavesTable).where(eq(leavesTable.status, "pending")),
    db.select().from(overtimeTable).where(eq(overtimeTable.status, "pending")),
    db.select().from(attendanceTable).where(and(gte(attendanceTable.date, monthStart), lte(attendanceTable.date, monthEnd))),
  ]);

  const todayPresent = todayRecords.filter(r => r.status === "present" || r.status === "late").length;
  const todayLate = todayRecords.filter(r => r.status === "late").length;
  const todayAbsent = activeEmployees.length - todayPresent;

  const workDays = Math.max(1, new Date().getDate());
  const expectedAttendance = activeEmployees.length * workDays;
  const actualAttendance = monthRecords.filter(r => r.status === "present" || r.status === "late").length;
  const monthlyAttendanceRate = expectedAttendance > 0 ? Math.round((actualAttendance / expectedAttendance) * 100) : 0;

  const recentActivity = todayRecords.slice(0, 5).map(r => ({
    type: r.checkOutTime ? "checkout" : "checkin",
    employeeName: "موظف",
    time: (r.checkOutTime || r.checkInTime || new Date()).toString(),
    description: r.checkOutTime ? "سجّل الانصراف" : "سجّل الحضور",
  }));

  res.json({
    todayPresent,
    todayAbsent,
    todayLate,
    totalEmployees: activeEmployees.length,
    pendingLeaves: pendingLeaves.length,
    pendingOvertime: pendingOt.length,
    monthlyAttendanceRate,
    recentActivity,
  });
});

router.get("/reports/daily", requireAuth, async (req, res) => {
  const { date } = req.query as { date: string };
  if (!date) { res.status(400).json({ error: "Date required" }); return; }

  const [activeEmployees, records] = await Promise.all([
    db.select().from(employeesTable).where(eq(employeesTable.status, "active")),
    db.select({ att: attendanceTable, emp: employeesTable })
      .from(attendanceTable)
      .leftJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id))
      .where(eq(attendanceTable.date, date)),
  ]);

  const present = records.filter(r => r.att.status === "present" || r.att.status === "late").length;
  const late = records.filter(r => r.att.status === "late").length;
  const absent = activeEmployees.length - present;

  res.json({
    date,
    totalEmployees: activeEmployees.length,
    present,
    absent,
    late,
    records: records.map(r => ({ ...r.att, employeeName: r.emp?.name })),
  });
});

router.get("/reports/monthly", requireAuth, async (req, res) => {
  const { year, month, employeeId } = req.query as Record<string, string>;
  if (!year || !month) { res.status(400).json({ error: "Year and month required" }); return; }

  const y = parseInt(year);
  const m = parseInt(month);
  const monthStart = `${y}-${String(m).padStart(2, "0")}-01`;
  const monthEnd = `${y}-${String(m).padStart(2, "0")}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;

  const [employees, attRecords, leaveRecords, otRecords] = await Promise.all([
    db.select().from(employeesTable).where(eq(employeesTable.status, "active")),
    db.select().from(attendanceTable).where(and(gte(attendanceTable.date, monthStart), lte(attendanceTable.date, monthEnd))),
    db.select().from(leavesTable).where(and(gte(leavesTable.startDate, monthStart), lte(leavesTable.endDate, monthEnd), eq(leavesTable.status, "approved"))),
    db.select().from(overtimeTable).where(and(gte(overtimeTable.date, monthStart), lte(overtimeTable.date, monthEnd), eq(overtimeTable.status, "approved"))),
  ]);

  const totalWorkDays = new Date(y, m, 0).getDate();
  let targetEmployees = employees;
  if (employeeId) targetEmployees = employees.filter(e => e.id === parseInt(employeeId));

  const employeeSummaries = targetEmployees.map(emp => {
    const empAtt = attRecords.filter(r => r.employeeId === emp.id);
    const empLeaves = leaveRecords.filter(r => r.employeeId === emp.id);
    const empOt = otRecords.filter(r => r.employeeId === emp.id);

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      presentDays: empAtt.filter(r => r.status === "present" || r.status === "late").length,
      absentDays: empAtt.filter(r => r.status === "absent").length,
      lateDays: empAtt.filter(r => r.status === "late").length,
      totalHours: empAtt.reduce((sum, r) => sum + (r.totalHours || 0), 0),
      leavedays: empLeaves.reduce((sum, r) => sum + (r.days || 0), 0),
      overtimeHours: empOt.reduce((sum, r) => sum + (r.hours || 0), 0),
    };
  });

  res.json({ year: y, month: m, totalWorkDays, employeeSummaries });
});

export default router;
