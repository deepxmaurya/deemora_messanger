
import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage
} from "../controllers/messageController";

const router = Router();

router.get("/:conversationId", authenticateToken, getMessages);
router.post("/:conversationId", authenticateToken, sendMessage);
router.post( "/:conversationId/read",authenticateToken,markMessagesAsRead);
router.patch("/:messageId", authenticateToken, editMessage);
router.delete("/:messageId", authenticateToken, deleteMessage);

export default router;
