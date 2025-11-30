# RNF3.0: Segurança de Autenticação e Controle de Acesso

## Requisito Não-Funcional

**RNF: Segurança de Autenticação**

Ambiente: Usuário está utilizando a parte do sistema de acesso ao app.

Estímulo: Usuário tenta realizar login.

Resposta: O sistema deve garantir que o login seja realizado de forma segura, implementando políticas rigorosas de senha. O sistema também deve bloquear a conta após tentativas falhas de login e notificar o usuário sobre a tentativa de acesso mal-sucedida.

Medida de resposta: Para assegurar a proteção e o controle de acesso ao sistema, serão implementados registros detalhados de cada tentativa de login, armazenando informações como data, hora, endereço IP, localização e status. Limitar o número de tentativas para três por usuário ajudará a impedir acessos indevidos, enquanto tentativas suspeitas serão automaticamente bloqueadas. Um monitoramento contínuo permitirá respostas rápidas a comportamentos incomuns. Além disso, o sistema será submetido a varreduras de segurança através de testes de penetração regulares para identificar vulnerabilidades e manter a eficácia dos controles, garantindo que todos os acessos não autorizados sejam bloqueados mensalmente.

## Critérios de Aceitação

1. O sistema deve exigir autenticação por e-mail e senha para todos os usuários
2. As senhas devem ser armazenadas de forma criptografada
3. Logs de acesso devem ser registrados para auditoria e detecção de possíveis invasões
4. O sistema deve bloquear contas após 3 tentativas falhas consecutivas
5. Tentativas de login devem registrar IP, User-Agent e timestamp
6. Contas bloqueadas devem ser notificadas ao usuário

## Riscos Identificados

### Desempenho
Mecanismos de criptografia, autenticação e geração de logs podem aumentar a carga no servidor, reduzindo o desempenho em horários de pico.

### Disponibilidade
Autenticação muito rígida ou falhas nos mecanismos de segurança podem impedir o acesso legítimo dos usuários.

### Confiabilidade
Erros na implementação de recuperação de senha ou falhas nos registros de log podem comprometer a confiança do usuário na integridade do sistema.

Story Point Estimado: 8

## Métricas de Qualidade

### 1. Cobertura de Registro de Login
```
x = Ntentativas_registradas / Ntentativas_totais
```

Onde:
- **Ntentativas_registradas**: Número de tentativas de login registradas no sistema de logs
- **Ntentativas_totais**: Número total de tentativas de login realizadas

Requisito: **x ≥ 1.0 (100%)**

### 2. Taxa de Bloqueio de Contas Suspeitas
```
y = Ncontas_bloqueadas / Ntentativas_suspeitas
```

Onde:
- **Ncontas_bloqueadas**: Número de contas bloqueadas por tentativas excessivas
- **Ntentativas_suspeitas**: Número de tentativas que atingiram 3 ou mais falhas consecutivas

Requisito: **y ≥ 1.0 (100%)**

### 3. Segurança de Senhas
```
z = Nsenhas_conformes / Nsenhas_totais
```

Onde:
- **Nsenhas_conformes**: Senhas que atendem aos requisitos de complexidade
- **Nsenhas_totais**: Total de senhas criadas/alteradas

Requisito: **z ≥ 1.0 (100%)**

## Arquitetura Implementada

### 1. Sistema de Autenticação

**Arquivo**: `backend/src/controllers/AuthController.js`

#### Endpoints de Autenticação

##### `POST /auth/login`
- Autenticação de usuários
- Validação de credenciais
- Geração de tokens JWT (Access + Refresh)
- Registro de tentativas no log
- Bloqueio automático após 3 tentativas falhas

##### `POST /auth/register`
- Cadastro de novos usuários
- Validação de email e senha
- Criptografia de senha com bcrypt
- Registro de criação no log

##### `POST /auth/request-reauth`
- Solicitação de reautenticação
- Geração de código de verificação
- Validação de credenciais atuais

##### `POST /auth/verify-reauth`
- Verificação de código de reautenticação
- Geração de token temporário para operações sensíveis

##### `POST /auth/update-password`
- Atualização de senha
- Requer token de reautenticação
- Validação de requisitos de senha

### 2. Serviço de Autenticação

**Arquivo**: `backend/src/services/AuthService.js`

#### Funcionalidades Principais

**Registro de Usuário**
- Hash de senha com bcrypt (10 rounds)
- Criação de registro no banco de dados
- Geração automática de UUID

**Login**
- Verificação de bloqueio de conta
- Comparação de hash bcrypt
- Incremento de tentativas falhas
- Bloqueio automático (15 minutos após 3 falhas)
- Reset de tentativas falhas em login bem-sucedido
- Geração de tokens JWT (access token 1h, refresh token 7d)

