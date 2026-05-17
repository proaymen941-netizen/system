import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import employeesRouter from "./employees";
import attendanceRouter from "./attendance";
import leavesRouter from "./leaves";
import overtimeRouter from "./overtime";
import announcementsRouter from "./announcements";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(employeesRouter);
router.use(attendanceRouter);
router.use(leavesRouter);
router.use(overtimeRouter);
router.use(announcementsRouter);
router.use(reportsRouter);

export default router;
