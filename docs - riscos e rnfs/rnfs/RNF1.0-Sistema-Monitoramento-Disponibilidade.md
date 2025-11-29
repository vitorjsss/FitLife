# RNF1.0: Sistema de Monitoramento de Disponibilidade

## Requisito Não-Funcional

**RNF1.0: Disponibilidade de 90% para Funcionalidades Críticas**

- Objetivo: Garantir 90% de disponibilidade para funcionalidades críticas (login, dietas, treinos)
- Limite de Indisponibilidade: Máximo de 72 horas por mês
- Monitoramento: Automático e contínuo
- Alertas: Notificações automáticas aos administradores em caso de falha
- Auditoria: Logs detalhados para análise

## Métrica de Qualidade

### Fórmula de Disponibilidade
```
X = (Ttotal - Tindisponibilidade) / Ttotal
```

Onde:
- **Ttotal**: Tempo total de observação
- **Tindisponibilidade**: Tempo em que a funcionalidade esteve fora do ar

### Requisito
**X ≥ 0.90 (90%)**

### Limite de Indisponibilidade
**Máximo de 72 horas por mês** (aproximadamente 10% de 720 horas)

## Arquitetura Implementada

### 1. Middleware de Monitoramento
**Arquivo**: `backend/src/middlewares/availabilityMonitor.js`

O middleware intercepta todas as requisições aos endpoints críticos e registra:
- Total de requisições
- Requisições bem-sucedidas (2xx, 3xx)
- Requisições falhadas (4xx, 5xx)
- Erros críticos (5xx)
- Tempo de resposta
- Erros por endpoint

#### Endpoints Críticos Monitorados:
```javascript
const CRITICAL_ENDPOINTS = [
    '/auth/login',           // Autenticação
    '/auth/register',        // Cadastro
    '/patient',              // Pacientes
    '/daily-meal-registry',  // Registro de refeições
    '/meal-record',          // Refeições registradas
    '/workout',              // Treinos
    '/workout-session'       // Sessões de treino
];
```

### 2. Health Check Controller
**Arquivo**: `backend/src/controllers/HealthCheckController.js`

#### `GET /health/ping`
- Endpoint simples de ping/pong
- Público (não requer autenticação)

#### `GET /health/status`
- Verifica status completo do sistema
- Público (não requer autenticação)
- Verifica API e banco de dados
- Retorna métricas de disponibilidade e uptime

#### `GET /health/availability`
- Relatório detalhado de disponibilidade
- Requer autenticação (token JWT)
- Retorna análise completa incluindo disponibilidade, uptime, downtime, requisições e erros por endpoint

#### `POST /health/reset`
- Reset manual das estatísticas mensais
- Requer autenticação (somente admin)
- Uso: apenas para testes ou manutenção

### 3. Rotas de Health Check
**Arquivo**: `backend/src/routes/healthCheckRoutes.js`

```javascript
GET  /health/ping          - Ping simples (público)
GET  /health/status        - Status do sistema (público)
GET  /health/availability  - Relatório detalhado (autenticado)
POST /health/reset         - Reset manual (admin)
```

## Métricas Calculadas

### Disponibilidade
```
Disponibilidade = (Requisições Bem-sucedidas / Total de Requisições) × 100
```
- Meta: ≥ 90%
- Medição: Baseada em respostas HTTP
- Sucesso: Status 2xx e 3xx
- Falha: Status 4xx e 5xx

### Uptime
```
Uptime = ((Tempo Total - Downtime) / Tempo Total) × 100
```
- Meta: ≥ 90%
- Medição: Tempo em minutos
- Máximo Downtime: 72 horas/mês (4320 minutos)

### Status do Sistema
O sistema é considerado saudável quando:
- Disponibilidade ≥ 90%
- Uptime ≥ 90%
- Banco de dados acessível
- Tempo de resposta < 5s

## Sistema de Alertas

### Quando Alertas São Disparados

