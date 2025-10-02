import express from "express";
import { MealRecordController } from "../controllers/MealRecordController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Todas as rotas de meal record requerem autenticação
router.use(authMiddleware);

// Rotas para registros de refeição
router.post("/", MealRecordController.create);
router.get("/", MealRecordController.getAll);
router.get("/registry/:registryId", MealRecordController.getByDailyMealRegistryId);
router.get("/with-items/:id", MealRecordController.getWithItems);
router.get("/:id", MealRecordController.getById);
router.put("/:id", MealRecordController.update);
router.delete("/:id", MealRecordController.deleteMealRecord);

export default router;