# RNF3.1: Reautenticação para Alteração de Dados Sensíveis

## Requisito Não-Funcional

**RNF: Reautenticação e Validação de Alterações de Conta**

Ambiente: Usuário tenta atualizar informações de conta no app.

Estímulo: Usuário altera o e-mail ou a senha.

Resposta: O sistema deve exigir reautenticação ao atualizar e-mail ou senha ou validar a nova senha conforme critérios de segurança, além de saber lidar em caso de tentativas suspeitas de alteração de dados.

Medida de resposta: Para a exigência de reautenticação o sistema implementará um fluxo de autenticação em várias etapas, que incluirá a solicitação de credenciais existentes e, posteriormente, um segundo fator de autenticação (código de verificação). Cada tentativa de reautenticação será registrada em logs detalhados, que incluirão informações sobre a origem da tentativa e o status (sucesso ou falha). Caso o usuário falhe ao reautenticar três vezes consecutivas, a conta será suspensa por 30 minutos. Após esse período, um e-mail será enviado solicitando a verificação de identidade através de dados adicionais, como perguntas de segurança ou um código enviado para um número de telefone registrado. A conta será reativada somente após a validação bem-sucedida. Relatórios mensais analisarão a taxa de sucesso das reautenticações, com um índice de 100% indicando que todas as tentativas de alteração foram seguidas de reautenticações bem-sucedidas e que contas suspensas foram reativadas após validação adequada.

## Critérios de Aceitação

1. O sistema deve exigir autenticação do usuário antes de permitir alterações de e-mail ou senha
2. O sistema deve validar que o novo e-mail não está em uso por outra conta
3. O sistema deve aplicar regras de segurança de senha (mínimo de caracteres, letras, números e caracteres especiais) ao alterar a senha
4. Todas as alterações devem ser registradas em logs para auditoria
5. Após a alteração bem-sucedida, o usuário deve receber confirmação visual
6. O sistema deve bloquear a conta por 30 minutos após 3 tentativas falhas de reautenticação
7. Código de verificação deve expirar em 5 minutos
8. Token de reautenticação deve ter validade curta (10 minutos)

## Riscos Identificados

### Confiabilidade
Se a autenticação ou validação de senha/e-mail tiver falhas, credenciais podem ser alteradas de forma indevida, comprometendo a confiança do usuário no sistema.

### Disponibilidade
Múltiplas tentativas de alteração malsucedidas podem bloquear temporariamente o acesso legítimo de usuários, reduzindo a disponibilidade do serviço.

### Desempenho
Validações mais complexas (como verificação de força da senha e duplicidade de e-mails) podem aumentar o tempo de resposta do sistema em operações críticas.

Story Point Estimado: 8

## Métricas de Qualidade

### 1. Taxa de Sucesso de Reautenticação
```
x = Nreauth_sucesso / Nreauth_total
```

Onde:
- **Nreauth_sucesso**: Número de reautenticações bem-sucedidas
- **Nreauth_total**: Número total de tentativas de reautenticação

Requisito: **x ≥ 0.95 (95%)**

### 2. Cobertura de Registro de Alterações
```
y = Nalteracoes_registradas / Nalteracoes_total
```

Onde:
- **Nalteracoes_registradas**: Número de alterações registradas em log
- **Nalteracoes_total**: Número total de alterações realizadas

Requisito: **y ≥ 1.0 (100%)**

### 3. Taxa de Validação de Senha
```
z = Nsenhas_validas / Nsenhas_submetidas
```

Onde:
- **Nsenhas_validas**: Senhas que passaram na validação
- **Nsenhas_submetidas**: Total de senhas submetidas para alteração

Requisito: **z ≥ 1.0 (100%)** - Apenas senhas válidas devem ser aceitas

## Arquitetura Implementada

### 1. Fluxo de Reautenticação

**Arquivo**: `backend/src/services/AuthService.js`

#### Etapa 1: Solicitar Reautenticação
**Endpoint**: `POST /auth/reauth/request`

