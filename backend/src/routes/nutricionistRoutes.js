import express from "express";
import { NutricionistController } from "../controllers/NutricionistController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", authenticateToken, NutricionistController.create);
router.get("/all", authenticateToken, NutricionistController.getAll);
router.get("/:id", authenticateToken, NutricionistController.getById);
router.patch("/:id", authenticateToken, NutricionistController.update);
router.delete("/:id", authenticateToken, NutricionistController.deleteNutricionist);

export default router;