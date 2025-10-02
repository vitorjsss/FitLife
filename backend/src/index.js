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

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/patient", patientRoutes);
app.use("/physical-educator", physicalEducatorRoutes);
app.use("/nutricionist", nutricionistRoutes);
app.use("/logs", authenticateToken, logRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`FitLife Backend rodando na porta ${PORT} 🚀`);
});