**Processo**:
1. Usuário envia credenciais atuais (email + senha)
2. Sistema valida credenciais via bcrypt.compare()
3. Verifica se conta está bloqueada (account_locked_until)
4. Incrementa failed_attempts se credenciais inválidas
5. Bloqueia conta por 30 minutos após 3 tentativas falhas
6. Gera código de 6 dígitos com validade de 5 minutos
7. Armazena código em memória (_reauthStore)
8. Registra tentativa em log
9. Em produção: envia código por email/SMS

**Implementação**:
```javascript
requestReauth: async (email, password) => {
    const user = await AuthRepository.findByEmail(email);
    
    // Verifica bloqueio
    if (user.account_locked_until && new Date() < user.account_locked_until) {
        throw new Error(`Conta bloqueada até ${user.account_locked_until}`);
    }
    
    // Valida senha
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        await AuthRepository.incrementFailedAttempts(user.email);
        
        // Bloqueia após 3 tentativas
        const attempts = await getFailedAttempts(user.email);
        if (attempts >= 3) {
            const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
            await AuthRepository.lockAccount(user.email, lockUntil);
        }
        throw new Error("Credenciais inválidas");
    }
    
    // Gera código
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos
    AuthService._reauthStore.set(String(user.id), { code, expiresAt, attempts: 0 });
    
    return { authId: user.id, message: "Código enviado" };
}
```

#### Etapa 2: Verificar Código de Reautenticação
**Endpoint**: `POST /auth/reauth/verify`

**Processo**:
1. Usuário envia authId + código de 6 dígitos
2. Sistema busca registro no _reauthStore
3. Verifica se código expirou (5 minutos)
4. Incrementa contador de tentativas se código inválido
5. Bloqueia conta por 30 minutos após 3 tentativas de código inválido
6. Gera token JWT temporário (reauthToken) válido por 10 minutos
7. Remove registro do _reauthStore
8. Registra sucesso/falha em log

**Implementação**:
```javascript
verifyReauth: async (authId, code) => {
    const rec = AuthService._reauthStore.get(String(authId));
    
    if (!rec) {
        throw new Error("Reautenticação inválida");
    }
    
    // Verifica expiração
    if (Date.now() > rec.expiresAt) {
        AuthService._reauthStore.delete(String(authId));
        throw new Error("Código expirado");
    }
    
    // Verifica tentativas
    if (rec.attempts >= 3) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        await AuthRepository.lockAccount(user.email, lockUntil);
        AuthService._reauthStore.delete(String(authId));
        throw new Error("Conta bloqueada. Verifique seu e-mail.");
    }
    
    // Valida código
    if (rec.code !== String(code)) {
        rec.attempts += 1;
        AuthService._reauthStore.set(String(authId), rec);
        throw new Error("Código inválido");
    }
    
    // Sucesso: gera token temporário
    AuthService._reauthStore.delete(String(authId));
    const reauthToken = jwt.sign(
        { authId, purpose: "reauth" },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
    );
    
    return { reauthToken };
}
```

#### Etapa 3: Atualizar Email ou Senha
**Endpoints**:
- `POST /auth/update-email`
- `POST /auth/update-password`

**Processo**:
1. Usuário envia reauthToken + novos dados
2. Sistema verifica reauthToken via JWT
3. Valida que token tem purpose="reauth" e authId correto
4. Executa validações específicas (email duplicado, força da senha)
5. Atualiza dados no banco de dados
6. Registra alteração em log
7. Retorna confirmação de sucesso

### 2. Validação de Email

**Implementação**: `backend/src/services/AuthService.js`

```javascript
updateEmail: async (authId, newEmail, reauthToken) => {
    // Verifica token de reautenticação
    const ok = await AuthService.verifyReauthToken(reauthToken, authId);
    if (!ok) throw new Error("Reautenticação requerida");
    
    // Verifica se email já existe (constraint UNIQUE no banco)
    // Se duplicado, PostgreSQL lançará erro de violação de UNIQUE constraint
    
    const result = await pool.query(
        "UPDATE auth SET email = $1 WHERE id = $2 RETURNING *",
        [newEmail, authId]
    );
    
    return result.rows[0];
}
```

**Validação de Duplicação**:
- Constraint UNIQUE no banco de dados: `email VARCHAR(255) NOT NULL UNIQUE`
- Erro de banco retornado se email já existe
- Mensagem de erro clara enviada ao usuário

