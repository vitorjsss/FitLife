import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { PhysicalEducatorController } from "../controllers/PhysicalEducatorController.js";
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

router.post("/register", PhysicalEducatorController.create);
router.get("/all", authenticateToken, PhysicalEducatorController.getAll);
router.get("/by-auth/:auth_id", authenticateToken, PhysicalEducatorController.getByAuthId);
router.get("/:id", authenticateToken, PhysicalEducatorController.getById);
router.patch("/:id", authenticateToken, PhysicalEducatorController.update);
router.delete("/:id", authenticateToken, PhysicalEducatorController.deleteEducator);
router.patch("/:id/avatar", authenticateToken, upload.single("avatar"), PhysicalEducatorController.uploadAvatar);

export default router;