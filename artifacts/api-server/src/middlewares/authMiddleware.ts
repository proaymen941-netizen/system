import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";
import { db } from "@workspace/db";
import { employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, payload.employeeId));
  if (!employee || employee.status === "inactive") {
    res.status(401).json({ error: "Employee not found or inactive" });
    return;
  }
  (req as any).employee = employee;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const employee = (req as any).employee;
    if (!employee || !roles.includes(employee.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
