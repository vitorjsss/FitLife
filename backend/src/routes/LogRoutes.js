import express from "express";
import { LogController } from "../controllers/LogController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Criar um novo log
router.post("/", authenticateToken, LogController.create);

// Buscar todos os logs
router.get("/", authenticateToken, LogController.getAll);

// Buscar logs por usuário
router.get("/user/:userId", authenticateToken, LogController.getByUser);

// Buscar logs por ação
router.get("/action/:action", authenticateToken, LogController.getByAction);

// Buscar logs por período
router.get("/date-range", authenticateToken, LogController.getByDateRange);

// Deletar log
router.delete("/:id", authenticateToken, LogController.delete);

export default router;