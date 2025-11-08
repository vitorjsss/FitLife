import express from "express";
import { PhysicalEducatorController } from "../controllers/PhysicalEducatorController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", PhysicalEducatorController.create);
router.get("/all", authenticateToken, PhysicalEducatorController.getAll);
router.get("/by-auth/:auth_id", authenticateToken, PhysicalEducatorController.getByAuthId);
router.get("/:id", authenticateToken, PhysicalEducatorController.getById);
router.patch("/:id", authenticateToken, PhysicalEducatorController.update);
router.delete("/:id", authenticateToken, PhysicalEducatorController.deleteEducator);

export default router;