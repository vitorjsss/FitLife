import express from "express";
import { AuthController } from "../controllers/AuthController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/all", authenticateToken, AuthController.getUsers);

export default router;
