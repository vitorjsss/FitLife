# 🎯 Exemplos Práticos de Uso - Sistema de Códigos de Conexão

## Cenário 1: Conexão Bem-Sucedida (Nutricionista)

### Passo 1: Paciente gera código

**Request:**
```http
POST http://localhost:3000/patient-connection-code/generate/a1b2c3d4-5678-90ab-cdef-1234567890ab
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (201):**
```json
{
  "id": "code-uuid-123",
  "patient_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "code": "528491",
  "created_at": "2025-11-09T10:30:00.000Z",
  "expires_at": "2025-11-09T10:35:00.000Z",
  "used": false
}
```

### Passo 2: Paciente compartilha código com nutricionista

**Método:** Mensagem, WhatsApp, presencialmente, etc.

**Código compartilhado:** `528491`

### Passo 3: Nutricionista usa o código

**Request:**
```http
POST http://localhost:3000/patient-connection-code/connect
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (token nutricionista)
Content-Type: application/json

{
  "code": "528491"
}
```

**Response (200):**
```json
{
  "success": true,
  "association": {
    "id": "assoc-uuid-456",
    "patient_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "nutricionist_id": "nutri-uuid-789",
    "physical_educator_id": null,
    "is_active": true,
    "created_at": "2025-11-09T10:32:00.000Z"
  },
  "patient_name": "João Silva"
}
```

### Passo 4: Nutricionista acessa dados de dieta (após implementar middleware)

**Request:**
```http
GET http://localhost:3000/meal-calendar/monthly/a1b2c3d4-5678-90ab-cdef-1234567890ab/2025/11
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (token nutricionista)
```

**Response (200):**
```json
{
  "patient_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "year": 2025,
  "month": 11,
  "days": [
    {
      "date": "2025-11-01",
      "total_meals": 3,
      "completed_meals": 2,
      "completion_percentage": 66.67
    },
    // ... mais dias
  ]
}
```

---

## Cenário 2: Tentativa de Acesso Não Autorizado (APÓS implementar middleware)

### Nutricionista tenta acessar dados de treino

**Request:**
```http
GET http://localhost:3000/workout-calendar/monthly/a1b2c3d4-5678-90ab-cdef-1234567890ab/2025/11
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (token nutricionista)
```

**Response (403):**
```json
{
  "message": "Apenas educadores físicos podem acessar dados de treino"
}
```

**Log criado:**
```sql
INSERT INTO logs (action, log_type, description, status, user_id)
VALUES (
  'UNAUTHORIZED_ACCESS_ATTEMPT',
  'SECURITY',
  'Nutricionist nutri-uuid-789 tentou acessar dados de treino do paciente a1b2c3d4...',
  'FAILURE',
  'auth-uuid-nutri'
);
```

---

## Cenário 3: Código Expirado

### Paciente gera código às 10:30

**Request:**
```http
POST http://localhost:3000/patient-connection-code/generate/a1b2c3d4-5678-90ab-cdef-1234567890ab
Authorization: Bearer {token_paciente}
```

**Response:**
```json
{
  "code": "724816",
  "expires_at": "2025-11-09T10:35:00.000Z"
}
```

### Nutricionista tenta usar código às 10:36 (6 minutos depois)

**Request:**
```http
POST http://localhost:3000/patient-connection-code/connect
Authorization: Bearer {token_nutricionista}

{
  "code": "724816"
}
```

**Response (404):**
```json
{
  "message": "Código inválido ou expirado"
}
```

---

## Cenário 4: Código Já Utilizado

### Primeiro nutricionista usa o código

**Request:**
```http
POST http://localhost:3000/patient-connection-code/connect
Authorization: Bearer {token_nutricionista_1}

{
  "code": "528491"
}
```

**Response (200):**
```json
{
  "success": true,
  "patient_name": "João Silva"
}
```

### Segundo nutricionista tenta usar o mesmo código

**Request:**
```http
POST http://localhost:3000/patient-connection-code/connect
Authorization: Bearer {token_nutricionista_2}

{
  "code": "528491"
}
```

**Response (404):**
```json
{
  "message": "Código inválido ou expirado"
}
```

---

## Cenário 5: Paciente com Nutricionista e Educador

### Passo 1: Nutricionista conecta primeiro

```http
POST http://localhost:3000/patient-connection-code/connect
{
  "code": "111111"
}
```

**Associação criada:**
```json
{
  "patient_id": "patient-id",
  "nutricionist_id": "nutri-id",
  "physical_educator_id": null
}
```

### Passo 2: Paciente gera novo código para educador

```http
POST http://localhost:3000/patient-connection-code/generate/patient-id
```

**Response:**
```json
{
  "code": "222222",
  "expires_at": "..."
}
```

### Passo 3: Educador conecta

```http
POST http://localhost:3000/patient-connection-code/connect
{
  "code": "222222"
}
```

**Associação atualizada:**
```json
{
  "patient_id": "patient-id",
  "nutricionist_id": "nutri-id",
  "physical_educator_id": "educator-id"
}
```

### Passo 4: Cada profissional acessa seus dados (após middleware)

**Nutricionista acessa dieta (✅ permitido):**
```http
GET http://localhost:3000/meal-calendar/monthly/patient-id/2025/11
Authorization: Bearer {token_nutricionista}
→ Response: 200 OK
```

**Nutricionista tenta acessar treino (❌ bloqueado):**
```http
GET http://localhost:3000/workout-calendar/monthly/patient-id/2025/11
Authorization: Bearer {token_nutricionista}
→ Response: 403 Forbidden
```

**Educador acessa treino (✅ permitido):**
```http
GET http://localhost:3000/workout-calendar/monthly/patient-id/2025/11
Authorization: Bearer {token_educador}
→ Response: 200 OK
```

**Educador tenta acessar dieta (❌ bloqueado):**
```http
GET http://localhost:3000/meal-calendar/monthly/patient-id/2025/11
Authorization: Bearer {token_educador}
→ Response: 403 Forbidden
```

---

## Cenário 6: Tentativa de Duplicação de Profissional

### Nutricionista 1 já está conectado

**Associação existente:**
```json
{
  "patient_id": "patient-id",
  "nutricionist_id": "nutri-1-id",
  "physical_educator_id": null
}
```

### Nutricionista 2 tenta conectar

**Request:**
```http
POST http://localhost:3000/patient-connection-code/connect
Authorization: Bearer {token_nutricionista_2}

