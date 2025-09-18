import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRepository } from "../repositories/AuthRepository.js";

export const AuthService = {
    register: async (userData) => {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const created = await AuthRepository.create({ ...userData, password: hashedPassword });
        return created;
    },

    login: async (email, password) => {
        try {
            console.log("Login solicitado:", email, password);

            const user = await AuthRepository.findByEmail(email);
            console.log("Usuário encontrado:", user);

            if (!user) return null;

            const valid = await bcrypt.compare(password, user.password);
            console.log("Senha válida?", valid);
            if (!valid) return null;

            const accessToken = jwt.sign(
                { email: user.email, user_type: user.user_type },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            const refreshToken = jwt.sign(
                { email: user.email },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: "7d" }
            );

            await AuthRepository.updateRefreshToken(user.email, refreshToken);
            await AuthRepository.updateLastLogin(user.email);

            return { accessToken, refreshToken };
        } catch (err) {
            console.error("Erro no login:", err);
            throw err;
        }
    },

    getAllUsers: async () => {
        return await AuthRepository.getAll();
    }
};
