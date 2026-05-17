import { Router } from "express";
import { db, announcementsTable, employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.get("/announcements", requireAuth, async (req, res) => {
  const records = await db.select({ ann: announcementsTable, emp: employeesTable })
    .from(announcementsTable)
    .leftJoin(employeesTable, eq(announcementsTable.createdBy, employeesTable.id));
  res.json(records.map(r => ({ ...r.ann, createdByName: r.emp?.name })));
});

router.post("/announcements", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  const employee = (req as any).employee;
  const { title, content, priority } = req.body;
  const [ann] = await db.insert(announcementsTable).values({
    title,
    content,
    priority: priority || "normal",
    createdBy: employee.id,
  }).returning();
  res.status(201).json({ ...ann, createdByName: employee.name });
});

router.delete("/announcements/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  res.json({ message: "تم حذف الإعلان بنجاح" });
});

export default router;