**Bloqueio de Conta**
- Bloqueio por 15 minutos após 3 tentativas falhas
- Bloqueio por 30 minutos em tentativas de reautenticação
- Registro em log de todos os bloqueios

**Reautenticação**
- Código de 6 dígitos com validade de 5 minutos
- Máximo de 3 tentativas de verificação
- Geração de token temporário (5 minutos)

### 3. Sistema de Logs

**Arquivo**: `backend/src/services/LogService.js`

**Tabela**: `logs`

Estrutura:
```sql
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    log_type VARCHAR(50) NOT NULL,
    description TEXT,
    ip VARCHAR(45),
    old_value TEXT,
    new_value TEXT,
    status VARCHAR(20) DEFAULT 'SUCCESS',
    user_id UUID REFERENCES auth(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tipos de Logs Registrados

**LOGIN**
- Ação: `LOGIN`
- Log Type: `ACCESS` (sucesso) ou `ERROR` (falha)
- Campos: IP, email, timestamp, status

**REGISTER**
- Ação: `REGISTER`
- Log Type: `ACCESS` (sucesso) ou `ERROR` (falha)
- Campos: IP, email, user_type, timestamp

**LOCK_ACCOUNT**
- Ação: `LOCK_ACCOUNT`
- Log Type: `SECURITY`
- Campos: email, lockUntil, IP, timestamp

**REQ_REAUTH**
- Ação: `REQ_REAUTH`
- Log Type: `ACCESS` (código gerado) ou `ERROR` (falha)
- Campos: authId, IP, timestamp

**UPDATE_PASSWORD**
- Ação: `UPDATE_PASSWORD`
- Log Type: `ACCESS` (sucesso) ou `ERROR` (falha)
- Campos: authId, IP, timestamp

### 4. Validação de Credenciais

**Arquivo**: `backend/src/utils/validationRules.js`

#### Regras de Email

Formato aceito:
```
user@domain.com
user.name@domain.co.uk
user+tag@domain.com
```

Validações:
- Comprimento: 5-254 caracteres
- Formato: regex `/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`
- Parte local: 1-64 caracteres
- Domínio válido com TLD mínimo de 2 caracteres
- Sem pontos consecutivos
- Não pode começar/terminar com ponto

#### Regras de Senha

Requisitos obrigatórios:
- Mínimo 8 caracteres
- Máximo 128 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial (!@#$%^&*...)

Validações adicionais:
- Rejeição de sequências comuns (12345, qwerty, password)
- Análise de força da senha (weak, medium, strong)

Função de validação:
```javascript
validatePassword(password) {
    // Retorna: { valid: boolean, error: string, strength: string }
}
```

### 5. Criptografia de Senhas

**Biblioteca**: bcrypt

**Implementação**:
```javascript
// Registro
const hashedPassword = await bcrypt.hash(password, 10);

