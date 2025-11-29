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

          // Registrar bloqueio no log
          await LogService.createLog({
            action: "LOGIN_BLOCKED",
            logType: "SECURITY",
            description: `Conta bloqueada por múltiplas tentativas de login falhadas até ${lockUntil}`,
            ip: null,
            oldValue: null,
            newValue: JSON.stringify({ email: user.email, locked_until: lockUntil }),
            status: "FAILURE",
            userId: user.id
          });

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
  },

  // Método para atualizar senha (sem reauth)
  updatePassword: async (authId, newPassword) => {
    const hashed = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      "UPDATE auth SET password = $1 WHERE id = $2 RETURNING *",
      [hashed, authId]
    );
    return result.rows[0] || null;
  },

  // Método para buscar usuário por ID
  findById: async (authId) => {
    const result = await pool.query(
      "SELECT * FROM auth WHERE id = $1",
      [authId]
    );
    return result.rows[0] || null;
  },

  // Método para limpar código 2FA
  clear2FACode: async (authId) => {
    await pool.query(
      "UPDATE auth SET twofa_code = NULL, twofa_expires_at = NULL WHERE id = $1",
      [authId]
    );
  },

  // Método para salvar código 2FA
  save2FACode: async (authId, code, expiresAt) => {
    await pool.query(
      "UPDATE auth SET twofa_code = $1, twofa_expires_at = $2 WHERE id = $3",
      [code, expiresAt, authId]
    );
  },

  // Método para verificar código 2FA
  verify2FACode: async (authId, code) => {
    const result = await pool.query(
      "SELECT twofa_code, twofa_expires_at FROM auth WHERE id = $1",
      [authId]
    );

    if (!result.rows[0]) return false;

    const { twofa_code, twofa_expires_at } = result.rows[0];

    if (!twofa_code || !twofa_expires_at) return false;
    if (Date.now() > new Date(twofa_expires_at).getTime()) return false;
    if (twofa_code !== code) return false;

    return true;
  },

  // Método para enviar email usando SendGrid
  sendEmail: async (to, subject, text) => {
    try {
      // Importa SendGrid dinamicamente
      const sgMail = (await import('@sendgrid/mail')).default;

      // Verifica se a API key está configurada
      if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'SG.SUBSTITUA_PELA_SUA_API_KEY_AQUI') {
        console.warn('⚠️  SendGrid API Key não configurada. Usando modo de desenvolvimento (código no console).');
        console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL PARA: ${to}
📬 ASSUNTO: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${text}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
        return true;
      }

      // Configura a API key
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      // Extrai o código do texto
      const codeMatch = text.match(/\d{6}/);
      const code = codeMatch ? codeMatch[0] : '';

      // Monta a mensagem
      const msg = {
        to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@fitlife.com',
          name: process.env.SENDGRID_FROM_NAME || 'FitLife'
        },
        subject,
        text, // Versão texto puro
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #40C4FF 0%, #1976D2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">FitLife</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Recuperação de Senha</h2>
                        <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 24px;">
                          Você solicitou a recuperação de senha da sua conta FitLife. Use o código abaixo para continuar:
                        </p>
                        
                        <!-- Código -->
                        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
                          <div style="color: #999999; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Seu código de verificação</div>
                          <div style="font-size: 36px; font-weight: bold; color: #1976D2; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${code}
                          </div>
                        </div>
                        
                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                          <p style="margin: 0; color: #856404; font-size: 14px;">
                            ⏱️ Este código expira em <strong>15 minutos</strong>
                          </p>
                        </div>
                        
                        <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 20px;">
                          Se você não solicitou esta recuperação de senha, ignore este email. Sua senha permanecerá inalterada.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="margin: 0 0 10px; color: #999999; font-size: 12px;">
                          © ${new Date().getFullYear()} FitLife. Todos os direitos reservados.
                        </p>
                        <p style="margin: 0; color: #cccccc; font-size: 11px;">
                          Este é um email automático, por favor não responda.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      // Envia o email
      await sgMail.send(msg);

      console.log(`✅ Email enviado com sucesso via SendGrid para: ${to}`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao enviar email via SendGrid:', error);

      // Se falhar, loga no console como fallback
      console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  FALLBACK - Email não enviado, código no console:
📧 EMAIL PARA: ${to}
📬 ASSUNTO: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${text}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);

      // Não lança erro para não quebrar o fluxo
      return true;
    }
  }
};