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
      const user = await AuthRepository.findByEmail(email);
      if (!user) return null;

      // Verifica se a conta está bloqueada
      if (user.account_locked_until && new Date() < user.account_locked_until) {
        return { locked: true, until: user.account_locked_until };
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        // Incrementa tentativas falhas
        await AuthRepository.incrementFailedAttempts(user.email);

        // Bloqueia a conta se atingir 3 tentativas
        if (user.failed_attempts + 1 >= 3) {
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // bloqueio 15 minutos
          await AuthRepository.lockAccount(user.email, lockUntil);
          return { locked: true, until: lockUntil };
        }

        return null;
      }

      // Resetar tentativas falhas ao logar com sucesso
      await AuthRepository.resetFailedAttempts(user.email);

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

      return {
        accessToken,
        refreshToken,
        userId: user.id,
        userType: user.user_type
      };
    } catch (err) {
      console.error("Erro no login:", err);
      throw err;
    }
  },

  getAllUsers: async () => {
    return await AuthRepository.getAll();
  }
};
