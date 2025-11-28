# 📊 Testes de Qualidade - Disponibilidade de Funcionalidades Críticas (RNF1.0)

## 🎯 Objetivo

Validar a **taxa de disponibilidade das funcionalidades críticas** do sistema FitLife (Login, Visualização de Dietas e Treinos), garantindo que estejam disponíveis e funcionais com disponibilidade mínima de 90%.

## 📐 Métrica de Qualidade

### Fórmula
```
X = (Ttotal - Tindisponibilidade) / Ttotal
```

Onde:
- **Ttotal**: Tempo total de observação (em segundos ou horas)
- **Tindisponibilidade**: Tempo em que a funcionalidade esteve fora do ar

### Requisito
**X ≥ 0.90 (90%)**

### Limite de Indisponibilidade
**Máximo de 72 horas por mês** (~10% de 720 horas)

---

## 🔐 Funcionalidades Críticas Testadas

### 1. **Login** 🔐
Autenticação de usuários no sistema

**Endpoint:** `POST /auth/login`

**Critérios:**
- Deve responder com sucesso (HTTP 200)
- Deve retornar token JWT válido
- Tempo de resposta < 2 segundos

---

### 2. **Visualização de Dietas** 🍽️
Listagem de registros alimentares do paciente

**Endpoint:** `GET /meal/patient/:id`

**Critérios:**
- Deve responder com sucesso (HTTP 200)
- Deve retornar array de registros
- Tempo de resposta < 2 segundos

---

### 3. **Visualização de Treinos** 💪
Listagem de registros de exercícios do paciente

**Endpoint:** `GET /workout/patient/:id`

**Critérios:**
- Deve responder com sucesso (HTTP 200)
- Deve retornar array de registros
- Tempo de resposta < 2 segundos

---

## 🧪 Estrutura dos Testes

### **Teste 1: Disponibilidade da Funcionalidade de Login** 🔐
Valida se o login está disponível e respondendo adequadamente.

**Cenários:**
- 1.1 - Login deve responder com sucesso
- 1.2 - Login deve responder em tempo aceitável (< 2s)
- 1.3 - Múltiplas tentativas de login consecutivas (teste de estabilidade)

**Validações:**
- Status HTTP 200
- Token JWT retornado
- Tempo de resposta < 2000ms
- Taxa de sucesso ≥ 90%

---

### **Teste 2: Disponibilidade da Visualização de Dietas** 🍽️
Valida se a visualização de dietas está disponível.

**Cenários:**
- 2.1 - Listagem de dietas deve responder com sucesso
- 2.2 - Visualização de dietas deve responder em tempo aceitável
- 2.3 - Múltiplas consultas de dietas consecutivas

**Validações:**
- Status HTTP 200
- Array de registros retornado
- Tempo de resposta < 2000ms
- Taxa de sucesso ≥ 90%

---

### **Teste 3: Disponibilidade da Visualização de Treinos** 💪
Valida se a visualização de treinos está disponível.

**Cenários:**
- 3.1 - Listagem de treinos deve responder com sucesso
- 3.2 - Visualização de treinos deve responder em tempo aceitável
- 3.3 - Múltiplas consultas de treinos consecutivas

**Validações:**
- Status HTTP 200
- Array de registros retornado
- Tempo de resposta < 2000ms
- Taxa de sucesso ≥ 90%

---

### **Teste 4: Teste de Carga e Estabilidade** ⚡
Valida se o sistema suporta múltiplas funcionalidades simultaneamente.

**Cenários:**
- 4.1 - Sistema deve suportar carga simultânea de múltiplas funcionalidades

**Validações:**
- Execução paralela de login, dietas e treinos
- Taxa de sucesso ≥ 90%
- Sem degradação significativa de performance

---

### **Teste 5: Registro de Logs de Indisponibilidade** 📋
Valida se o sistema registra e alerta sobre indisponibilidades.

**Cenários:**
- 5.1 - Sistema deve registrar logs de indisponibilidade
- 5.2 - Logs devem conter informações detalhadas

**Validações:**
- Tabela `availability_log` existe e funciona
- Logs contêm: funcionalidade, status, duração, detalhes, timestamp

---

## 🚀 Como Executar os Testes

### **Pré-requisitos**
1. ✅ Node.js v18+ instalado
2. ✅ PostgreSQL rodando (porta 5433)
3. ✅ Dependências do backend instaladas (`npm install`)
4. ✅ Banco de dados configurado
5. ✅ Rotas de API implementadas (`/auth/login`, `/meal/patient/:id`, `/workout/patient/:id`)

### **Opção 1: Script PowerShell (Windows)**
```powershell
cd C:\GP\FitLife\backend
.\test-availability.ps1
```

### **Opção 2: Script Bash (Linux/Mac)**
```bash
cd /c/GP/FitLife/backend
chmod +x test-availability.sh
./test-availability.sh
```

### **Opção 3: NPM Direto**
```bash
npm test -- tests/validation/availability.test.js
```

