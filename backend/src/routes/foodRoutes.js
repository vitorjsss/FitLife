import express from "express";
import { FoodController } from "../controllers/FoodController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Todas as rotas de food requerem autenticação
router.use(authMiddleware);

// Rotas para alimentos
router.post("/", FoodController.create);
router.get("/", FoodController.getAll);
router.get("/search/:name", FoodController.searchByName);
router.get("/:id", FoodController.getById);
router.put("/:id", FoodController.update);
router.delete("/:id", FoodController.deleteFood);

export default router;