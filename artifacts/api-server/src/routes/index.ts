import { Router, type IRouter } from "express";
import healthRouter from "./health";
import verifyRouter from "./verify";
import authRouter from "./auth";
import workspaceRouter from "./workspace";
import invoicesRouter from "./invoices";
import returnsRouter from "./returns";
import companiesRouter from "./companies";
import productsRouter from "./products";

const router: IRouter = Router();

router.use(healthRouter);
router.use(verifyRouter);
router.use(authRouter);
router.use(workspaceRouter);
router.use(invoicesRouter);
router.use(returnsRouter);
router.use(companiesRouter);
router.use(productsRouter);

export default router;