1. Erro Crítico (5xx) em endpoint crítico
2. Disponibilidade < 90%

### Canais de Notificação

Atualmente implementado:
- Console Logs: Para desenvolvimento e debugging
- Audit Logs: Registros no banco de dados via LogService

Pronto para integração:
- Email: SendGrid, AWS SES, Nodemailer
- SMS: Twilio
- Slack/Discord: Webhooks
- PagerDuty: Para equipes DevOps

## Reset Automático Mensal

### Processo de Reset

1. Captura métricas atuais
2. Salva relatório mensal no banco (via LogService)
3. Reseta contadores para zero
4. Mantém timestamp de último reset
5. Log de confirmação

## Funcionalidades Críticas Testadas

### 1. Login
Autenticação de usuários no sistema

**Endpoint:** `POST /auth/login`

**Critérios:**
- Deve responder com sucesso (HTTP 200)
- Deve retornar token JWT válido
- Tempo de resposta < 2 segundos

### 2. Visualização de Dietas
Listagem de registros alimentares do paciente

**Endpoint:** `GET /meal/patient/:id`

**Critérios:**
- Deve responder com sucesso (HTTP 200)
- Deve retornar array de registros
- Tempo de resposta < 2 segundos

### 3. Visualização de Treinos
Listagem de registros de exercícios do paciente

**Endpoint:** `GET /workout/patient/:id`

**Critérios:**
- Deve responder com sucesso (HTTP 200)
- Deve retornar array de registros
- Tempo de resposta < 2 segundos

## Estrutura dos Testes

### Teste 1: Disponibilidade da Funcionalidade de Login
Valida se o login está disponível e respondendo adequadamente.

**Cenários:**
- Login deve responder com sucesso
- Login deve responder em tempo aceitável (< 2s)
- Múltiplas tentativas de login consecutivas (teste de estabilidade)

**Validações:**
- Status HTTP 200
- Token JWT retornado
- Tempo de resposta < 2000ms
- Taxa de sucesso ≥ 90%

### Teste 2: Disponibilidade da Visualização de Dietas
Valida se a visualização de dietas está disponível.

**Cenários:**
- Listagem de dietas deve responder com sucesso
- Visualização de dietas deve responder em tempo aceitável
- Múltiplas consultas de dietas consecutivas

**Validações:**
- Status HTTP 200
- Array de registros retornado
- Tempo de resposta < 2000ms
- Taxa de sucesso ≥ 90%

### Teste 3: Disponibilidade da Visualização de Treinos
Valida se a visualização de treinos está disponível.

**Cenários:**
- Listagem de treinos deve responder com sucesso
- Visualização de treinos deve responder em tempo aceitável
- Múltiplas consultas de treinos consecutivas

**Validações:**
- Status HTTP 200
- Array de registros retornado
- Tempo de resposta < 2000ms
- Taxa de sucesso ≥ 90%

### Teste 4: Teste de Carga e Estabilidade
Valida se o sistema suporta múltiplas funcionalidades simultaneamente.

**Validações:**
- Execução paralela de login, dietas e treinos
- Taxa de sucesso ≥ 90%
- Sem degradação significativa de performance

### Teste 5: Registro de Logs de Indisponibilidade
Valida se o sistema registra e alerta sobre indisponibilidades.

**Validações:**
- Tabela `availability_log` existe e funciona
- Logs contêm: funcionalidade, status, duração, detalhes, timestamp

## Como Executar os Testes

### Pré-requisitos
1. Node.js v18+ instalado
2. PostgreSQL rodando (porta 5433)
3. Dependências do backend instaladas (`npm install`)
4. Banco de dados configurado
5. Rotas de API implementadas

### Opção 1: Script PowerShell (Windows)
```powershell
cd C:\GP\FitLife\backend
.\test-availability.ps1
```

