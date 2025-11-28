# 🚀 Guia Rápido - Testes de Disponibilidade (RNF1.0)

## ⚡ Execução Rápida

### **Windows (PowerShell)**
```powershell
cd C:\GP\FitLife\backend
.\test-availability.ps1
```

### **Linux/Mac**
```bash
cd /c/GP/FitLife/backend
chmod +x test-availability.sh
./test-availability.sh
```

### **NPM Direto**
```bash
npm test -- tests/validation/availability.test.js
```

---

## 📊 Métrica Avaliada

```
X = (Ttotal - Tindisponibilidade) / Ttotal
```

**Meta:** X ≥ 0.90 (90%)  
**Limite mensal:** Máximo 72 horas de indisponibilidade

---

## 🔐 Funcionalidades Críticas Testadas

| Funcionalidade | Endpoint | Testes | Validação |
|----------------|----------|--------|-----------|
| 🔐 **Login** | `POST /auth/login` | 3 | Autenticação funcional |
| 🍽️ **Dietas** | `GET /meal/patient/:id` | 3 | Listagem de refeições |
| 💪 **Treinos** | `GET /workout/patient/:id` | 3 | Listagem de exercícios |
| ⚡ **Carga** | Múltiplos endpoints | 1 | Teste de concorrência |
| 📋 **Logs** | Tabela availability_log | 2 | Sistema de monitoramento |

**Total:** 12 testes

---

## 🎯 Resultado Esperado

```
✅ Testes concluídos com sucesso!
✓ Disponibilidade ≥ 90% - RNF1.0 ATENDIDO

📊 Resultado (X): 98.50%
🔐 Login: 100% disponível (0ms downtime)
🍽️ Dietas: 97% disponível (180ms downtime)
💪 Treinos: 100% disponível (0ms downtime)
⏱️ Tempo médio de resposta: 450ms

✓ APROVADO - Taxa de Disponibilidade: ATENDE (≥ 90%)
✓ Projeção mensal: 10.8h downtime (< 72h permitido)
```

---

## ⚠️ Problemas Comuns

### **1. Banco de dados não conecta**
```powershell
# Iniciar Docker
docker-compose up -d db

# Verificar status
docker ps | findstr fitlife
```

### **2. Rotas 404 (não encontradas)**
```javascript
// Verificar src/routes/index.js
app.use('/auth', authRoutes);
app.use('/meal', mealRoutes);
app.use('/workout', workoutRoutes);
```

### **3. Timeout (> 2s)**
```sql
-- Adicionar índices no banco
CREATE INDEX idx_mealrecord_patient_id ON MealRecord(patient_id);
CREATE INDEX idx_workoutrecord_patient_id ON WorkoutRecord(patient_id);
```

### **4. Token inválido**
```bash
# Verificar JWT_SECRET no .env
cat .env | grep JWT_SECRET
```

### **5. Tabela availability_log não existe**
Os testes criam automaticamente. Se falhar:
```sql
CREATE TABLE availability_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    functionality VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    duration_ms INTEGER,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📋 Pré-requisitos

- ✅ Node.js v18+
- ✅ PostgreSQL rodando (porta 5433)
- ✅ Backend rodando (porta 5001)
- ✅ Rotas implementadas (`/auth/login`, `/meal/patient/:id`, `/workout/patient/:id`)
- ✅ Dados de teste (criados automaticamente)

---

## 📊 Interpretação Rápida

### **✅ X ≥ 90% (APROVADO)**
Sistema está estável e pronto para produção.

### **⚠️ 85% ≤ X < 90% (ATENÇÃO)**
Sistema próximo ao limite. Investigar e otimizar.

### **❌ X < 85% (CRÍTICO)**
Sistema instável. Ação imediata necessária:
1. Verificar logs de erro
2. Reiniciar serviços
3. Analisar performance do banco
4. Verificar recursos (CPU/Memória)

---

## ⏱️ Tempo de Execução

**Estimativa:** ~20-30 segundos

- Setup: ~2s
- Teste Login (9 operações): ~5s
- Teste Dietas (9 operações): ~5s
- Teste Treinos (9 operações): ~5s
- Teste Carga (3 operações): ~2s
- Teste Logs (2 operações): ~1s
- Relatório: ~1s
- Cleanup: ~2s

---

## 🔔 Sistema de Alertas

### **Implementação Básica**
```javascript
// Criar trigger no banco
CREATE OR REPLACE FUNCTION notify_downtime()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'down' THEN
        -- Log de alerta
        RAISE NOTICE 'ALERTA: % indisponível', NEW.functionality;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_downtime
AFTER INSERT ON availability_log
FOR EACH ROW EXECUTE FUNCTION notify_downtime();
```

---

## 📈 Monitoramento Contínuo

### **Consultas Úteis**
```sql
-- Disponibilidade nas últimas 24h
SELECT 
    functionality,
    COUNT(*) as total_requests,
    SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as failures,
    ROUND(100.0 * (COUNT(*) - SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END)) / COUNT(*), 2) as availability_pct
FROM availability_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY functionality;

-- Downtime total (últimas 24h)
SELECT 
    SUM(duration_ms) / 1000.0 as total_downtime_seconds
FROM availability_log
WHERE status = 'down'
AND created_at >= NOW() - INTERVAL '24 hours';

-- Top 5 períodos de maior downtime
SELECT 
    functionality,
    duration_ms / 1000.0 as downtime_seconds,
    details,
    created_at
FROM availability_log
WHERE status = 'down'
ORDER BY duration_ms DESC
LIMIT 5;
```

---

## 🔗 Próximos Passos

Após testes bem-sucedidos:

1. **Integrar com CI/CD** - Executar testes automaticamente
2. **Configurar alertas** - Notificar admins em falhas
3. **Dashboard de monitoramento** - Grafana/Kibana
4. **SLA/SLO Definition** - Documentar acordos de nível de serviço
5. **Plano de recuperação** - Estratégias de failover

---

## 📖 Documentação Completa

Para detalhes completos, consulte:
- 📄 `backend/docs/TESTES-DISPONIBILIDADE.md`
- 📄 `backend/tests/validation/availability.test.js`
- 📄 `backend/METRICAS-QUALIDADE-RESUMO.md`

---

**Criado em:** 27/11/2025  
**Versão:** 1.0.0  
**Requisito:** RNF1.0