### **Opção 4: Com Verbose**
```bash
npm test -- tests/validation/availability.test.js --verbose
```

---

## 📋 Estrutura da Tabela `availability_log`

Os testes criam automaticamente a tabela se ela não existir:

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

---

## 📊 Interpretação dos Resultados

### ✅ **Resultado APROVADO (X ≥ 90%)**
```
✅ Testes concluídos com sucesso!
✓ Disponibilidade ≥ 90% - RNF1.0 ATENDIDO
✓ Sistema ATENDE ao requisito RNF1.0
✓ Todas as funcionalidades críticas estão disponíveis
```

**Significado:**
- Disponibilidade geral acima de 90%
- Todas as funcionalidades críticas operacionais
- Sistema pronto para produção
- Conformidade com RNF1.0

**Exemplo de Relatório:**
```
📊 Resultado (X): 98.50%
🔐 Login: 100% disponível
🍽️ Dietas: 97% disponível
💪 Treinos: 98.5% disponível
⏱️ Tempo médio de resposta: 450ms
```

---

### ⚠️ **Resultado PARCIAL (85% ≤ X < 90%)**
```
⚠️ ATENÇÃO: Disponibilidade próxima ao limite!
⚠️ Algumas funcionalidades com problemas
```

**Ações Recomendadas:**
1. **Identificar gargalos** - Verificar qual funcionalidade está falhando
2. **Otimizar queries** - Melhorar performance do banco de dados
3. **Aumentar recursos** - Considerar escalonamento horizontal
4. **Monitorar logs** - Acompanhar tendências de falhas

---

### ❌ **Resultado REPROVADO (X < 85%)**
```
✗ Sistema NÃO ATENDE ao requisito RNF1.0
🚨 CRÍTICO: Disponibilidade abaixo de 90%!
```

**Ações Imediatas:**

#### **1. Verificar Status dos Serviços**
```powershell
# Verificar se backend está rodando
curl http://localhost:5001/health

# Verificar PostgreSQL
docker ps | findstr fitlife-db
```

#### **2. Analisar Logs de Erros**
```powershell
# Logs do backend
docker logs fitlife-backend-1 --tail 100

# Logs de disponibilidade
psql -U fitlife -d fitlife -c "SELECT * FROM availability_log ORDER BY created_at DESC LIMIT 20;"
```

#### **3. Verificar Rotas da API**
```bash
# Testar login manualmente
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Testar dietas
curl http://localhost:5001/meal/patient/{id} \
  -H "Authorization: Bearer {token}"

# Testar treinos
curl http://localhost:5001/workout/patient/{id} \
  -H "Authorization: Bearer {token}"
```

#### **4. Verificar Performance do Banco**
```sql
-- Queries lentas
SELECT * FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Conexões ativas
SELECT count(*) FROM pg_stat_activity;
```

---

## 🔍 Troubleshooting

### **Problema: "Erro ao conectar ao banco de dados"**

**Causa:** PostgreSQL não está acessível

**Solução:**
```powershell
# Iniciar Docker
docker-compose up -d db

# Verificar conexão
docker exec fitlife-db-1 psql -U fitlife -d fitlife -c "SELECT NOW();"

# Verificar variáveis de ambiente
cat .env
```

---

### **Problema: "Timeout: No response within 2000ms"**

**Causa:** Serviço muito lento ou travado

**Solução:**
```javascript
// Aumentar timeout nos testes (temporário)
const TIMEOUT_THRESHOLD = 5000; // 5 segundos

// Otimizar queries no banco
CREATE INDEX IF NOT EXISTS idx_mealrecord_patient_id ON MealRecord(patient_id);
CREATE INDEX IF NOT EXISTS idx_workoutrecord_patient_id ON WorkoutRecord(patient_id);
```

---

### **Problema: "Token inválido ou expirado"**

**Causa:** JWT não configurado corretamente

**Solução:**
```bash
# Verificar JWT_SECRET no .env
echo $JWT_SECRET

# Relogar para obter novo token
npm test -- tests/validation/availability.test.js
```

---

### **Problema: "Rotas não encontradas (404)"**

**Causa:** Rotas não implementadas ou mal configuradas

**Solução:**
```javascript
// Verificar src/routes/index.js
import authRoutes from './authRoutes.js';
import mealRoutes from './mealRoutes.js';
import workoutRoutes from './workoutRoutes.js';

app.use('/auth', authRoutes);
app.use('/meal', mealRoutes);
app.use('/workout', workoutRoutes);
```

---

### **Problema: "Disponibilidade abaixo de 90% mas testes passam individualmente"**

**Causa:** Problemas intermitentes ou de concorrência

**Solução:**
1. **Executar testes múltiplas vezes:**
```bash
for i in {1..10}; do npm test -- tests/validation/availability.test.js; done
```

2. **Monitorar recursos do sistema:**
```powershell
# CPU e memória
docker stats fitlife-backend-1 fitlife-db-1
```

