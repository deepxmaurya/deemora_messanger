import { Router } from "express";
import { getAllUsers } from "../controllers/adminController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/users", authenticateToken, getAllUsers);

export default router;