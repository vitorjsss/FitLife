import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

import { PatientController } from "../controllers/PatientController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), "uploads/avatars"));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const randomId = uuidv4();
        cb(null, randomId + ext);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Arquivo deve ser uma imagem"));
    }
});

router.post("/register", PatientController.create);
router.get("/all", authenticateToken, PatientController.getAll);
router.get("/:id", authenticateToken, PatientController.getById);
router.patch("/:id", authenticateToken, PatientController.update);
router.delete("/:id", authenticateToken, PatientController.deletePatient);
router.get("/auth/:auth_id", authenticateToken, PatientController.getByAuthId);
router.patch("/:id/avatar", authenticateToken, upload.single("avatar"), PatientController.uploadAvatar);

export default router;