3. **Adicionar connection pooling:**
```javascript
// src/config/db.js
export const pool = new Pool({
    max: 20,              // Máximo de conexões
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

---

## 📈 Métricas Detalhadas no Relatório

### **Estatísticas Gerais**
| Métrica | Descrição | Exemplo |
|---------|-----------|---------|
| **Total de operações** | Número total de testes executados | 25 |
| **Operações bem-sucedidas** | Testes que passaram | 24 |
| **Operações falhadas** | Testes que falharam | 1 |
| **Tempo total** | Soma do tempo de todas as operações | 12.5s |
| **Tempo de indisponibilidade** | Soma do tempo das falhas | 0.8s |

### **Disponibilidade por Funcionalidade**
| Funcionalidade | Testes | Sucesso | Falha | Disponibilidade | Downtime |
|----------------|--------|---------|-------|-----------------|----------|
| 🔐 **Login** | 9 | 9 | 0 | 100% | 0s |
| 🍽️ **Dietas** | 9 | 8 | 1 | 88.9% | 0.5s |
| 💪 **Treinos** | 9 | 9 | 0 | 100% | 0s |

### **Métricas de Performance**
- **Tempo médio de resposta:** 500ms
- **Respostas < 2s:** 24/25 (96%)
- **Conformidade de tempo:** 96%

### **Projeção Mensal**
```
Tempo de indisponibilidade: 0.8s
Tempo total: 12.5s
Taxa de downtime: 6.4%

Projeção mensal:
- Downtime: 6.4% × 720h = 46.08h/mês
- Limite: 72h/mês
- Status: ✓ Dentro do limite
```

---

## 🔔 Sistema de Alertas (Implementação Sugerida)

### **1. Criação de Função de Alerta**
```sql
CREATE OR REPLACE FUNCTION notify_downtime()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'down' THEN
        -- Enviar notificação para administradores
        INSERT INTO admin_notifications (type, message, severity, created_at)
        VALUES (
            'availability_alert',
            'Funcionalidade ' || NEW.functionality || ' está indisponível',
            'critical',
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_downtime
AFTER INSERT ON availability_log
FOR EACH ROW
EXECUTE FUNCTION notify_downtime();
```

### **2. Integração com Sistema de Notificações**
```javascript
// src/services/AlertService.js
export const AlertService = {
    async sendAvailabilityAlert(functionality, details) {
        // Enviar email
        await emailService.send({
            to: 'admin@fitlife.com',
            subject: `🚨 ALERTA: ${functionality} indisponível`,
            body: details
        });

        // Enviar SMS (opcional)
        await smsService.send({
            to: '+5511999999999',
            message: `ALERTA: ${functionality} fora do ar`
        });

        // Log no Slack/Discord (opcional)
        await slackService.send({
            channel: '#alerts',
            message: `🚨 ${functionality} indisponível: ${details}`
        });
    }
};
```

---

## 🔗 Integração com CI/CD

### **GitHub Actions**
```yaml
name: Availability Tests (RNF1.0)

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 */6 * * *'  # A cada 6 horas

jobs:
  availability-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: fitlife
          POSTGRES_PASSWORD: fitlife
          POSTGRES_DB: fitlife
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Run Database Migrations
        run: |
          cd backend
          npm run migrate
        env:
          DB_HOST: localhost
          DB_PORT: 5433
          DB_USER: fitlife
          DB_PASSWORD: fitlife
          DB_NAME: fitlife
      
      - name: Start Backend Server
        run: |
          cd backend
          npm start &
          sleep 10
        env:
          PORT: 5001
          DB_HOST: localhost
          DB_PORT: 5433
      
      - name: Run Availability Tests
        run: |
          cd backend
          npm test -- tests/validation/availability.test.js
        env:
          DB_HOST: localhost
          DB_PORT: 5433
      
      - name: Check Availability Threshold
        run: |
          cd backend
          node -e "
            const stats = require('./test-results/availability.json');
            if (stats.availability < 0.90) {
              console.error('❌ Disponibilidade abaixo de 90%');
              process.exit(1);
            }
            console.log('✅ Disponibilidade OK');
          "
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: availability-test-results
          path: backend/test-results/
      
      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '🚨 Testes de disponibilidade falharam!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📚 Referências

- [ITIL - Service Availability Management](https://www.axelos.com/best-practice-solutions/itil)
- [SLA Best Practices](https://www.atlassian.com/incident-management/kpis/sla-vs-slo-vs-sli)
- [AWS Well-Architected Framework - Reliability](https://aws.amazon.com/architecture/well-architected/)
- [Google SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)

---

## 🤝 Suporte

Em caso de dúvidas ou problemas:
1. Consulte a seção [Troubleshooting](#-troubleshooting)
2. Verifique os logs em `backend/logs/availability.log`
3. Revise a tabela `availability_log` no banco de dados
4. Execute testes individuais para isolar o problema

---

**Data de Criação:** 27/11/2025  
**Última Atualização:** 27/11/2025  
**Versão:** 1.0.0  
**Requisito:** RNF1.0 - Disponibilidade de 90% para Funcionalidades Críticas