// Login
const valid = await bcrypt.compare(password, user.password);
```

**Configuração**:
- Rounds: 10 (balanço entre segurança e performance)
- Algoritmo: bcrypt (resistente a ataques de força bruta)
- Hash único por senha (salt automático)

### 6. Tokens JWT

**Biblioteca**: jsonwebtoken

**Access Token**:
- Validade: 1 hora
- Payload: id, email, user_type, professionalId
- Secret: `process.env.JWT_SECRET`

**Refresh Token**:
- Validade: 7 dias
- Payload: email
- Secret: `process.env.JWT_REFRESH_SECRET`
- Armazenado no banco de dados

## Estrutura dos Testes

### Teste 1: Registro de Login Bem-Sucedido
Valida se logins bem-sucedidos são registrados no sistema de logs.

**Arquivo**: `backend/tests/validation/login-audit.test.js`

**Cenários**:
- 1.1 - Login bem-sucedido deve ser registrado
- 1.2 - Log deve conter informações completas (user_id, action, timestamp)

**Validações**:
- Incremento no contador de logs após login
- Presença de campos obrigatórios (action, user_id, created_at)
- Status SUCCESS
- Token JWT retornado

### Teste 2: Registro de Login com Falha
Valida se tentativas falhadas de login são registradas.

**Cenários**:
- 2.1 - Tentativa com senha incorreta
- 2.2 - Tentativa com usuário inexistente
- 2.3 - Múltiplas tentativas falhadas consecutivas

**Validações**:
- Registro de cada tentativa falhada
- Detalhamento do motivo da falha
- Incremento correto do contador failed_attempts
- Status FAILURE

### Teste 3: Registro de Bloqueio de Conta
Valida se bloqueios de conta por tentativas excessivas são registrados.

**Cenários**:
- 3.1 - Conta bloqueada após 3 tentativas falhadas

**Validações**:
- Registro do evento de bloqueio
- Timestamp do bloqueio (account_locked_until)
- Log contém informações sobre o motivo do bloqueio
- Status HTTP 403 retornado

### Teste 4: Registro de Metadados
Valida se informações adicionais são registradas para auditoria.

**Cenários**:
- 4.1 - IP do cliente é registrado
- 4.2 - User-Agent é registrado

**Validações**:
- Presença de ip_address ou IP nos details
- Presença de user_agent ou info do navegador nos details

### Teste 5: Persistência dos Logs
Valida a integridade e durabilidade dos registros.

**Cenários**:
- 5.1 - Logs persistem após múltiplas operações
- 5.2 - Timestamps são corretos e consistentes
- 5.3 - Logs são recuperáveis por período (filtros de data)

**Validações**:
- Logs não são perdidos em operações concorrentes
- Timestamps refletem o momento exato da tentativa
- Queries de busca por período funcionam corretamente

### Teste 6: Validação de Credenciais (Risco 8)
Valida as regras de validação de email e senha.

**Arquivo**: `backend/tests/validation/risco-8-credenciais-validation.js`

**Categorias de Testes**:

**6.1 - Validação de Email**
- Aceitar emails válidos (user@example.com, user.name@domain.co.uk)
- Rejeitar emails sem @
- Rejeitar emails sem domínio
- Rejeitar emails com pontos consecutivos
- Verificar comprimento mínimo e máximo

**6.2 - Validação de Senha**
- Aceitar senhas que atendem todos os requisitos
- Rejeitar senhas muito curtas (< 8 caracteres)
- Rejeitar senhas sem letra maiúscula
- Rejeitar senhas sem letra minúscula
- Rejeitar senhas sem número
- Rejeitar senhas sem caractere especial
- Rejeitar senhas com sequências comuns

**6.3 - Normalização**
- Email: conversão para lowercase, remoção de espaços
- Username: remoção de espaços, validação de caracteres

**6.4 - Validação de Login**
- Validar conjunto completo de credenciais
- Retornar múltiplos erros quando aplicável

## Como Executar os Testes

### Pré-requisitos
1. Node.js v18+ instalado
2. PostgreSQL rodando (porta 5433)
3. Dependências do backend instaladas (npm install)
4. Banco de dados configurado
5. Tabela logs criada

### Opção 1: Teste de Registro de Login (Auditoria)

Script PowerShell (Windows):
```powershell
cd C:\GP\FitLife\backend
.\test-login-audit.ps1
```

Script Bash (Linux/Mac):
```bash
cd /path/to/FitLife/backend
chmod +x test-login-audit.sh
./test-login-audit.sh
```

NPM Direto:
```bash
npm test -- tests/validation/login-audit.test.js
```

### Opção 2: Teste de Validação de Credenciais

Script Node:
```bash
cd backend
node tests/validation/risco-8-credenciais-validation.js
```

NPM (se configurado):
```bash
npm test -- tests/validation/risco-8-credenciais-validation.js
```

### Opção 3: Todos os Testes de Segurança

```bash
npm test -- tests/validation/login-audit.test.js tests/validation/risco-8-credenciais-validation.js
```

## Interpretação dos Resultados

### Teste de Registro de Login

**APROVADO (x = 100%)**

Significado:
- Todas as tentativas de login foram registradas
- Sistema pronto para auditoria e conformidade (LGPD, ISO 27001)
- Rastreabilidade completa de acessos

**PARCIAL (95% ≤ x < 100%)**

Ações Recomendadas:
1. Revisar logs de aplicação para identificar erros
2. Verificar se LogService.createLog() está sendo chamado
3. Testar manualmente os cenários que falharam
4. Verificar permissões do banco de dados

**REPROVADO (x < 95%)**

Ações Imediatas:
1. Verificar implementação do LogService
2. Confirmar que tabela logs existe
3. Testar INSERT manual na tabela
4. Revisar código de autenticação

### Teste de Validação de Credenciais

**APROVADO (100% dos testes passaram)**

Significado:
- Validações de email e senha funcionando corretamente
- Sistema protegido contra credenciais fracas
- Risco 8 mitigado com sucesso

**REPROVADO (falhas detectadas)**

Ações Imediatas:
1. Verificar implementação de validationRules.js
2. Testar regex de email e senha
3. Revisar casos de borda não cobertos
4. Adicionar testes para cenários faltantes

## Troubleshooting

### Problema: "Erro ao conectar ao banco de dados"

Solução:
```bash
# Verificar se PostgreSQL está rodando
docker ps

