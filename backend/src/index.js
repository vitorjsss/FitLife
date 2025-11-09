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
import dailyMealRegistryRoutes from "./routes/dailyMealRegistryRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import mealRecordRoutes from "./routes/mealRecordRoutes.js";
import mealItemRoutes from "./routes/mealItemRoutes.js";
import workoutRoutes from "./routes/workoutRoutes.js";
import workoutSessionRoutes from "./routes/workoutSessionRoutes.js";
import healthCheckRoutes from "./routes/healthCheckRoutes.js";
import backupRoutes from "./routes/backupRoutes.js";
import mealCalendarRoutes from "./routes/mealCalendarRoutes.js";
import patientProfessionalAssociationRoutes from "./routes/patientProfessionalAssociationRoutes.js";
import patientConnectionCodeRoutes from "./routes/patientConnectionCodeRoutes.js";
import availabilityMonitor from "./middlewares/availabilityMonitor.js";
import BackupScheduler from "./schedulers/BackupScheduler.js";

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
app.use("/daily-meal-registry", dailyMealRegistryRoutes);
app.use("/food", foodRoutes);
app.use("/meal-record", mealRecordRoutes);
app.use("/meal-item", mealItemRoutes);
app.use("/workout", workoutRoutes);
app.use("/workout-session", workoutSessionRoutes);
app.use("/meal-calendar", mealCalendarRoutes);
app.use("/patient-professional-association", patientProfessionalAssociationRoutes);
app.use("/patient-connection-code", patientConnectionCodeRoutes);
app.use("/backup", backupRoutes);
app.use("/uploads/avatars", express.static("uploads/avatars"));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`FitLife Backend rodando na porta ${PORT} 🚀`);

    // Inicia agendamento de backups automáticos (RNF1.2)
    BackupScheduler.start();
});