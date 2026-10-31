
import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { savePushSubscription } from "../controllers/pushController";

const router = Router();

router.post(
  "/subscribe",
  authenticateToken,
  savePushSubscription
);

export default router;
