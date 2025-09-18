import express from "express";
import { PatientController } from "../controllers/PatientController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", authenticateToken, PatientController.create);
router.get("/all", authenticateToken, PatientController.getAll);
router.get("/:id", authenticateToken, PatientController.getById);
router.patch("/:id", authenticateToken, PatientController.update);

export default router;