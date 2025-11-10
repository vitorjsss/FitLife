import { PhysicalEducatorService } from "../services/PhysicalEducatorService.js";
import { LogService } from "../services/LogService.js";

export const PhysicalEducatorController = {
    create: async (req, res) => {
        const educatorData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const educator = await PhysicalEducatorService.create(educatorData);

            await LogService.createLog({
                action: "CREATE_PHYSICAL_EDUCATOR",
                logType: "CREATE",
                description: `Educador físico ${educator.name} criado com sucesso`,
                ip,
                oldValue: null,
                newValue: educator,
                status: "SUCCESS",
                userId: userId || educator.auth_id
            });

            res.status(201).json(educator);
        } catch (err) {
            await LogService.createLog({
                action: "CREATE_PHYSICAL_EDUCATOR",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: educatorData,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao criar educador físico", error: err });
        }
    },

    getAll: async (req, res) => {
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const educators = await PhysicalEducatorService.getAll();

            await LogService.createLog({
                action: "GET_ALL_PHYSICAL_EDUCATORS",
                logType: "read",
                description: `Lista de ${educators.length} educadores físicos recuperada`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json(educators);
        } catch (err) {
            await LogService.createLog({
                action: "GET_ALL_PHYSICAL_EDUCATORS",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar educadores físicos", error: err });
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const educator = await PhysicalEducatorService.getById(id);

            if (!educator) {
                await LogService.createLog({
                    action: "GET_PHYSICAL_EDUCATOR_BY_ID",
                    logType: "read",
                    description: `Educador físico com ID ${id} não encontrado`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Educador físico não encontrado" });
            }

            await LogService.createLog({
                action: "GET_PHYSICAL_EDUCATOR_BY_ID",
                logType: "read",
                description: `Educador físico ${educator.name} recuperado com sucesso`,
                ip,
                oldValue: null,
                newValue: { id: educator.id, name: educator.name },
                status: "SUCCESS",
                userId: userId
            });

            res.json(educator);
        } catch (err) {
            await LogService.createLog({
                action: "GET_PHYSICAL_EDUCATOR_BY_ID",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar educador físico", error: err });
        }
    },

    getByAuthId: async (req, res) => {
        const { auth_id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const educator = await PhysicalEducatorService.getByAuthId(auth_id);

            if (!educator) {
                await LogService.createLog({
                    action: "GET_PHYSICAL_EDUCATOR_BY_AUTH_ID",
                    logType: "read",
                    description: `Educador físico com auth_id ${auth_id} não encontrado`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Educador físico não encontrado" });
            }

            await LogService.createLog({
                action: "GET_PHYSICAL_EDUCATOR_BY_AUTH_ID",
                logType: "read",
                description: `Educador físico ${educator.name} recuperado com sucesso`,
                ip,
                oldValue: null,
                newValue: { id: educator.id, name: educator.name },
                status: "SUCCESS",
                userId: userId
            });

            res.json(educator);
        } catch (err) {
            await LogService.createLog({
                action: "GET_PHYSICAL_EDUCATOR_BY_AUTH_ID",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedAuthId: auth_id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar educador físico", error: err });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const oldEducator = await PhysicalEducatorService.getById(id);

            if (!oldEducator) {
                await LogService.createLog({
                    action: "UPDATE_PHYSICAL_EDUCATOR",
                    logType: "UPDATE",
                    description: `Tentativa de atualizar educador físico inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: updateData,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Educador físico não encontrado" });
            }

            const updated = await PhysicalEducatorService.update(id, updateData);

            await LogService.createLog({
                action: "UPDATE_PHYSICAL_EDUCATOR",
                logType: "UPDATE",
                description: `Educador físico ${updated.name} atualizado com sucesso`,
                ip,
                oldValue: oldEducator,
                newValue: updated,
                status: "SUCCESS",
                userId: userId
            });

            res.json(updated);
        } catch (err) {
            await LogService.createLog({
                action: "UPDATE_PHYSICAL_EDUCATOR",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { id, updateData },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao atualizar educador físico", error: err });
        }
    },

    deleteEducator: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const educator = await PhysicalEducatorService.getById(id);

            if (!educator) {
                await LogService.createLog({
                    action: "DELETE_PHYSICAL_EDUCATOR",
                    logType: "DELETE",
                    description: `Tentativa de deletar educador físico inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Educador físico não encontrado" });
            }

            await PhysicalEducatorService.delete(id);

            await LogService.createLog({
                action: "DELETE_PHYSICAL_EDUCATOR",
                logType: "DELETE",
                description: `Educador físico ${educator.name} deletado com sucesso`,
                ip,
                oldValue: educator,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.status(204).send();
        } catch (err) {
            await LogService.createLog({
                action: "DELETE_PHYSICAL_EDUCATOR",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao deletar educador físico", error: err });
        }
    },

    uploadAvatar: async (req, res) => {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado" });

        // Caminho relativo para salvar no banco
        const avatarPath = "uploads/avatars/" + req.file.filename;

        try {
            // Buscar educador físico pelo id (chave primária)
            const oldEducator = await PhysicalEducatorService.getById(id);
            if (!oldEducator) return res.status(404).json({ message: "Educador físico não encontrado" });

            // Atualizar apenas avatar_path
            const updated = await PhysicalEducatorService.update(id, { avatar_path: avatarPath });

            await LogService.createLog({
                action: "UPLOAD_AVATAR",
                logType: "UPDATE",
                description: `Avatar do educador físico ${id} atualizado com sucesso`,
                ip: req.ip,
                oldValue: null,
                newValue: { avatar_path: avatarPath },
                status: "SUCCESS",
                userId: req.user?.id
            });

            res.json({ avatar_path: avatarPath, physical_educator: updated });
        } catch (err) {
            await LogService.createLog({
                action: "UPLOAD_AVATAR",
                logType: "ERROR",
                description: err.message,
                ip: req.ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: req.user?.id
            });

            res.status(500).json({ message: "Erro ao salvar avatar", error: err });
        }
    }
};