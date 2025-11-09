import express from "express";
import { PatientConnectionCodeController } from "../controllers/PatientConnectionCodeController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Gerar código para paciente
router.post("/generate/:patientId", PatientConnectionCodeController.generateCode);

// Buscar código ativo do paciente
router.get("/active/:patientId", PatientConnectionCodeController.getActiveCode);

// Conectar profissional ao paciente usando código
router.post("/connect", PatientConnectionCodeController.connectWithCode);

// Deletar código do paciente
router.delete("/:patientId", PatientConnectionCodeController.deleteCode);

// Limpar códigos expirados (admin)
router.delete("/cleanup/expired", PatientConnectionCodeController.cleanupExpired);

export default router;
