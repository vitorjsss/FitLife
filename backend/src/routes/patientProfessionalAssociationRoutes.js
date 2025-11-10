import express from "express";
import { PatientProfessionalAssociationController } from "../controllers/PatientProfessionalAssociationController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { checkPatientAccess } from '../middlewares/patientAccessMiddleware.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas para associações
router.post("/", PatientProfessionalAssociationController.create);
router.get("/patient/:patientId", checkPatientAccess(), PatientProfessionalAssociationController.getByPatientId);
router.get("/nutricionist/:nutricionistId/patients", PatientProfessionalAssociationController.getPatientsByNutricionistId);
router.get("/physical-educator/:physicalEducatorId/patients", PatientProfessionalAssociationController.getPatientsByPhysicalEducatorId);
router.get("/:id", PatientProfessionalAssociationController.getById);
router.put("/:id", PatientProfessionalAssociationController.update);
router.put("/:id/deactivate", PatientProfessionalAssociationController.deactivate);
router.delete("/:id", PatientProfessionalAssociationController.delete);

export default router;