{
  "code": "333333"
}
```

**Response (409):**
```json
{
  "message": "Paciente já possui um nutricionista associado"
}
```

---

## Cenário 7: Limpeza Automática de Códigos

### Scheduler executando a cada 10 minutos

**Situação do banco:**
```sql
SELECT code, expires_at FROM patient_connection_code;

-- Resultado:
-- code   | expires_at
-- 111111 | 2025-11-09 10:20:00  (expirado)
-- 222222 | 2025-11-09 10:25:00  (expirado)
-- 333333 | 2025-11-09 10:40:00  (ativo)
```

**Scheduler executa às 10:30:**

```javascript
// CodeCleanupScheduler executa
const deleted = await PatientConnectionCodeService.cleanupExpiredCodes();
// deleted = [{ code: '111111', ... }, { code: '222222', ... }]
```

**Log criado:**
```json
{
  "action": "AUTO_CLEANUP_EXPIRED_CODES",
  "log_type": "DELETE",
  "description": "Limpeza automática removeu 2 código(s) expirado(s)",
  "new_value": {
    "count": 2,
    "codes": [
      { "code": "111111", "patient_id": "...", "expired_at": "..." },
      { "code": "222222", "patient_id": "...", "expired_at": "..." }
    ]
  },
  "status": "SUCCESS"
}
```

**Situação do banco após limpeza:**
```sql
SELECT code, expires_at FROM patient_connection_code;

-- Resultado:
-- code   | expires_at
-- 333333 | 2025-11-09 10:40:00  (ativo)
```

---

## Cenário 8: Consulta de Código Ativo

### Paciente verifica se tem código ativo

**Request:**
```http
GET http://localhost:3000/patient-connection-code/active/patient-id
Authorization: Bearer {token_paciente}
```

**Response (com código ativo):**
```json
{
  "id": "code-uuid",
  "patient_id": "patient-id",
  "code": "528491",
  "created_at": "2025-11-09T10:30:00.000Z",
  "expires_at": "2025-11-09T10:35:00.000Z",
  "used": false
}
```

**Response (sem código ativo):**
```json
{}
```

---

## Cenário 9: Deletar Código Manualmente

### Paciente desiste de compartilhar código

**Request:**
```http
DELETE http://localhost:3000/patient-connection-code/patient-id
Authorization: Bearer {token_paciente}
```

**Response (200):**
```json
{
  "message": "Código deletado com sucesso"
}
```

---

## Cenário 10: Auditoria de Logs

### Consultar todos os logs de um paciente

```sql
SELECT 
  action,
  log_type,
  description,
  status,
  created_at
FROM logs
WHERE new_value::jsonb->>'patient_id' = 'patient-id'
  OR old_value::jsonb->>'patient_id' = 'patient-id'
ORDER BY created_at DESC;
```

**Resultado:**
```
action                      | log_type  | description                              | status  | created_at
----------------------------|-----------|------------------------------------------|---------|-------------------
CONNECT_WITH_CODE           | CREATE    | Nutricionist ... conectado ao paciente   | SUCCESS | 2025-11-09 10:32
GENERATE_CONNECTION_CODE    | CREATE    | Código de conexão gerado para paciente   | SUCCESS | 2025-11-09 10:30
UNAUTHORIZED_ACCESS_ATTEMPT | SECURITY  | Nutricionist tentou acessar dados treino | FAILURE | 2025-11-09 10:40
```

---

## 🔍 Queries Úteis para Debug

### Ver todos os códigos ativos
```sql
SELECT 
  pcc.code,
  p.name as patient_name,
  pcc.expires_at,
  pcc.used,
  EXTRACT(EPOCH FROM (pcc.expires_at - NOW())) / 60 as minutes_until_expiry
FROM patient_connection_code pcc
JOIN patient p ON pcc.patient_id = p.id
WHERE pcc.expires_at > NOW() AND pcc.used = false;
```

### Ver associações ativas
```sql
SELECT 
  p.name as patient,
  n.name as nutricionist,
  pe.name as physical_educator,
  ppa.created_at
FROM patient_professional_association ppa
JOIN patient p ON ppa.patient_id = p.id
LEFT JOIN nutricionist n ON ppa.nutricionist_id = n.id
LEFT JOIN physical_educator pe ON ppa.physical_educator_id = pe.id
WHERE ppa.is_active = true;
```

### Últimas tentativas de conexão
```sql
SELECT 
  action,
  description,
  status,
  created_at
FROM logs
WHERE action IN ('CONNECT_WITH_CODE', 'GENERATE_CONNECTION_CODE')
ORDER BY created_at DESC
LIMIT 20;
```

---

## 📝 Notas Importantes

1. **Códigos são case-sensitive** - "528491" ≠ "528 491" ≠ "528-491"
2. **Timezone** - Certifique-se que servidor e banco estão no mesmo timezone
3. **Limpeza** - Códigos expirados são deletados automaticamente pelo scheduler
4. **Logs** - Todas as ações são registradas, inclusive tentativas de acesso não autorizado
5. **Segurança** - Após implementar middleware, acesso é restrito por tipo de profissional