### 3. Validação de Senha

**Implementação**: `backend/src/controllers/AuthController.js`

**Requisitos de Senha**:
- Mínimo 8 caracteres
- Pelo menos 1 letra (maiúscula ou minúscula)
- Pelo menos 1 número
- Pelo menos 1 caractere especial

**Regex de Validação**:
```javascript
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;
```

**Fluxo de Validação**:
```javascript
updatePassword: async (req, res) => {
    const { authId, newPassword, reauthToken } = req.body;
    
    // Validação de senha
    const strong = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/.test(newPassword);
    if (!strong) {
        return res.status(400).json({ 
            message: "Senha não atende aos critérios de segurança" 
        });
    }
    
    // Atualiza senha com bcrypt hash
    const updated = await AuthService.updatePasswordWithReauth(
        authId, 
        newPassword, 
        reauthToken
    );
    
    res.json({ success: true, updated });
}
```

### 4. Sistema de Logs

**Arquivo**: `backend/src/services/LogService.js`

**Tabela**: `logs`

#### Logs Registrados

**REQ_REAUTH** (Solicitação de Reautenticação):
- Ação: `REQ_REAUTH`
- Log Type: `ACCESS` (sucesso) ou `ERROR` (falha)
- Campos: authId, email, IP, timestamp, status

**VERIFY_REAUTH** (Verificação de Código):
- Ação: `VERIFY_REAUTH`
- Log Type: `ACCESS` (sucesso) ou `ERROR` (falha)
- Campos: authId, código, IP, timestamp, tentativas

**LOCK_ACCOUNT** (Bloqueio de Conta):
- Ação: `LOCK_ACCOUNT`
- Log Type: `SECURITY`
- Campos: authId, email, lockUntil, motivo, timestamp

**UPDATE_EMAIL** (Atualização de Email):
- Ação: `UPDATE_EMAIL`
- Log Type: `ACCESS` (sucesso) ou `ERROR` (falha)
- Campos: authId, email antigo, email novo, IP, timestamp

**UPDATE_PASSWORD** (Atualização de Senha):
- Ação: `UPDATE_PASSWORD`
- Log Type: `ACCESS` (sucesso) ou `ERROR` (falha)
- Campos: authId, IP, timestamp (senha não é registrada)

### 5. Tabela de Autenticação

**Arquivo**: `backend/db-init/init.sql`

```sql
CREATE TABLE auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    user_type user_type_enum NOT NULL,
    password VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    failed_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMP NULL
);
```

**Campos Críticos**:
- `email`: UNIQUE constraint para evitar duplicação
- `password`: Hash bcrypt (não armazena senha em texto)
- `failed_attempts`: Contador de tentativas falhas
- `account_locked_until`: Timestamp de bloqueio temporário

### 6. Armazenamento de Códigos de Reautenticação

**Implementação**: In-memory Map (desenvolvimento)

```javascript
_reauthStore: new Map()
// key: authId (string)
// value: { code: string, expiresAt: timestamp, attempts: number }
```

**Estrutura do Registro**:
```javascript
{
    code: "123456",           // Código de 6 dígitos
    expiresAt: 1732900000000, // Timestamp (5 minutos)
    attempts: 0               // Tentativas de verificação
}
```

**Ciclo de Vida**:
1. Criado em `requestReauth()`
2. Verificado em `verifyReauth()`
3. Removido após sucesso, expiração ou 3 tentativas falhas

**Produção**: Recomenda-se usar Redis ou banco de dados para múltiplas instâncias

## Rotas Implementadas

**Arquivo**: `backend/src/routes/authRoutes.js`

```javascript
// Reautenticação
POST /auth/reauth/request        - Solicitar código (público)
POST /auth/reauth/verify         - Verificar código (público)

// Alteração de Dados (requer autenticação + reautenticação)
POST /auth/update-email          - Atualizar email (protegido)
POST /auth/update-password       - Atualizar senha (protegido)
```

**Middlewares**:
- `authenticateToken`: Valida JWT de acesso normal
- Validação de `reauthToken`: Interna ao serviço

## Fluxo Completo de Atualização

### Exemplo: Alterar Email

