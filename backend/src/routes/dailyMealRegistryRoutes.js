import express from "express";
import { DailyMealRegistryController } from "../controllers/DailyMealRegistryController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Todas as rotas de daily meal registry requerem autenticação
router.use(authMiddleware);

// Rotas para registro diário de refeições
router.post("/", DailyMealRegistryController.create);
router.get("/", DailyMealRegistryController.getAll);
router.get("/patient/:patientId", DailyMealRegistryController.getByPatientId);
router.get("/:id", DailyMealRegistryController.getById);
router.put("/:id", DailyMealRegistryController.update);
router.delete("/:id", DailyMealRegistryController.deleteDailyMealRegistry);

export default router;