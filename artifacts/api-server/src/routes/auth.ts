import { Router } from "express";
import { db, employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.username, username));
  if (!employee || !verifyPassword(password, employee.passwordHash)) {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    return;
  }
  if (employee.status === "inactive") {
    res.status(401).json({ error: "الحساب معطل" });
    return;
  }
  const token = generateToken(employee.id);
  const { passwordHash: _, ...safeEmployee } = employee;
  res.json({ token, employee: safeEmployee });
});

router.post("/auth/logout", (req, res) => {
  res.json({ message: "تم تسجيل الخروج بنجاح" });
});

router.get("/auth/me", requireAuth, (req, res) => {
  const employee = (req as any).employee;
  const { passwordHash: _, ...safeEmployee } = employee;
  res.json(safeEmployee);
});

export default router;
