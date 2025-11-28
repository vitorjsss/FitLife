# 📊 Testes de Qualidade - Registro de Tentativas de Login

## 🎯 Objetivo

Validar a **cobertura de registro de tentativas de login** no sistema FitLife, garantindo que todas as tentativas de acesso sejam auditadas para fins de segurança e conformidade.

## 📐 Métrica de Qualidade

### Fórmula
```
x = Ntentativas_registradas / Ntentativas_totais
```

Onde:
- **Ntentativas_registradas**: Número de tentativas de login registradas no `audit_log`
- **Ntentativas_totais**: Número total de tentativas de login realizadas durante os testes

### Requisito
**x ≥ 1.0 (100%)**

Todas as tentativas de login devem ser registradas para garantir rastreabilidade completa de acessos.

---

## 🧪 Estrutura dos Testes

### **Teste 1: Registro de Login Bem-Sucedido** ✅
Valida se logins bem-sucedidos são registrados no audit_log.

**Cenários:**
- 1.1 - Login bem-sucedido deve ser registrado
- 1.2 - Log deve conter informações completas (user_id, action, timestamp)

**Validações:**
- Incremento no contador de logs após login
- Presença de campos obrigatórios (`action`, `user_id`, `created_at`)

---

### **Teste 2: Registro de Login com Falha** ❌
Valida se tentativas falhadas de login são registradas.

**Cenários:**
- 2.1 - Tentativa com senha incorreta
- 2.2 - Tentativa com usuário inexistente
- 2.3 - Múltiplas tentativas falhadas consecutivas

**Validações:**
- Registro de cada tentativa falhada
- Detalhamento do motivo da falha
- Incremento correto do contador `failed_attempts`

---

### **Teste 3: Registro de Bloqueio de Conta** 🔒
Valida se bloqueios de conta por tentativas excessivas são registrados.

**Cenários:**
- 3.1 - Conta bloqueada após 3 tentativas falhadas

**Validações:**
- Registro do evento de bloqueio
- Timestamp do bloqueio (`account_locked_until`)
- Log contém informações sobre o motivo do bloqueio

---

### **Teste 4: Registro de Metadados** 📝
Valida se informações adicionais são registradas para auditoria.

**Cenários:**
- 4.1 - IP do cliente é registrado
- 4.2 - User-Agent é registrado

**Validações:**
- Presença de `ip_address` ou IP nos `details`
- Presença de `user_agent` ou info do navegador nos `details`

---

### **Teste 5: Persistência dos Logs** 💾
Valida a integridade e durabilidade dos registros.

**Cenários:**
- 5.1 - Logs persistem após múltiplas operações
- 5.2 - Timestamps são corretos e consistentes
- 5.3 - Logs são recuperáveis por período (filtros de data)

**Validações:**
- Logs não são perdidos em operações concorrentes
- Timestamps refletem o momento exato da tentativa
- Queries de busca por período funcionam corretamente

---

## 🚀 Como Executar os Testes

### **Pré-requisitos**
1. ✅ Node.js v18+ instalado
2. ✅ PostgreSQL rodando (porta 5433)
3. ✅ Dependências do backend instaladas (`npm install`)
4. ✅ Banco de dados configurado com tabela `audit_log`

### **Opção 1: Script PowerShell (Windows)**
```powershell
cd C:\GP\FitLife\backend
.\test-login-audit.ps1
```

### **Opção 2: Script Bash (Linux/Mac)**
```bash
cd /c/GP/FitLife/backend
chmod +x test-login-audit.sh
./test-login-audit.sh
```

### **Opção 3: NPM Direto**
```bash
npm test -- tests/validation/login-audit.test.js
```

### **Opção 4: Com Verbose**
```bash
npm test -- tests/validation/login-audit.test.js --verbose
```

---

## 📋 Estrutura da Tabela `audit_log`

Os testes esperam a seguinte estrutura mínima:

