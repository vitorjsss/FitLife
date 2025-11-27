import express from "express";
import { AuthController } from "../controllers/AuthController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/all", authenticateToken, AuthController.getUsers);
router.get("/by-id/:authId", authenticateToken, AuthController.getAuthById);

// reauth endpoints
router.post("/reauth/request", AuthController.requestReauth);
router.post("/reauth/verify", AuthController.verifyReauth);

// protected updates require reauthToken
router.post("/update-email", authenticateToken, AuthController.updateEmail);
router.post("/update-password", authenticateToken, AuthController.updatePassword);

// Password reset routes (public - sem autenticação)
router.post("/request-password-reset", AuthController.requestPasswordReset);
router.post("/verify-password-reset-code", AuthController.verifyPasswordResetCode);
router.post("/reset-password", AuthController.resetPassword);

// Change password route (authenticated)
router.post("/change-password", authenticateToken, AuthController.changePassword);

export default router;