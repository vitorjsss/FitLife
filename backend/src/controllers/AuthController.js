import { AuthService } from "../services/AuthService.js";

export const AuthController = {
    register: async (req, res) => {
        const user = req.body;
        try {
            const created = await AuthService.register(user);
            res.status(201).json(created);
        } catch (err) {
            res.status(500).json({ message: "Erro ao criar usuário", error: err });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;
        try {
            const tokens = await AuthService.login(email, password);
            if (!tokens) return res.status(401).json({ message: "Credenciais inválidas" });
            res.json(tokens);
        } catch (err) {
            res.status(500).json({ message: "Erro ao fazer login", error: err });
        }
    },

    getUsers: async (req, res) => {
        try {
            const users = await AuthService.getAllUsers();
            res.json(users);
        } catch (err) {
            res.status(500).json({ message: "Erro ao buscar usuários", error: err });
        }
    }
};