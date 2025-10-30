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

  updateEmail: async (req, res) => {
    const { email, authId } = req.body;
    const ip = req.ip;
    if (!email || !authId) {
      return res.status(400).json({ message: "Email e authId são obrigatórios" });
    }
    try {
      const updated = await AuthService.updateEmail(authId, email.toLowerCase());
      await LogService.createLog({
        action: "UPDATE_EMAIL",
        logType: "ACCESS",
        description: `Email atualizado para auth_id: ${authId}`,
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
        description: err.message,
        ip,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId: authId
      });
      res.status(500).json({ message: "Erro ao atualizar email", error: err });
    }
  }
};
