import express from "express";
import { MealItemController } from "../controllers/MealItemController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Todas as rotas de meal item requerem autenticação
router.use(authMiddleware);

// Rotas para itens de refeição
router.post("/", MealItemController.create);
router.get("/", MealItemController.getAll);
router.get("/meal/:mealId", MealItemController.getByMealId);
router.get("/:id", MealItemController.getById);
router.put("/:id", MealItemController.update);
router.delete("/:id", MealItemController.deleteMealItem);

export default router;