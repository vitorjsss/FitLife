import express from "express";
import { MealCalendarController } from "../controllers/MealCalendarController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET /meal-calendar/:patientId/monthly?year=2025&month=11
router.get("/:patientId/monthly", authMiddleware, MealCalendarController.getMonthlyProgress);

// GET /meal-calendar/:patientId/day?date=2025-11-08
router.get("/:patientId/day", authMiddleware, MealCalendarController.getDayDetails);

export default router;
