import { Router, type IRouter } from "express";
import healthRouter from "./health";
import verifyRouter from "./verify";
import authRouter from "./auth";
import workspaceRouter from "./workspace";
import invoicesRouter from "./invoices";
import returnsRouter from "./returns";

const router: IRouter = Router();

router.use(healthRouter);
router.use(verifyRouter);
router.use(authRouter);
router.use(workspaceRouter);
router.use(invoicesRouter);
router.use(returnsRouter);

export default router;
