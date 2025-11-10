import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRepository } from "../repositories/AuthRepository.js";
import { pool } from "../config/db.js"; // Adicione este import para acessar o banco
import { LogService } from "./LogService.js"; // assume já existe

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

      // Buscar professionalId se for nutricionista ou educador físico
      let professionalId = null;
      if (user.user_type === 'Nutricionist') {
        const result = await pool.query("SELECT id FROM nutricionist WHERE auth_id = $1", [user.id]);
        professionalId = result.rows[0]?.id || null;
      } else if (user.user_type === 'Physical_educator') {
        const result = await pool.query("SELECT id FROM physical_educator WHERE auth_id = $1", [user.id]);
        professionalId = result.rows[0]?.id || null;
      }

      const accessToken = jwt.sign(
        {
          id: user.id,  // ← ADICIONAR auth_id no token
          email: user.email,
          user_type: user.user_type,
          professionalId: professionalId
        },
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
        userType: user.user_type,
        professionalId: professionalId
      };
    } catch (err) {
      console.error("Erro no login:", err);
      throw err;
    }
  },

  getAllUsers: async () => {
    return await AuthRepository.getAll();
  },

  getPatientByAuthId: async (authId) => {
    const result = await pool.query("SELECT id FROM patient WHERE auth_id = $1", [authId]);
    return result.rows[0] || null;
  },

  getAuthById: async (authId) => {
    try {
      const result = await pool.query("SELECT * FROM auth WHERE id = $1", [authId]);
      return result.rows[0] || null;
    } catch (err) {
      console.error("Erro ao buscar auth por id:", err);
      throw err;
    }
  },

  // Reaut in-memory store (simple, suitable for single-instance dev; replace with DB/Redis in prod)
  _reauthStore: new Map(), // key: authId, value: { code, expiresAt, attempts }

  // request reaut: validate current credentials and send code
  requestReauth: async (email, password) => {
    const user = await AuthRepository.findByEmail(email);
    if (!user) {
      await LogService.createLog({
        action: "REQ_REAUTH",
        logType: "ERROR",
        description: `Reautenticação solicitada: usuário não encontrado (${email})`,
        ip: null,
        oldValue: null,
        newValue: JSON.stringify({ email }),
        status: "FAILURE",
        userId: null
      });
      throw new Error("Credenciais inválidas");
    }
    // check account locked
    if (user.account_locked_until && new Date() < user.account_locked_until) {
      throw new Error(`Conta bloqueada até ${user.account_locked_until}`);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // increment failed attempts (reuse existing repository logic)
      await AuthRepository.incrementFailedAttempts(user.email);
      await LogService.createLog({
        action: "REQ_REAUTH",
        logType: "ERROR",
        description: `Reautenticação falhou: senha inválida para ${email}`,
        ip: null,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId: user.id
      });
      // if failed attempts >= 3, lock account
      const refreshed = await pool.query("SELECT failed_attempts FROM auth WHERE email = $1", [user.email]);
      const attempts = refreshed.rows[0]?.failed_attempts || 0;
      if (attempts >= 3) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await AuthRepository.lockAccount(user.email, lockUntil);
        await LogService.createLog({
          action: "LOCK_ACCOUNT",
          logType: "SECURITY",
          description: `Conta bloqueada por tentativas falhas de reautenticação: ${email}`,
          ip: null,
          oldValue: null,
          newValue: JSON.stringify({ lockUntil }),
          status: "SUCCESS",
          userId: user.id
        });
      }
      throw new Error("Credenciais inválidas");
    }

    // credentials valid -> generate 6-digit code and store
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    AuthService._reauthStore.set(String(user.id), { code, expiresAt, attempts: 0 });

    // Dev helper: show code in terminal (remover em produção)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Reauth code for ${user.email} (authId=${user.id}): ${code}`);
    }

    // Log and "send" code (in prod send via email/SMS). Here we log it for dev.
    await LogService.createLog({
      action: "REQ_REAUTH",
      logType: "ACCESS",
      description: `Código de reautenticação gerado para authId ${user.id}`,
      ip: null,
      oldValue: null,
      newValue: JSON.stringify({ codeSent: true, authId: user.id }),
      status: "SUCCESS",
      userId: user.id
    });

    // In production: send code via email/SMS. For now return minimal info.
    return { authId: user.id, message: "Código enviado" };
  },

  verifyReauth: async (authId, code) => {
    const rec = AuthService._reauthStore.get(String(authId));
    const user = await AuthService.getAuthById(authId);
    if (!rec || !user) {
      await LogService.createLog({
        action: "VERIFY_REAUTH",
        logType: "ERROR",
        description: `Verificação de reautenticação falhou: nenhuma solicitação encontrada para authId ${authId}`,
        ip: null,
        oldValue: null,
        newValue: JSON.stringify({ authId, code }),
        status: "FAILURE",
        userId: authId
      });
      throw new Error("Reautenticação inválida");
    }

    if (Date.now() > rec.expiresAt) {
      AuthService._reauthStore.delete(String(authId));
      await LogService.createLog({
        action: "VERIFY_REAUTH",
        logType: "ERROR",
        description: `Verificação de reautenticação falhou: código expirado para authId ${authId}`,
        ip: null,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId: authId
      });
      throw new Error("Código expirado");
    }

    if (rec.attempts >= 3) {
      // lock account 30 minutes
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      await AuthRepository.lockAccount(user.email, lockUntil);
      AuthService._reauthStore.delete(String(authId));
      await LogService.createLog({
        action: "LOCK_ACCOUNT",
        logType: "SECURITY",
        description: `Conta bloqueada por 3 falhas em reautenticação: authId ${authId}`,
        ip: null,
        oldValue: null,
        newValue: JSON.stringify({ lockUntil }),
        status: "SUCCESS",
        userId: authId
      });
      throw new Error("Conta bloqueada por tentativas falhas. Verifique seu e-mail para instruções.");
    }

    if (rec.code !== String(code)) {
      rec.attempts += 1;
      AuthService._reauthStore.set(String(authId), rec);
      await LogService.createLog({
        action: "VERIFY_REAUTH",
        logType: "ERROR",
        description: `Verificação de reautenticação falhou: código inválido para authId ${authId}`,
        ip: null,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId: authId
      });
      throw new Error("Código inválido");
    }

    // success -> issue short-lived reauthToken (jwt) and clear store
    AuthService._reauthStore.delete(String(authId));
    const reauthToken = jwt.sign({ authId, purpose: "reauth" }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "10m" });

    await LogService.createLog({
      action: "VERIFY_REAUTH",
      logType: "ACCESS",
      description: `Reautenticação bem-sucedida para authId ${authId}`,
      ip: null,
      oldValue: null,
      newValue: null,
      status: "SUCCESS",
      userId: authId
    });

    return { reauthToken };
  },

  verifyReauthToken: async (reauthToken, authId) => {
    try {
      const payload = jwt.verify(reauthToken, process.env.JWT_SECRET || "dev_secret");
      if (payload && payload.authId && String(payload.authId) === String(authId) && payload.purpose === "reauth") {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },

  // update email now must be called with verified reauthToken
  updateEmail: async (authId, newEmail, reauthToken) => {
    // verify reauth token
    const ok = await AuthService.verifyReauthToken(reauthToken, authId);
    if (!ok) throw new Error("Reautenticação requerida");

    try {
      const result = await pool.query("UPDATE auth SET email = $1 WHERE id = $2 RETURNING *", [newEmail, authId]);
      await LogService.createLog({
        action: "UPDATE_EMAIL",
        logType: "ACCESS",
        description: `Email atualizado para authId: ${authId}`,
        ip: null,
        oldValue: null,
        newValue: JSON.stringify({ authId, newEmail }),
        status: "SUCCESS",
        userId: authId
      });
      return result.rows[0] || null;
    } catch (err) {
      await LogService.createLog({
        action: "UPDATE_EMAIL",
        logType: "ERROR",
        description: `Erro ao atualizar email para authId ${authId}: ${err.message}`,
        ip: null,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId: authId
      });
      throw err;
    }
  },

  updatePasswordWithReauth: async (authId, newPassword, reauthToken) => {
    const ok = await AuthService.verifyReauthToken(reauthToken, authId);
    if (!ok) throw new Error("Reautenticação requerida");
    const hashed = await bcrypt.hash(newPassword, 10);
    try {
      const result = await pool.query("UPDATE auth SET password = $1 WHERE id = $2 RETURNING *", [hashed, authId]);
      await LogService.createLog({
        action: "UPDATE_PASSWORD",
        logType: "ACCESS",
        description: `Senha atualizada para authId: ${authId}`,
        ip: null,
        oldValue: null,
        newValue: null,
        status: "SUCCESS",
        userId: authId
      });
      return result.rows[0] || null;
    } catch (err) {
      await LogService.createLog({
        action: "UPDATE_PASSWORD",
        logType: "ERROR",
        description: `Erro ao atualizar senha para authId ${authId}: ${err.message}`,
        ip: null,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId: authId
      });
      throw err;
    }
  }
};