**Passo 1**: Login normal
```
POST /auth/login
Body: { email, password }
Response: { accessToken, refreshToken, userId }
```

**Passo 2**: Solicitar reautenticação
```
POST /auth/reauth/request
Body: { email, password }
Response: { authId, message: "Código enviado" }
```

**Passo 3**: Verificar código (recebido por email/SMS)
```
POST /auth/reauth/verify
Body: { authId, code: "123456" }
Response: { reauthToken }
```

**Passo 4**: Atualizar email
```
POST /auth/update-email
Headers: { Authorization: "Bearer <accessToken>" }
Body: { authId, email: "novo@email.com", reauthToken }
Response: { success: true, updated: {...} }
```

### Exemplo: Alterar Senha

**Passo 1-3**: Mesmo fluxo de reautenticação

**Passo 4**: Atualizar senha
```
POST /auth/update-password
Headers: { Authorization: "Bearer <accessToken>" }
Body: { authId, newPassword: "NovaSenh@123", reauthToken }
Response: { success: true, updated: {...} }
```

## Estrutura dos Testes

### Teste 1: Fluxo Completo de Reautenticação
Valida todo o processo desde solicitação até verificação do código.

**Cenários**:
- 1.1 - Solicitar reautenticação com credenciais válidas
- 1.2 - Verificar código correto gera reauthToken
- 1.3 - Código expira após 5 minutos
- 1.4 - Token de reautenticação expira após 10 minutos

**Validações**:
- Código de 6 dígitos gerado
- Código armazenado em _reauthStore
- Token JWT com purpose="reauth"
- Expiração correta dos tokens

### Teste 2: Bloqueio por Tentativas Falhas
Valida bloqueio de conta após tentativas inválidas.

**Cenários**:
- 2.1 - 3 tentativas de senha incorreta na solicitação
- 2.2 - 3 tentativas de código incorreto na verificação
- 2.3 - Conta bloqueada por 30 minutos
- 2.4 - Mensagem de erro apropriada

**Validações**:
- failed_attempts incrementa corretamente
- account_locked_until definido para +30 minutos
- Erro "Conta bloqueada" retornado
- Log LOCK_ACCOUNT criado

### Teste 3: Atualização de Email
Valida processo completo de alteração de email.

**Cenários**:
- 3.1 - Atualizar email com reauthToken válido
- 3.2 - Rejeitar atualização sem reauthToken
- 3.3 - Rejeitar email duplicado (constraint UNIQUE)
- 3.4 - Rejeitar reauthToken expirado
- 3.5 - Registrar alteração em log

**Validações**:
- Email atualizado no banco de dados
- Constraint UNIQUE impede duplicação
- Log UPDATE_EMAIL criado
- Resposta de sucesso retornada

### Teste 4: Atualização de Senha
Valida processo completo de alteração de senha.

**Cenários**:
- 4.1 - Atualizar senha com reauthToken válido
- 4.2 - Rejeitar senha fraca (< 8 caracteres)
- 4.3 - Rejeitar senha sem números
- 4.4 - Rejeitar senha sem caracteres especiais
- 4.5 - Senha armazenada como hash bcrypt
- 4.6 - Registrar alteração em log

**Validações**:
- Validação de força de senha
- Hash bcrypt armazenado (não texto plano)
- Log UPDATE_PASSWORD criado
- Senha antiga não funciona mais

### Teste 5: Registro de Logs
Valida que todas as operações são auditadas.

**Cenários**:
- 5.1 - Solicitação de reautenticação registrada
- 5.2 - Verificação de código registrada
- 5.3 - Bloqueio de conta registrado
- 5.4 - Atualização de email registrada
- 5.5 - Atualização de senha registrada
- 5.6 - Tentativas falhas registradas

**Validações**:
- Todos os eventos têm entrada na tabela logs
- Campos action, log_type, status preenchidos
- IP e timestamp capturados
- user_id referenciado corretamente

### Teste 6: Validação de Segurança
Valida proteções contra ataques e uso indevido.

**Cenários**:
- 6.1 - Não aceitar reauthToken de outro usuário
- 6.2 - Não aceitar reauthToken com purpose diferente
- 6.3 - Código de reautenticação é único por tentativa
- 6.4 - Código removido após uso bem-sucedido
- 6.5 - Limite de 3 tentativas por código