# Iniciar container se necessário
docker-compose up -d db

# Testar conexão
docker exec fitlife-db-1 psql -U fitlife -d fitlife -c "SELECT NOW();"
```

### Problema: "Tabela logs não existe"

Solução:
```sql
-- Executar script de criação da tabela
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    log_type VARCHAR(50) NOT NULL,
    description TEXT,
    ip VARCHAR(45),
    old_value TEXT,
    new_value TEXT,
    status VARCHAR(20) DEFAULT 'SUCCESS',
    user_id UUID REFERENCES auth(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_action ON logs(action);
CREATE INDEX idx_logs_created_at ON logs(created_at);
```

### Problema: "Logs não estão sendo criados"

Possíveis Causas:
1. LogService não configurado
2. Erro silencioso no try-catch
3. Permissões insuficientes no PostgreSQL

Solução:
```javascript
// Verificar importação do LogService
import { LogService } from '../services/LogService.js';

// Verificar chamada após login
await LogService.createLog({
    action: "LOGIN",
    logType: "ACCESS",
    description: "Login bem-sucedido",
    ip: req.ip,
    status: "SUCCESS",
    userId: user.id
});
```

### Problema: "Senha não aceita caracteres especiais"

Solução:
```javascript
// Verificar regex em validationRules.js
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;

// Testar manualmente
const password = "Test@123";
console.log(PASSWORD_REGEX.test(password)); // deve retornar true
```

### Problema: "Conta não está sendo bloqueada"

Solução:
```javascript
// Verificar lógica de bloqueio em AuthService.js
if (user.failed_attempts + 1 >= 3) {
    const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    await AuthRepository.lockAccount(user.email, lockUntil);
    return { locked: true, until: lockUntil };
}

// Verificar coluna no banco
SELECT email, failed_attempts, account_locked_until FROM auth;
```

## Conformidade com Requisitos

| Requisito | Implementação | Status |
|-----------|---------------|--------|
| Autenticação obrigatória | POST /auth/login com email e senha | ✓ |
| Senhas criptografadas | bcrypt com 10 rounds | ✓ |
| Logs de auditoria | Tabela logs com todas as tentativas | ✓ |
| Bloqueio após 3 tentativas | AuthService.login com incrementFailedAttempts | ✓ |
| Registro de IP | LogService com campo ip_address | ✓ |
| Registro de User-Agent | LogService com campo user_agent | ✓ |
| Validação de email | validateEmail com regex e regras | ✓ |
| Validação de senha | validatePassword com requisitos de complexidade | ✓ |
| Tokens JWT | Access token (1h) + Refresh token (7d) | ✓ |
| Notificação de bloqueio | Resposta HTTP 403 com mensagem | ✓ |

## Integração no Sistema

```javascript
// src/index.js ou src/app.js
import authRoutes from "./routes/authRoutes.js";
import { LogService } from "./services/LogService.js";

// Rotas de autenticação
app.use("/auth", authRoutes);

// Middleware para registrar tentativas de acesso
app.use((req, res, next) => {
    res.on('finish', () => {
        if (req.path.includes('/auth/login')) {
            LogService.createLog({
                action: "LOGIN_ATTEMPT",
                logType: "ACCESS",
                description: `Tentativa de login: ${req.method} ${req.path}`,
                ip: req.ip,
                status: res.statusCode < 400 ? "SUCCESS" : "FAILURE"
            });
        }
    });
    next();
});
```

## Checklist de Segurança

### Autenticação
- [x] Email e senha obrigatórios
- [x] Validação de formato de email
- [x] Requisitos de senha complexa
- [x] Criptografia bcrypt
- [x] Tokens JWT com expiração

### Controle de Acesso
- [x] Bloqueio após 3 tentativas falhas
- [x] Bloqueio temporário (15 minutos)
- [x] Reset de tentativas em login bem-sucedido
- [x] Verificação de conta bloqueada

### Auditoria
- [x] Registro de todas as tentativas de login
- [x] Registro de bloqueios de conta
- [x] Registro de IP e User-Agent
- [x] Timestamps em todos os logs
- [x] Logs recuperáveis por período

### Validação
- [x] Validação de email (formato, comprimento, domínio)
- [x] Validação de senha (comprimento, complexidade, sequências)
- [x] Normalização de dados (lowercase, trim)
- [x] Mensagens de erro claras

### Testes
- [x] Testes de registro de login (11 cenários)
- [x] Testes de validação de credenciais (40+ cenários)
- [x] Testes de bloqueio de conta
- [x] Testes de persistência de logs
- [x] Testes de metadados (IP, User-Agent)