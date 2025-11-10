import path from 'path';
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import { authenticateToken } from "./middlewares/authMiddleware.js";
import physicalEducatorRoutes from "./routes/PhysicalEducatorRoutes.js";
import nutricionistRoutes from "./routes/nutricionistRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import mealRecordRoutes from "./routes/mealRecordRoutes.js";
import mealCalendarRoutes from "./routes/mealCalendarRoutes.js";
import workoutRecordRoutes from "./routes/workoutRecordRoutes.js";
import workoutCalendarRoutes from "./routes/workoutCalendarRoutes.js";
import healthCheckRoutes from "./routes/healthCheckRoutes.js";
import backupRoutes from "./routes/backupRoutes.js";
import patientProfessionalAssociationRoutes from "./routes/patientProfessionalAssociationRoutes.js";
import patientConnectionCodeRoutes from "./routes/patientConnectionCodeRoutes.js";
import availabilityMonitor from "./middlewares/availabilityMonitor.js";
import BackupScheduler from "./schedulers/BackupScheduler.js";
import CodeCleanupScheduler from "./schedulers/CodeCleanupScheduler.js";

const app = express();
app.use(cors());
app.use(express.json());

// Middleware de monitoramento de disponibilidade (RNF1.0)
app.use(availabilityMonitor);

// Health Check (público, não requer autenticação)
app.use("/health", healthCheckRoutes);

app.use("/auth", authRoutes);
app.use("/patient", patientRoutes);
app.use("/physical-educator", physicalEducatorRoutes);
app.use("/nutricionist", nutricionistRoutes);
app.use("/logs", authenticateToken, logRoutes);
app.use("/food", foodRoutes);
app.use("/meal-record", mealRecordRoutes);
app.use("/meal-calendar", mealCalendarRoutes);
app.use("/workout-record", workoutRecordRoutes);
app.use("/workout-calendar", workoutCalendarRoutes);
app.use("/patient-professional-association", patientProfessionalAssociationRoutes);
app.use("/patient-connection-code", patientConnectionCodeRoutes);
app.use("/backup", backupRoutes);
app.use("/uploads/avatars", express.static("uploads/avatars"));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const PORT = process.env.PORT || 5001;

// Só inicia o servidor se não estiver em modo de teste
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`FitLife Backend rodando na porta ${PORT} 🚀`);

        // Inicia agendamento de backups automáticos (RNF1.2)
        BackupScheduler.start();

        // Inicia limpeza automática de códigos expirados
        CodeCleanupScheduler.start();
        console.log('📅 Agendadores inicializados: Backup e Limpeza de Códigos');
    });
}

// Exporta o app para testes
export default app;
