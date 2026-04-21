import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import doctorRouter from "./doctor";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import prescriptionsRouter from "./prescriptions";
import remindersRouter from "./reminders";
import dashboardRouter from "./dashboard";
import debugRouter from "./debug";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(doctorRouter);
router.use(dashboardRouter);
router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(prescriptionsRouter);
router.use(remindersRouter);
router.use(debugRouter);

export default router;