```sql
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

---

## 📊 Interpretação dos Resultados

### ✅ **Resultado APROVADO (x = 100%)**
```
✓ Sistema ATENDE ao requisito de registro de login
✓ Todos os logs de tentativas de login estão sendo registrados
✓ Sistema confiável para auditoria e monitoramento de acessos
```

**Significado:**
- Todas as tentativas de login foram registradas no `audit_log`
- Sistema pronto para auditoria e conformidade (LGPD, ISO 27001)
- Rastreabilidade completa de acessos

---

### ⚠️ **Resultado PARCIAL (95% ≤ x < 100%)**
```
⚠️ ATENÇÃO: Cobertura próxima ao ideal!
⚠️ N tentativa(s) não foram registradas
ℹ Recomenda-se investigar as falhas de registro
```

**Ações Recomendadas:**
1. Revisar logs de aplicação para identificar erros
2. Verificar se o middleware de auditoria está ativo
3. Testar manualmente os cenários que falharam
4. Verificar permissões do banco de dados

---

### ❌ **Resultado REPROVADO (x < 95%)**
```
✗ Sistema NÃO ATENDE ao requisito de registro de login
🚨 CRÍTICO: Sistema não é confiável para auditoria!
ℹ Ação imediata necessária para corrigir o registro de logs
```

**Ações Imediatas:**
1. **Verificar implementação do middleware de auditoria**
   - Confirmar que está aplicado nas rotas de login
   - Verificar tratamento de erros no middleware

2. **Verificar conexão com banco de dados**
   - Confirmar que a tabela `audit_log` existe
   - Testar INSERT manual na tabela

3. **Revisar código de autenticação**
   - Verificar se `LogService.create()` é chamado
   - Confirmar que não há try-catch silencioso

4. **Testar cenários específicos**
   - Executar testes individuais para isolar o problema
   - Verificar logs de erro da aplicação

---

## 🔍 Troubleshooting

### **Problema: "Erro ao conectar ao banco de dados"**

**Solução:**
```powershell
# Verificar se PostgreSQL está rodando
docker ps

# Iniciar container se necessário
docker-compose up -d db

# Testar conexão
docker exec fitlife-db-1 psql -U fitlife -d fitlife -c "SELECT NOW();"
```

---

### **Problema: "Tabela audit_log não existe"**

**Solução:**
```sql
-- Executar script de criação da tabela
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **Problema: "Logs não estão sendo criados"**

**Possíveis Causas:**
1. **Middleware não configurado** - Verificar `src/middlewares/auditLogger.js`
2. **Erro silencioso** - Adicionar logs de debug no middleware
3. **Permissões insuficientes** - Verificar role do usuário no PostgreSQL

**Solução:**
```javascript
// Verificar se o middleware está sendo usado
// src/routes/authRoutes.js
import { auditLogger } from '../middlewares/auditLogger.js';

router.post('/login', auditLogger, AuthController.login);
```

---

### **Problema: "Testes falhando aleatoriamente"**

**Causa:** Timing issues com gravação assíncrona de logs

**Solução:** Os testes já incluem delays (`setTimeout`) para aguardar gravação. Se o problema persistir:
```javascript
// Aumentar delay nos testes
await new Promise(resolve => setTimeout(resolve, 1000)); // 1s ao invés de 500ms
```

---

## 📈 Métricas Detalhadas

### **Estatísticas Exibidas no Relatório**

| Métrica | Descrição | Meta |
|---------|-----------|------|
| **Taxa de Cobertura Geral** | Percentual de tentativas registradas | 100% |
| **Login Bem-Sucedido** | Cobertura de logins válidos | 100% |
| **Login com Falha** | Cobertura de logins inválidos | 100% |
| **Bloqueio de Conta** | Registro de bloqueios automáticos | 100% |
| **Metadados** | Presença de IP/User-Agent | ≥ 80% |
| **Persistência** | Durabilidade dos registros | 100% |

---

## 🔗 Integração com CI/CD

### **GitHub Actions**

```yaml
name: Login Audit Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
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
      
      - name: Run Login Audit Tests
        run: |
          cd backend
          npm test -- tests/validation/login-audit.test.js
        env:
          DB_HOST: localhost
          DB_PORT: 5433
          DB_USER: fitlife
          DB_PASSWORD: fitlife
          DB_NAME: fitlife
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: login-audit-test-results
          path: backend/test-results/
```

---

## 📚 Referências

- [OWASP Authentication Cheat Sheet](https://cheats.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [LGPD - Lei Geral de Proteção de Dados](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ISO/IEC 27001 - Controle de Acesso](https://www.iso.org/standard/27001)
- [NIST SP 800-63B - Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

## 🤝 Suporte

Em caso de dúvidas ou problemas:
1. Consulte a seção [Troubleshooting](#-troubleshooting)
2. Verifique os logs da aplicação em `backend/logs/`
3. Revise a implementação do middleware de auditoria
4. Execute testes individuais para isolar o problema

---

**Data de Criação:** 27/11/2025  
**Última Atualização:** 27/11/2025  
**Versão:** 1.0.0
