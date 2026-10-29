
import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { startPrivateChat,getMyConversations } from "../controllers/conversationController";

const router = Router();
router.get("/", authenticateToken, getMyConversations);

router.post(
  "/private/:userId",
  authenticateToken,
  startPrivateChat
);

export default router;