**Validações**:
- JWT validado com authId correto
- Purpose="reauth" verificado
- _reauthStore limpo após sucesso
- Tentativas incrementadas corretamente

## Como Executar os Testes

### Pré-requisitos
1. Node.js v18+ instalado
2. PostgreSQL rodando (porta 5433)
3. Dependências do backend instaladas (npm install)
4. Banco de dados configurado com tabelas auth e logs
5. Variáveis de ambiente configuradas (JWT_SECRET)

### Teste Manual com cURL/Insomnia

**1. Solicitar Reautenticação**
```bash
curl -X POST http://localhost:5001/auth/reauth/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaAtual123"
  }'
```

**Resposta Esperada**:
```json
{
  "authId": "uuid-do-usuario",
  "message": "Código enviado"
}
```

**Nota**: Em desenvolvimento, o código aparece no console do backend.

**2. Verificar Código**
```bash
curl -X POST http://localhost:5001/auth/reauth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "authId": "uuid-do-usuario",
    "code": "123456"
  }'
```

**Resposta Esperada**:
```json
{
  "reauthToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**3. Atualizar Email**
```bash
curl -X POST http://localhost:5001/auth/update-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{
    "authId": "uuid-do-usuario",
    "email": "novoemail@example.com",
    "reauthToken": "token-de-reauth"
  }'
```

**4. Atualizar Senha**
```bash
curl -X POST http://localhost:5001/auth/update-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{
    "authId": "uuid-do-usuario",
    "newPassword": "NovaSenha@456",
    "reauthToken": "token-de-reauth"
  }'
```

### Teste de Bloqueio de Conta

**Simular 3 tentativas falhas**:
```bash
# Tentativa 1
curl -X POST http://localhost:5001/auth/reauth/request \
  -d '{"email":"user@test.com","password":"errada1"}'

# Tentativa 2
curl -X POST http://localhost:5001/auth/reauth/request \
  -d '{"email":"user@test.com","password":"errada2"}'

# Tentativa 3 - Bloqueia conta
curl -X POST http://localhost:5001/auth/reauth/request \
  -d '{"email":"user@test.com","password":"errada3"}'
```

**Resposta Esperada (3ª tentativa)**:
```json
{
  "message": "Conta bloqueada até 2025-11-29T15:30:00.000Z"
}
```

### Verificar Logs no Banco

```sql
-- Ver logs de reautenticação
SELECT * FROM logs 
WHERE action LIKE '%REAUTH%' 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver logs de bloqueio
SELECT * FROM logs 
WHERE action = 'LOCK_ACCOUNT' 
ORDER BY created_at DESC;

-- Ver logs de atualização
SELECT * FROM logs 
WHERE action IN ('UPDATE_EMAIL', 'UPDATE_PASSWORD') 
ORDER BY created_at DESC;

