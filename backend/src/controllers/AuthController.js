import { AuthService } from "../services/AuthService.js";
import { LogService } from "../services/LogService.js";

export const AuthController = {
    register: async (req, res) => {
        const user = req.body;
        const ip = req.ip;
        try {
            const created = await AuthService.register(user);

            await LogService.createLog({
                action: "REGISTER",
                logType: "ACCESS",
                description: `Usuário ${created.email} registrado com sucesso`,
                ip,
                oldValue: null,
                newValue: JSON.stringify(created),
                status: "SUCCESS",
                userId: created.id
            });

            res.status(201).json(created);
        } catch (err) {
            await LogService.createLog({
                action: "REGISTER",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: JSON.stringify(user),
                status: "FAILURE",
                userId: null
            });

            res.status(500).json({ message: "Erro ao criar usuário", error: err });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;
        const ip = req.ip;
        try {
            const tokens = await AuthService.login(email, password);

            if (!tokens) {
                await LogService.createLog({
                    action: "LOGIN",
                    logType: "ERROR",
                    description: "Tentativa de login falhou",
                    ip,
                    oldValue: null,
                    newValue: null,
                    status: "FAILURE",
                    userId: null
                });
                return res.status(401).json({ message: "Credenciais inválidas" });
            }

            await LogService.createLog({
                action: "LOGIN",
                logType: "ACCESS",
                description: "Usuário logado com sucesso",
                ip,
                oldValue: null,
                newValue: JSON.stringify(tokens),
                status: "SUCCESS",
                userId: tokens.userId
            });

            res.json(tokens);
        } catch (err) {
            await LogService.createLog({
                action: "LOGIN",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: null
            });

            res.status(500).json({ message: "Erro ao fazer login", error: err });
        }
    },

    getUsers: async (req, res) => {
        const ip = req.ip;
        try {
            const users = await AuthService.getAllUsers();

            await LogService.createLog({
                action: "GET_USERS",
                logType: "ACCESS",
                description: "Listagem de usuários recuperada",
                ip,
                oldValue: null,
                newValue: JSON.stringify(users),
                status: "SUCCESS",
                userId: null
            });

            res.json(users);
        } catch (err) {
            await LogService.createLog({
                action: "GET_USERS",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: null,
                status: "FAILURE",
                userId: null
            });

            res.status(500).json({ message: "Erro ao buscar usuários", error: err });
        }
    }
};