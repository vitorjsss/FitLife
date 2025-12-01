import { AuthService } from "../services/AuthService.js";
import { AuthRepository } from "../repositories/AuthRepository.js";
import { LogService } from "../services/LogService.js";
import { validateRegisterCredentials, validateLoginCredentials, normalizeEmail, normalizeUsername } from "../utils/validationRules.js";
import { pool } from "../config/db.js";

export const AuthController = {
  register: async (req, res) => {
    const user = req.body;
    const ip = req.ip;

    console.log("[REGISTER] Iniciando registro para:", user.email, user.username);

    // ====================================
    // VALIDAÇÃO DE CREDENCIAIS
    // ====================================
    const errors = {};

    // Validar apenas email e senha (username pode ser qualquer nome)
    if (!user.username || user.username.trim().length < 3) {
      errors.username = "Username deve ter no mínimo 3 caracteres";
    }

    if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.email = "Email inválido";
    }

    if (!user.password || user.password.length < 8) {
      errors.password = "Senha deve ter no mínimo 8 caracteres";
    }

    if (Object.keys(errors).length > 0) {
      console.log("[REGISTER] Validação falhou:", errors);
      await LogService.createLog({
        action: "REGISTER",
        logType: "VALIDATION_ERROR",
        description: `Validação falhou: ${JSON.stringify(errors)}`,
        ip,
        oldValue: null,
        newValue: JSON.stringify({ email: user.email, username: user.username }),
        status: "FAILURE",
        userId: null
      });
      return res.status(400).json({
        message: "Dados inválidos",
        errors: errors
      });
    }

    // Normalizar dados
    user.email = normalizeEmail(user.email);
    user.username = user.username.trim();

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

      // Tratar erro de chave duplicada
      const pgError = err?.error || err;

      // Username duplicado
      if (pgError?.code === '23505' && pgError?.constraint === 'auth_username_key') {
        try {
          await LogService.createLog({
            action: "REGISTER",
            logType: "ERROR",
            description: `Tentativa de registro falhou: username '${user.username}' já existe (constraint)`,
            ip,
            oldValue: null,
            newValue: JSON.stringify(user),
            status: "FAILURE",
            userId: null
          });
        } catch (logErr) {
          console.error("[REGISTER] Erro ao criar log de falha:", logErr);
        }
        return res.status(400).json({ message: "Username já existe" });
      }

      // Email duplicado
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
    const ip = req.ip;

    console.log("[LOGIN] Iniciando login para:", email);

    // ====================================
    // VALIDAÇÃO DE CREDENCIAIS
    // ====================================
    const validation = validateLoginCredentials({ email, password });

    if (!validation.valid) {
      console.log("[LOGIN] Validação falhou:", validation.errors);
      await LogService.createLog({
        action: "LOGIN",
        logType: "VALIDATION_ERROR",
        description: `Validação falhou: ${JSON.stringify(validation.errors)}`,
        ip,
        oldValue: null,
        newValue: JSON.stringify({ email }),
        status: "FAILURE",
        userId: null
      });
      return res.status(400).json({
        message: "Credenciais inválidas",
        errors: validation.errors
      });
    }

    // Normalizar email
    const normalizedEmail = normalizeEmail(email);

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
        userId: result.userId
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
  },

  // Recuperação de senha - Solicitar código
  requestPasswordReset: async (req, res) => {
    const { email } = req.body;
    const ip = req.ip;

    if (!email) {
      return res.status(400).json({ message: "Email é obrigatório" });
    }

    try {
      const user = await AuthRepository.findByEmail(email.toLowerCase());

      if (!user) {
        // Por segurança, não revelamos se o email existe ou não
        return res.json({
          message: "Se o email existir, um código será enviado",
          authId: 0
        });
      }

      // Gera código 2FA
      const authId = user.id;
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      await AuthService.save2FACode(authId, code, expiresAt);

      // Envia email com código
      await AuthService.sendEmail(
        email,
        "Recuperação de Senha - FitLife",
        `Seu código de recuperação de senha é: ${code}\n\nEste código expira em 15 minutos.\n\nSe você não solicitou esta recuperação, ignore este email.`
      );

      await LogService.createLog({
        action: "PASSWORD_RESET_REQUEST",
        logType: "ACCESS",
        description: `Solicitação de recuperação de senha para: ${email}`,
        ip,
        oldValue: null,
        newValue: null,
        status: "SUCCESS",
        userId: authId
      });

      res.json({
        message: "Código de recuperação enviado",
        authId
      });
    } catch (err) {
      console.error("[PASSWORD_RESET_REQUEST] Erro:", err);
      await LogService.createLog({
        action: "PASSWORD_RESET_REQUEST",
        logType: "ERROR",
        description: `Erro ao solicitar recuperação de senha: ${err.message}`,
        ip,
        oldValue: null,
        newValue: email,
        status: "FAILURE",
        userId: null
      });
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  },

  // Recuperação de senha - Verificar código
  verifyPasswordResetCode: async (req, res) => {
    const { authId, code } = req.body;
    const ip = req.ip;

    if (!authId || !code) {
      return res.status(400).json({ message: "authId e código são obrigatórios" });
    }

    try {
      const isValid = await AuthService.verify2FACode(authId, code);

      if (!isValid) {
        await LogService.createLog({
          action: "PASSWORD_RESET_VERIFY",
          logType: "ERROR",
          description: `Código inválido ou expirado para authId: ${authId}`,
          ip,
          oldValue: null,
          newValue: null,
          status: "FAILURE",
          userId: authId
        });
        return res.status(400).json({ message: "Código inválido ou expirado" });
      }

      await LogService.createLog({
        action: "PASSWORD_RESET_VERIFY",
        logType: "ACCESS",
        description: `Código verificado com sucesso para authId: ${authId}`,
        ip,
        oldValue: null,
        newValue: null,
        status: "SUCCESS",
        userId: authId
      });

      res.json({ message: "Código verificado com sucesso" });
    } catch (err) {
      console.error("[PASSWORD_RESET_VERIFY] Erro:", err);
      res.status(500).json({ message: "Erro ao verificar código" });
    }
  },

  // Recuperação de senha - Redefinir senha
  resetPassword: async (req, res) => {
    const { authId, code, newPassword } = req.body;
    const ip = req.ip;

    if (!authId || !code || !newPassword) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }

    // Valida força da senha
    const strong = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(newPassword);
    if (!strong) {
      return res.status(400).json({
        message: "Senha não atende aos requisitos de segurança"
      });
    }

    try {
      // Verifica código novamente antes de redefinir
      const isValid = await AuthService.verify2FACode(authId, code);

      if (!isValid) {
        return res.status(400).json({ message: "Código inválido ou expirado" });
      }

      // Atualiza senha
      await AuthService.updatePassword(authId, newPassword);

      // Remove código 2FA usado
      await AuthService.clear2FACode(authId);

      await LogService.createLog({
        action: "PASSWORD_RESET",
        logType: "ACCESS",
        description: `Senha redefinida com sucesso para authId: ${authId}`,
        ip,
        oldValue: null,
        newValue: null,
        status: "SUCCESS",
        userId: authId
      });

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (err) {
      console.error("[PASSWORD_RESET] Erro:", err);
      await LogService.createLog({
        action: "PASSWORD_RESET",
        logType: "ERROR",
        description: `Erro ao redefinir senha para authId ${authId}: ${err.message}`,
        ip,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId: authId
      });
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  },

  // Alteração de senha (usuário autenticado)
  changePassword: async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id; // Vem do middleware de autenticação
    const ip = req.ip;

    if (!userId) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }

    // Valida força da nova senha
    const strong = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(newPassword);
    if (!strong) {
      return res.status(400).json({
        message: "Senha não atende aos requisitos de segurança"
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "A nova senha deve ser diferente da senha atual"
      });
    }

    try {
      // Busca usuário
      const user = await AuthService.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Verifica senha atual
      const bcrypt = await import('bcrypt');
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        await LogService.createLog({
          action: "CHANGE_PASSWORD",
          logType: "ERROR",
          description: `Tentativa de alteração de senha falhou: senha atual incorreta`,
          ip,
          oldValue: null,
          newValue: null,
          status: "FAILURE",
          userId
        });
        return res.status(400).json({ message: "Senha atual incorreta" });
      }

      // Atualiza senha
      await AuthService.updatePassword(userId, newPassword);

      await LogService.createLog({
        action: "CHANGE_PASSWORD",
        logType: "ACCESS",
        description: `Senha alterada com sucesso`,
        ip,
        oldValue: null,
        newValue: null,
        status: "SUCCESS",
        userId
      });

      res.json({ message: "Senha alterada com sucesso" });
    } catch (err) {
      console.error("[CHANGE_PASSWORD] Erro:", err);
      await LogService.createLog({
        action: "CHANGE_PASSWORD",
        logType: "ERROR",
        description: `Erro ao alterar senha: ${err.message}`,
        ip,
        oldValue: null,
        newValue: null,
        status: "FAILURE",
        userId
      });
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  }
};