### Opção 2: Script Bash (Linux/Mac)
```bash
cd /path/to/FitLife/backend
chmod +x test-availability.sh
./test-availability.sh
```

### Opção 3: NPM Direto
```bash
npm test -- tests/validation/availability.test.js
```

### Opção 4: Com Verbose
```bash
npm test -- tests/validation/availability.test.js --verbose
```

## Estrutura da Tabela availability_log

```sql
CREATE TABLE IF NOT EXISTS availability_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    functionality VARCHAR(50) NOT NULL,      -- 'login', 'diet', 'workout'
    status VARCHAR(20) NOT NULL,              -- 'up', 'down', 'slow'
    duration_ms INTEGER,                       -- Duração da operação em ms
    details TEXT,                              -- Detalhes da falha/sucesso
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_availability_log_functionality ON availability_log(functionality);
CREATE INDEX idx_availability_log_created_at ON availability_log(created_at);
```

## Interpretação dos Resultados

### Resultado APROVADO (X ≥ 90%)

Significado:
- Disponibilidade geral acima de 90%
- Todas as funcionalidades críticas operacionais
- Sistema pronto para produção
- Conformidade com RNF1.0

### Resultado PARCIAL (85% ≤ X < 90%)

Ações Recomendadas:
1. Identificar gargalos - Verificar qual funcionalidade está falhando
2. Otimizar queries - Melhorar performance do banco de dados
3. Aumentar recursos - Considerar escalonamento horizontal
4. Monitorar logs - Acompanhar tendências de falhas

### Resultado REPROVADO (X < 85%)

Ações Imediatas:

1. Verificar Status dos Serviços
```powershell
curl http://localhost:5001/health
docker ps | findstr fitlife-db
```

2. Analisar Logs de Erros
```powershell
docker logs fitlife-backend-1 --tail 100
psql -U fitlife -d fitlife -c "SELECT * FROM availability_log ORDER BY created_at DESC LIMIT 20;"
```

3. Verificar Rotas da API
```bash
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

4. Verificar Performance do Banco
```sql
SELECT * FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

## Troubleshooting

### Problema: "Erro ao conectar ao banco de dados"

Solução:
```powershell
docker-compose up -d db
docker exec fitlife-db-1 psql -U fitlife -d fitlife -c "SELECT NOW();"
```

### Problema: "Timeout: No response within 2000ms"

Solução:
```javascript
const TIMEOUT_THRESHOLD = 5000; // Aumentar timeout temporariamente
```

### Problema: "Token inválido ou expirado"

Solução:
```bash
echo $JWT_SECRET
npm test -- tests/validation/availability.test.js
```

### Problema: "Rotas não encontradas (404)"

Solução:
```javascript
// Verificar src/routes/index.js
app.use('/auth', authRoutes);
app.use('/meal', mealRoutes);
app.use('/workout', workoutRoutes);
```

## Integração no Sistema

```javascript
import availabilityMonitor from "./middlewares/availabilityMonitor.js";
import healthCheckRoutes from "./routes/healthCheckRoutes.js";

// Middleware de monitoramento (ANTES das rotas)
app.use(availabilityMonitor);

// Health Check (público)
app.use("/health", healthCheckRoutes);

// Demais rotas
app.use("/auth", authRoutes);
app.use("/patient", patientRoutes);
```

## Conformidade com RNF1.0

| Requisito | Implementação |
|-----------|---------------|
| 90% disponibilidade | Monitoramento automático de todos os endpoints críticos |
| Máx 72h downtime/mês | Tracking de downtime em minutos, alertas quando próximo do limite |
| Monitoramento automático | Middleware intercepta todas as requisições |
| Alertas aos admins | Sistema de alertas com logs, pronto para email/SMS/Slack |
| Logs de auditoria | Integração com LogService, relatórios mensais salvos |
| Endpoints críticos | Login, Dietas, Treinos totalmente monitorados |
| Health checks | 4 endpoints: ping, status, availability, reset |

---