-- Verificar tentativas falhas
SELECT email, failed_attempts, account_locked_until 
FROM auth 
WHERE failed_attempts > 0;
```

## Interpretação dos Resultados

### Resultado APROVADO

**Critérios**:
- Taxa de sucesso de reautenticação ≥ 95%
- 100% das alterações registradas em log
- 100% das senhas validadas conforme critérios

**Significado**:
- Sistema de reautenticação funcionando corretamente
- Todas as alterações auditadas
- Proteção adequada contra senhas fracas
- Sistema pronto para produção

### Resultado PARCIAL

**Critérios**:
- Taxa de sucesso de reautenticação entre 85-95%
- 95-99% das alterações registradas em log
- Alguns cenários de bloqueio falhando

**Ações Recomendadas**:
1. Verificar tempo de expiração dos códigos
2. Validar lógica de incremento de failed_attempts
3. Testar bloqueio de conta manualmente
4. Revisar logs de erro na aplicação

### Resultado REPROVADO

**Critérios**:
- Taxa de sucesso de reautenticação < 85%
- Alterações não registradas em log
- Senhas fracas sendo aceitas
- Bloqueio de conta não funcionando

**Ações Imediatas**:

**1. Verificar Armazenamento de Códigos**
```javascript
// No AuthService.js
console.log('_reauthStore:', AuthService._reauthStore);
```

**2. Verificar Validação de Senha**
```javascript
const testPassword = "Teste@123";
const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;
console.log('Senha válida:', regex.test(testPassword)); // deve ser true
```

**3. Verificar Bloqueio de Conta**
```sql
SELECT id, email, failed_attempts, account_locked_until 
FROM auth 
WHERE email = 'usuario@test.com';
```

**4. Verificar Logs**
```sql
SELECT COUNT(*) FROM logs WHERE action = 'REQ_REAUTH';
SELECT COUNT(*) FROM logs WHERE action = 'UPDATE_EMAIL';
SELECT COUNT(*) FROM logs WHERE action = 'UPDATE_PASSWORD';
```

## Troubleshooting

### Problema: "Código não está sendo enviado"

**Causa**: Em desenvolvimento, código não é enviado por email/SMS

**Solução**:
```javascript
// Verificar console do backend
console.log(`[DEV] Reauth code for ${email}: ${code}`);
```

**Produção**: Integrar com serviço de email (SendGrid, AWS SES)

### Problema: "Código sempre inválido"

**Possíveis Causas**:
1. Código expirou (> 5 minutos)
2. Código não está no _reauthStore
3. Comparação de string vs número

**Solução**:
```javascript
// Verificar no AuthService.js
const rec = AuthService._reauthStore.get(String(authId));
console.log('Código armazenado:', rec?.code);
console.log('Código recebido:', String(code));
console.log('Códigos iguais:', rec?.code === String(code));
```

### Problema: "Conta não está sendo bloqueada"

**Solução**:
```sql
-- Verificar valores no banco
SELECT email, failed_attempts, account_locked_until 
FROM auth 
WHERE email = 'usuario@test.com';

-- Resetar manualmente para testar
UPDATE auth 
SET failed_attempts = 0, account_locked_until = NULL 
WHERE email = 'usuario@test.com';
```

### Problema: "Email duplicado não está sendo rejeitado"

**Causa**: Constraint UNIQUE não criada

**Solução**:
```sql
-- Verificar constraint
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'auth'::regclass 
AND contype = 'u';

-- Criar constraint se não existir
ALTER TABLE auth ADD CONSTRAINT auth_email_unique UNIQUE (email);
```

### Problema: "ReauthToken não está funcionando"

**Solução**:
```javascript
// Verificar payload do token
const jwt = require('jsonwebtoken');
const decoded = jwt.decode(reauthToken);
console.log('Token payload:', decoded);

// Verificar expiração
const now = Date.now() / 1000;
console.log('Token expirado:', decoded.exp < now);

// Verificar purpose
console.log('Purpose correto:', decoded.purpose === 'reauth');
```

### Problema: "Senha fraca sendo aceita"

**Solução**:
```javascript
// Testar regex manualmente
const password = "senha123"; // fraca
const strong = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;
console.log('Senha válida:', strong.test(password)); // deve ser false

// Senha válida
const passwordForte = "Senh@123";
console.log('Senha forte válida:', strong.test(passwordForte)); // deve ser true
```

## Conformidade com Requisitos

| Requisito | Implementação | Status |
|-----------|---------------|--------|
| Exigir autenticação | Fluxo de 3 etapas: credenciais + código + token | ✓ |
| Validar email não duplicado | Constraint UNIQUE no banco de dados | ✓ |
| Validar força da senha | Regex com 8+ chars, letras, números, especiais | ✓ |
| Registrar alterações em log | LogService para todas as operações | ✓ |
| Confirmação visual | Resposta JSON com success: true | ✓ |
| Bloqueio após 3 falhas | lockAccount por 30 minutos | ✓ |
| Código expira em 5 min | expiresAt = Date.now() + 5 * 60 * 1000 | ✓ |
| Token reauth expira em 10 min | JWT expiresIn: "10m" | ✓ |

## Integração no Sistema

```javascript
// src/index.js ou src/app.js
import authRoutes from "./routes/authRoutes.js";

// Rotas de autenticação
app.use("/auth", authRoutes);

