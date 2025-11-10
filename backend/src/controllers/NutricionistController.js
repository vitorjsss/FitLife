import { NutricionistService } from "../services/NutricionistService.js";
import { LogService } from "../services/LogService.js";

export const NutricionistController = {
    create: async (req, res) => {
        const nutricionistData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const nutricionist = await NutricionistService.create(nutricionistData);

            await LogService.createLog({
                action: "CREATE_NUTRICIONIST",
                logType: "CREATE",
                description: `Nutricionista ${nutricionist.name} criado com sucesso`,
                ip,
                oldValue: null,
                newValue: nutricionist,
                status: "SUCCESS",
                userId: userId || nutricionist.auth_id
            });

            res.status(201).json(nutricionist);
        } catch (err) {
            await LogService.createLog({
                action: "CREATE_NUTRICIONIST",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: nutricionistData,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao criar nutricionista", error: err });
        }
    },

    getAll: async (req, res) => {
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const nutricionists = await NutricionistService.getAll();

            await LogService.createLog({
                action: "GET_ALL_NUTRICIONISTS",
                logType: "read",
                description: `Lista de ${nutricionists.length} nutricionistas recuperada`,
                ip,
                oldValue: null,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.json(nutricionists);
        } catch (err) {
            await LogService.createLog({
                action: "GET_ALL_NUTRICIONISTS",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar nutricionistas", error: err });
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const nutricionist = await NutricionistService.getById(id);

            if (!nutricionist) {
                await LogService.createLog({
                    action: "GET_NUTRICIONIST_BY_ID",
                    logType: "read",
                    description: `Nutricionista com ID ${id} não encontrado`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Nutricionista não encontrado" });
            }

            await LogService.createLog({
                action: "GET_NUTRICIONIST_BY_ID",
                logType: "read",
                description: `Nutricionista ${nutricionist.name} recuperado com sucesso`,
                ip,
                oldValue: null,
                newValue: { id: nutricionist.id, name: nutricionist.name },
                status: "SUCCESS",
                userId: userId
            });

            res.json(nutricionist);
        } catch (err) {
            await LogService.createLog({
                action: "GET_NUTRICIONIST_BY_ID",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar nutricionista", error: err });
        }
    },

    getByAuthId: async (req, res) => {
        const { auth_id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        console.log('[NutricionistController] getByAuthId - auth_id:', auth_id);

        try {
            const nutricionist = await NutricionistService.getByAuthId(auth_id);
            console.log('[NutricionistController] getByAuthId - nutricionist found:', nutricionist);

            if (!nutricionist) {
                await LogService.createLog({
                    action: "GET_NUTRICIONIST_BY_AUTH_ID",
                    logType: "read",
                    description: `Nutricionista com auth_id ${auth_id} não encontrado`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Nutricionista não encontrado" });
            }

            await LogService.createLog({
                action: "GET_NUTRICIONIST_BY_AUTH_ID",
                logType: "read",
                description: `Nutricionista ${nutricionist.name} recuperado com sucesso`,
                ip,
                oldValue: null,
                newValue: { id: nutricionist.id, name: nutricionist.name },
                status: "SUCCESS",
                userId: userId
            });

            res.json(nutricionist);
        } catch (err) {
            await LogService.createLog({
                action: "GET_NUTRICIONIST_BY_AUTH_ID",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedAuthId: auth_id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao buscar nutricionista", error: err });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const oldNutricionist = await NutricionistService.getById(id);

            if (!oldNutricionist) {
                await LogService.createLog({
                    action: "UPDATE_NUTRICIONIST",
                    logType: "UPDATE",
                    description: `Tentativa de atualizar nutricionista inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: updateData,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Nutricionista não encontrado" });
            }

            const updated = await NutricionistService.update(id, updateData);

            await LogService.createLog({
                action: "UPDATE_NUTRICIONIST",
                logType: "UPDATE",
                description: `Nutricionista ${updated.name} atualizado com sucesso`,
                ip,
                oldValue: oldNutricionist,
                newValue: updated,
                status: "SUCCESS",
                userId: userId
            });

            res.json(updated);
        } catch (err) {
            await LogService.createLog({
                action: "UPDATE_NUTRICIONIST",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { id, updateData },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao atualizar nutricionista", error: err });
        }
    },

    deleteNutricionist: async (req, res) => {
        const { id } = req.params;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            const nutricionist = await NutricionistService.getById(id);

            if (!nutricionist) {
                await LogService.createLog({
                    action: "DELETE_NUTRICIONIST",
                    logType: "DELETE",
                    description: `Tentativa de deletar nutricionista inexistente com ID ${id}`,
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "NOT_FOUND",
                    userId: userId
                });
                return res.status(404).json({ message: "Nutricionista não encontrado" });
            }

            await NutricionistService.delete(id);

            await LogService.createLog({
                action: "DELETE_NUTRICIONIST",
                logType: "DELETE",
                description: `Nutricionista ${nutricionist.name} deletado com sucesso`,
                ip,
                oldValue: nutricionist,
                newValue: null,
                status: "SUCCESS",
                userId: userId
            });

            res.status(204).send();
        } catch (err) {
            await LogService.createLog({
                action: "DELETE_NUTRICIONIST",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { requestedId: id },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Erro ao deletar nutricionista", error: err });
        }
    },

    uploadAvatar: async (req, res) => {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado" });

        // Caminho relativo para salvar no banco
        const avatarPath = "uploads/avatars/" + req.file.filename;

        try {
            // Buscar nutricionista pelo id (chave primária)
            const oldNutricionist = await NutricionistService.getById(id);
            if (!oldNutricionist) return res.status(404).json({ message: "Nutricionista não encontrado" });

            // Atualizar apenas avatar_path
            const updated = await NutricionistService.update(id, { avatar_path: avatarPath });

            await LogService.createLog({
                action: "UPLOAD_AVATAR",
                logType: "UPDATE",
                description: `Avatar do nutricionista ${id} atualizado com sucesso`,
                ip: req.ip,
                oldValue: null,
                newValue: { avatar_path: avatarPath },
                status: "SUCCESS",
                userId: req.user?.id
            });

            res.json({ avatar_path: avatarPath, nutricionist: updated });
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