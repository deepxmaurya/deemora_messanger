
import { Router } from "express";
import { registerUser,searchUsers } from "../controllers/userController";
import {loginUser,getMyProfile} from "../controllers/userLogin";
import {
  authenticateToken
} from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticateToken, getMyProfile);
router.get("/search", authenticateToken, searchUsers);

export default router;
