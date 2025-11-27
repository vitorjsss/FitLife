# 🚀 Guia Rápido - Testes de Registro de Login

## ⚡ Execução Rápida

### **Windows (PowerShell)**
```powershell
cd C:\GP\FitLife\backend
.\test-login-audit.ps1
```

### **Linux/Mac**
```bash
cd /c/GP/FitLife/backend
chmod +x test-login-audit.sh
./test-login-audit.sh
```

### **NPM Direto**
```bash
npm test -- tests/validation/login-audit.test.js
```

---

## 📊 Métrica Avaliada

```
x = Ntentativas_registradas / Ntentativas_totais
```

**Meta:** x ≥ 1.0 (100%)

---

## ✅ O que é Testado

| Categoria | Testes | Validação |
|-----------|--------|-----------|
| ✅ **Login Sucesso** | 2 | Registro de logins válidos |
| ❌ **Login Falha** | 3 | Registro de tentativas inválidas |
| 🔒 **Bloqueio** | 1 | Registro de bloqueios de conta |
| 📝 **Metadados** | 2 | IP e User-Agent registrados |
| 💾 **Persistência** | 3 | Durabilidade dos logs |

**Total:** 11 testes

---

## 🎯 Resultado Esperado

```
✅ Testes concluídos com sucesso!
✓ Todos os testes passaram!
✓ Sistema confiável para auditoria de acessos

📊 Resultado (x): 100.00%
✓ APROVADO - Taxa de Cobertura de Registro: ATENDE (100%)
```

---

## ⚠️ Problemas Comuns

### **1. Banco de dados não conecta**
```powershell
# Iniciar Docker
docker-compose up -d db

# Verificar se está rodando
docker ps
```

### **2. Tabela audit_log não existe**
```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Dependências faltando**
```bash
npm install --save-dev supertest cross-env
```

---

## 📋 Pré-requisitos

- ✅ Node.js v18+
- ✅ PostgreSQL rodando (porta 5433)
- ✅ Tabela `audit_log` criada
- ✅ Middleware de auditoria configurado

---

## ⏱️ Tempo de Execução

**Estimativa:** ~15-20 segundos

- Setup: ~2s
- Execução dos testes: ~10-15s
- Relatório final: ~1s
- Cleanup: ~2s

---

## 📖 Documentação Completa

Para detalhes completos, consulte:
- 📄 `backend/docs/TESTES-LOGIN-AUDIT.md`
- 📄 `backend/tests/validation/login-audit.test.js`

---

**Criado em:** 27/11/2025  
**Versão:** 1.0.0
