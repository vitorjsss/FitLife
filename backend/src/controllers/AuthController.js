import { AuthService } from "../services/AuthService.js";
import { LogService } from "../services/LogService.js";

export const AuthController = {
  register: async (req, res) => {
    const user = req.body;
    user.email = user.email.toLowerCase();

    const ip = req.ip;
    console.log("[REGISTER] Iniciando registro para:", user.email, user.username);
    try {
      // Verifica se já existe usuário com mesmo username
      const existingUsername = await AuthService.findByUsername?.(user.username);
      if (existingUsername) {
        console.log("[REGISTER] Username já existe:", user.username);
        await LogService.createLog({
          action: "REGISTER",
          logType: "ERROR",
          description: `Tentativa de registro falhou: username '${user.username}' já existe`,
          ip,
          oldValue: null,
          newValue: JSON.stringify(user),
          status: "FAILURE",
          userId: null
        });
        return res.status(400).json({ message: "Username já existe" });
      }

      // Verifica se já existe usuário com mesmo email
      const existingEmail = await AuthService.findByEmail?.(user.email);
      if (existingEmail) {
        console.log("[REGISTER] Email já existe:", user.email);
        await LogService.createLog({
          action: "REGISTER",
          logType: "ERROR",
          description: `Tentativa de registro falhou: email '${user.email}' já existe`,
          ip,
          oldValue: null,
          newValue: JSON.stringify(user),
          status: "FAILURE",
          userId: null
        });
        return res.status(400).json({ message: "Email já existe" });
      }

      // Cria usuário
      const created = await AuthService.register(user);
      console.log("[REGISTER] Usuário criado:", created);

      await LogService.createLog({
        action: "REGISTER",
        logType: "ACCESS",
        description: `Usuário '${created.username}' registrado com sucesso`,
        ip,
        oldValue: null,
        newValue: JSON.stringify(created),
        status: "SUCCESS",
        userId: created.id
      });

      res.status(201).json(created);
    } catch (err) {
      console.error("[REGISTER] Erro ao registrar usuário:", err);

      // Tratar erro de chave duplicada (email)
      const pgError = err?.error || err;
      if (pgError?.code === '23505' && pgError?.constraint === 'auth_email_key') {
        try {
          await LogService.createLog({
            action: "REGISTER",
            logType: "ERROR",
            description: `Tentativa de registro falhou: email '${user.email}' já existe (constraint)`,
            ip,
            oldValue: null,
            newValue: JSON.stringify(user),
            status: "FAILURE",
            userId: null
          });
        } catch (logErr) {
          console.error("[REGISTER] Erro ao criar log de falha:", logErr);
        }
        return res.status(400).json({ message: "Email já existe" });
      }

      try {
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
      } catch (logErr) {
        console.error("[REGISTER] Erro ao criar log de falha:", logErr);
      }

      res.status(500).json({ message: "Erro ao criar usuário", error: err });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const ip = req.ip;

    console.log("[LOGIN] Iniciando login para:", normalizedEmail);

    try {
      const result = await AuthService.login(normalizedEmail, password);
      console.log("[LOGIN] Resultado do AuthService.login:", result);

      if (!result) {
        console.log("[LOGIN] Credenciais inválidas para:", normalizedEmail);
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

      if (result.locked) {
        console.log(`[LOGIN] Conta bloqueada até ${result.until} para:`, normalizedEmail);
        await LogService.createLog({
          action: "LOGIN",
          logType: "ERROR",
          description: `Conta bloqueada até ${result.until}`,
          ip,
          oldValue: null,
          newValue: null,
          status: "FAILURE",
          userId: null
        });
        return res.status(403).json({ message: `Conta bloqueada até ${result.until}` });
      }

      await LogService.createLog({
        action: "LOGIN",
        logType: "ACCESS",
        description: "Usuário logado com sucesso",
        ip,
        oldValue: null,
        newValue: JSON.stringify(result),
        status: "SUCCESS",
        userId: result.id
      });

      console.log("[LOGIN] Login bem-sucedido para:", normalizedEmail);
      res.json(result);

    } catch (err) {
      console.log("[LOGIN] Erro inesperado no login para:", normalizedEmail, err);
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
  },

  getAuthById: async (req, res) => {
    const { authId } = req.params;
    const ip = req.ip;
    try {
      const authData = await AuthService.getAuthById(authId);
      if (!authData) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      await LogService.createLog({
        action: "GET_AUTH_BY_ID",
        logType: "ACCESS",
        description: `Dados auth recuperados para auth_id: ${authId}`,
        ip,
        oldValue: null,
        newValue: JSON.stringify(authData),
        status: "SUCCESS",
        userId: authId
      });
      res.json(authData);
    } catch (err) {
      await LogService.createLog({
        action: "GET_AUTH_BY_ID",
        logType: "ERROR",
        description: err.message,
        ip,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId: authId
      });
      res.status(500).json({ message: "Erro ao buscar dados auth", error: err });
    }
  },

  requestReauth: async (req, res) => {
    const { email, password } = req.body;
    const ip = req.ip;
    try {
      const r = await AuthService.requestReauth(email, password);
      await LogService.createLog({
        action: "REQ_REAUTH",
        logType: "ACCESS",
        description: `Reauth requested for ${email}`,
        ip,
        oldValue: null,
        newValue: JSON.stringify({ email }),
        status: "SUCCESS",
        userId: r.authId
      });
      // In production you would not return the code here.
      res.json(r);
    } catch (err) {
      await LogService.createLog({
        action: "REQ_REAUTH",
        logType: "ERROR",
        description: `Reauth request failed for ${email}: ${err.message}`,
        ip,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId: null
      });
      res.status(400).json({ message: err.message });
    }
  },

  verifyReauth: async (req, res) => {
    const { authId, code } = req.body;
    const ip = req.ip;
    try {
      const { reauthToken } = await AuthService.verifyReauth(authId, code);
      await LogService.createLog({
        action: "VERIFY_REAUTH",
        logType: "ACCESS",
        description: `Reauth verified for authId: ${authId}`,
        ip,
        oldValue: null,
        newValue: null,
        status: "SUCCESS",
        userId: authId
      });
      res.json({ reauthToken });
    } catch (err) {
      await LogService.createLog({
        action: "VERIFY_REAUTH",
        logType: "ERROR",
        description: `Reauth verify failed for authId ${authId}: ${err.message}`,
        ip,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId: authId
      });
      res.status(400).json({ message: err.message });
    }
  },

  // updateEmail now expects body { email, authId, reauthToken }
  updateEmail: async (req, res) => {
    const { email, authId, reauthToken } = req.body;
    const ip = req.ip;
    if (!email || !authId || !reauthToken) {
      return res.status(400).json({ message: "email, authId e reauthToken são obrigatórios" });
    }
    try {
      const updated = await AuthService.updateEmail(authId, email.toLowerCase(), reauthToken);
      await LogService.createLog({
        action: "UPDATE_EMAIL",
        logType: "ACCESS",
        description: `Email atualizado via reauth para auth_id: ${authId}`,
        ip,
        oldValue: null,
        newValue: JSON.stringify({ authId, email }),
        status: "SUCCESS",
        userId: authId
      });
      res.json({ success: true, updated });
    } catch (err) {
      await LogService.createLog({
        action: "UPDATE_EMAIL",
        logType: "ERROR",
        description: `Erro ao atualizar email (reauth) para authId ${authId}: ${err.message}`,
        ip,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId: authId
      });
      res.status(400).json({ message: err.message });
    }
  },

  // new endpoint to update password with reauth
  updatePassword: async (req, res) => {
    const { authId, newPassword, reauthToken } = req.body;
    const ip = req.ip;
    if (!authId || !newPassword || !reauthToken) {
      return res.status(400).json({ message: "authId, newPassword e reauthToken são obrigatórios" });
    }

    // validate password strength (example rules)
    const pwd = newPassword;
    const strong = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/.test(pwd);
    if (!strong) {
      return res.status(400).json({ message: "Senha não atende aos critérios de segurança" });
    }

    try {
      const updated = await AuthService.updatePasswordWithReauth(authId, newPassword, reauthToken);
      await LogService.createLog({
        action: "UPDATE_PASSWORD",
        logType: "ACCESS",
        description: `Senha atualizada via reauth para auth_id: ${authId}`,
        ip,
        oldValue: null,
        newValue: null,
        status: "SUCCESS",
        userId: authId
      });
      res.json({ success: true, updated });
    } catch (err) {
      await LogService.createLog({
        action: "UPDATE_PASSWORD",
        logType: "ERROR",
        description: `Erro ao atualizar senha (reauth) para authId ${authId}: ${err.message}`,
        ip,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId: authId
      });
      res.status(400).json({ message: err.message });
    }
  }
};