// Rotas de reautenticação (incluídas em authRoutes)
// POST /auth/reauth/request
// POST /auth/reauth/verify
// POST /auth/update-email
// POST /auth/update-password
```

## Fluxo de Integração Frontend

### 1. Tela de Alteração de Email

```javascript
// 1. Solicitar reautenticação
const requestReauth = async () => {
    const response = await fetch('/auth/reauth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: currentEmail, 
            password: currentPassword 
        })
    });
    const data = await response.json();
    setAuthId(data.authId);
    // Mostrar tela de inserção de código
};

// 2. Verificar código
const verifyCode = async (code) => {
    const response = await fetch('/auth/reauth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authId, code })
    });
    const data = await response.json();
    setReauthToken(data.reauthToken);
    // Mostrar tela de novo email
};

// 3. Atualizar email
const updateEmail = async (newEmail) => {
    const response = await fetch('/auth/update-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ authId, email: newEmail, reauthToken })
    });
    const data = await response.json();
    if (data.success) {
        // Mostrar mensagem de sucesso
        alert('Email atualizado com sucesso!');
    }
};
```

### 2. Tela de Alteração de Senha

```javascript
// Mesmo fluxo de reautenticação, depois:
const updatePassword = async (newPassword) => {
    // Validar senha no frontend primeiro
    const strong = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/.test(newPassword);
    if (!strong) {
        alert('Senha não atende aos critérios de segurança');
        return;
    }
    
    const response = await fetch('/auth/update-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ authId, newPassword, reauthToken })
    });
    const data = await response.json();
    if (data.success) {
        alert('Senha atualizada com sucesso!');
    }
};
```

## Melhorias Futuras

### 1. Envio de Código por Email/SMS

**Atual**: Código exibido no console (desenvolvimento)

**Produção**:
```javascript
// Email com SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
    to: user.email,
    from: 'noreply@fitlife.com',
    subject: 'Código de Verificação',
    text: `Seu código de verificação é: ${code}`,
    html: `<strong>Seu código de verificação é: ${code}</strong>`
};

await sgMail.send(msg);

// SMS com Twilio
import twilio from 'twilio';
const client = twilio(accountSid, authToken);

await client.messages.create({
    body: `Seu código FitLife: ${code}`,
    from: '+1234567890',
    to: user.phone
});
```

### 2. Armazenamento Distribuído

**Atual**: In-memory Map (não escala para múltiplas instâncias)

**Produção com Redis**:
```javascript
import Redis from 'ioredis';
const redis = new Redis();

// Armazenar código
await redis.setex(
    `reauth:${authId}`,
    300, // 5 minutos
    JSON.stringify({ code, attempts: 0 })
);

// Recuperar código
const data = await redis.get(`reauth:${authId}`);
const rec = JSON.parse(data);

// Deletar após uso
await redis.del(`reauth:${authId}`);
```

### 3. Autenticação de Dois Fatores (2FA) Permanente

**Implementar TOTP** (Time-based One-Time Password):
```javascript
import speakeasy from 'speakeasy';

// Gerar secret para usuário
const secret = speakeasy.generateSecret({ name: 'FitLife' });

// Verificar token
const verified = speakeasy.totp.verify({
    secret: user.twofa_secret,
    encoding: 'base32',
    token: userToken,
    window: 2
});
```

### 4. Notificação de Alterações

**Email de confirmação**:
```javascript
// Após atualização bem-sucedida
await sendEmail({
    to: user.email,
    subject: 'Email Alterado',
    text: `Seu email foi alterado para ${newEmail}. Se não foi você, contate o suporte.`
});
```

### 5. Histórico de Alterações

**Tabela de auditoria específica**:
```sql
CREATE TABLE account_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth(id),
    change_type VARCHAR(50), -- 'email', 'password'
    old_value TEXT, -- hash ou email criptografado
    new_value TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    reauth_method VARCHAR(50), -- 'code', '2fa'
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. Perguntas de Segurança

**Para recuperação de conta bloqueada**:
```sql
CREATE TABLE security_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth(id),
    question VARCHAR(255),
    answer_hash VARCHAR(255), -- bcrypt hash
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

**Criado em:** 29/11/2025
**Versão:** 1.0.0
