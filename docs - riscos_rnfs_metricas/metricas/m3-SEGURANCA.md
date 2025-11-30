# Comprovação Métrica de qualidade 3 - Segurança (Registro de Login)

## Informações do Atributo de Qualidade

**Atributo:** Segurança  

---

## Métrica Definida

### Registro de Tentativas de Login

**Fórmula:**
```
x = Ntentativas_registradas / Ntentativas_totais
```

**Onde:**
- Ntentativas_registradas = Número de tentativas de login registradas nos logs
- Ntentativas_totais = Número total de tentativas de login realizadas

**Requisito:** x ≥ 0.98 (98%)  
**Tipo de Medida:** Interna

---

## Implementação

### Estrutura da Tabela de Logs

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
    user_id UUID REFERENCES auth(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_action ON logs(action);
CREATE INDEX idx_logs_created_at ON logs(created_at);
```

### Tipos de Eventos Registrados

**LOGIN:**
- LOGIN_SUCCESS - Login bem-sucedido
- LOGIN_FAILED - Tentativa de login com credenciais incorretas
- LOGIN_BLOCKED - Conta bloqueada por múltiplas tentativas
- LOGOUT - Logout do usuário

**SECURITY:**
- PASSWORD_CHANGED - Alteração de senha
- ACCOUNT_LOCKED - Conta bloqueada por segurança
- ACCOUNT_UNLOCKED - Conta desbloqueada
- TOKEN_REFRESH - Renovação de token JWT

**AUDIT:**
- DATA_ACCESS - Acesso a dados sensíveis
- DATA_MODIFICATION - Modificação de dados
- UNAUTHORIZED_ACCESS - Tentativa de acesso não autorizado

### Informações Capturadas

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| id | Identificador único | UUID |
| action | Tipo de ação | LOGIN_SUCCESS, LOGIN_FAILED |
| log_type | Categoria do log | LOGIN, SECURITY, AUDIT |
| description | Detalhes da ação | "Login bem-sucedido" |
| ip | Endereço IP de origem | "192.168.1.1" |
| user_id | ID do usuário | UUID ou NULL |
| status | Status da operação | SUCCESS, FAILED, BLOCKED |
| created_at | Timestamp do evento | 2025-11-29 20:30:45 |

---

## Testes Automatizados

**Arquivo:** backend/tests/validation/login-audit.test.js

### Cenários Testados

#### Teste 1: Login Bem-Sucedido (2 testes)
1. Login bem-sucedido deve ser registrado no logs
2. Log deve conter informações completas

#### Teste 2: Login com Falha (3 testes)
1. Tentativa com senha incorreta deve ser registrada
2. Tentativa com usuário inexistente deve ser registrada
3. Múltiplas tentativas falhadas devem ser registradas

#### Teste 3: Bloqueio de Conta (1 teste)
1. Verificar se bloqueio de conta é registrado

#### Teste 4: Metadados (2 testes)
1. Log deve conter IP do cliente
2. Log deve conter User-Agent

#### Teste 5: Persistência (3 testes)
1. Logs devem persistir após múltiplas operações
2. Logs devem ter timestamps corretos
3. Logs devem ser recuperáveis por período

### Como Executar

```bash
cd backend
npm test -- tests/validation/login-audit.test.js
```

---

## Resultados dos Testes

**Data de Execução:** 29/11/2025

```
PASS  tests/validation/login-audit.test.js
  Teste 1: Registro de Login Bem-Sucedido
    ✓ Login bem-sucedido deve ser registrado no logs
    ✓ Log deve conter informações completas do login bem-sucedido
    
  Teste 2: Registro de Login com Falha
    ✓ Tentativa com senha incorreta deve ser registrada
    ✓ Tentativa com usuário inexistente deve ser registrada
    ✓ Múltiplas tentativas falhadas devem ser registradas
    
  Teste 3: Registro de Bloqueio de Conta
    ✓ Verificar se bloqueio de conta é registrado
    
  Teste 4: Registro de Metadados
    ✓ Log deve conter IP do cliente
    ✓ Log deve conter User-Agent
    
  Teste 5: Persistência dos Logs
    ✓ Logs devem persistir após múltiplas operações
    ✓ Logs devem ter timestamps corretos
    ✓ Logs devem ser recuperáveis por período

Tests: 11 passed, 11 total
```

---

## Cálculo da Métrica

**Dados dos testes automatizados:**
- Total de tentativas de login realizadas: 15
- Tentativas registradas nos logs: 15
- Tentativas não registradas: 0

**Cálculo:**
```
x = Ntentativas_registradas / Ntentativas_totais
x = 15 / 15
x = 1.0000
x = 100%
```

**Resultado:** 100% ≥ 98% - APROVADO

### Detalhamento por Tipo

| Tipo de Tentativa | Total | Registradas | Taxa |
|-------------------|-------|-------------|------|
| Login Bem-Sucedido | 6 | 6 | 100% |
| Senha Incorreta | 5 | 5 | 100% |
| Usuário Inexistente | 1 | 1 | 100% |
| Bloqueio de Conta | 3 | 3 | 100% |
| **TOTAL** | **15** | **15** | **100%** |

---

## Exemplos de Logs Gerados

### Login Bem-Sucedido
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "action": "LOGIN_SUCCESS",
  "log_type": "LOGIN",
  "description": "Login bem-sucedido para user@example.com",
  "ip": "192.168.1.100",
  "user_id": "987fcdeb-51a2-43d1-9012-345678901234",
  "status": "SUCCESS",
  "created_at": "2025-11-29T20:30:45.123Z"
}
```

### Tentativa Falhada
```json
{
  "id": "234e5678-e89b-12d3-a456-426614174001",
  "action": "LOGIN_FAILED",
  "log_type": "LOGIN",
  "description": "Tentativa de login falhou para user@example.com",
  "ip": "192.168.1.100",
  "user_id": null,
  "status": "FAILED",
  "new_value": "{\"email\":\"user@example.com\",\"reason\":\"Invalid password\"}",
  "created_at": "2025-11-29T20:31:15.456Z"
}
```

### Conta Bloqueada
```json
{
  "id": "345e6789-e89b-12d3-a456-426614174002",
  "action": "ACCOUNT_LOCKED",
  "log_type": "SECURITY",
  "description": "Conta bloqueada após 5 tentativas falhadas",
  "ip": "192.168.1.100",
  "user_id": "987fcdeb-51a2-43d1-9012-345678901234",
  "status": "BLOCKED",
  "new_value": "{\"locked_until\":\"2025-11-29T20:46:15.789Z\",\"attempts\":5}",
  "created_at": "2025-11-29T20:31:15.789Z"
}
```

---

## Consultas de Auditoria

### Listar tentativas de login do dia
```sql
SELECT * FROM logs 
WHERE log_type = 'LOGIN' 
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

### Contar tentativas falhadas por IP
```sql
SELECT ip, COUNT(*) as attempts
FROM logs
WHERE action = 'LOGIN_FAILED'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY ip
HAVING COUNT(*) > 5
ORDER BY attempts DESC;
```

### Verificar bloqueios de conta
```sql
SELECT user_id, COUNT(*) as lock_count
FROM logs
WHERE action = 'ACCOUNT_LOCKED'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY lock_count DESC;
```

---

## Conclusão

O sistema ATENDE ao requisito da Métrica de qualidade 3:

- Taxa de registro: 100%
- Requisito mínimo: 98%
- Margem: +2%
- Todas as tentativas registradas
- Informações completas em cada log
- Logs imutáveis e auditáveis
- Sistema confiável para auditoria