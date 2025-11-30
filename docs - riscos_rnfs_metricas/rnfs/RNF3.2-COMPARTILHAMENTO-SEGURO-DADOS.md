# RNF3.2: Compartilhamento Seguro de Dados entre Paciente e Profissional

## Requisito Não-Funcional

**RNF3.2: Compartilhamento Seguro de Dados com Código Temporário**

Ambiente: O usuário registra seus dados de treino, dieta e medidas corporais no aplicativo FitLife e pode conceder acesso temporário a profissionais de saúde para acompanhamento.

Estímulo: O usuário gera um código único e temporário (válido por 5 minutos) e o compartilha manualmente com o nutricionista ou educador físico. O profissional utiliza o código para visualizar apenas os dados correspondentes ao seu tipo de atuação (dieta ou treino).

Resposta: O sistema valida o código e estabelece a conexão entre paciente e profissional durante o período de validade. Após expirar ou ser utilizado, o código é invalidado automaticamente. Todas as ações (geração, uso e expiração de código) são registradas em logs para auditoria.

Medida de resposta: O requisito será considerado atendido se:
- Códigos expirados não permitirem acesso
- Cada código for utilizado apenas uma vez
- Logs registrarem corretamente geração e uso
- O profissional tiver acesso apenas aos dados permitidos conforme o tipo de conta

## Critérios de Aceitação

1. O código de conexão deve expirar automaticamente após 5 minutos ou após o primeiro uso
2. Cada profissional só pode visualizar dados compatíveis com seu tipo (nutricionista → dieta; educador físico → treino)
3. Todas as ações relacionadas aos códigos devem ser registradas na tabela de logs
4. O acesso deve ser bloqueado caso o código seja inválido, expirado ou já utilizado
5. Paciente pode gerar apenas um código ativo por vez
6. Código deve ser único e ter 6 dígitos
7. Sistema deve impedir associação duplicada (mesmo tipo de profissional)
8. Logs de tentativas de acesso não autorizado devem ser registrados

## Riscos Identificados

### Confiabilidade
Falha na expiração automática pode permitir acesso indevido.

### Segurança
Vazamento de código pode permitir visualização não autorizada.

### Disponibilidade
Geração e validação frequente de códigos podem aumentar a carga em períodos de alto uso.

Story Point Estimado: 8

## Métricas de Qualidade

### 1. Taxa de Expiração Correta de Códigos
```
x = Ncodigos_expirados_corretos / Ncodigos_expirados_total
```

Onde:
- **Ncodigos_expirados_corretos**: Códigos que expiraram após 5 minutos ou uso
- **Ncodigos_expirados_total**: Total de códigos gerados

Requisito: **x ≥ 1.0 (100%)**

### 2. Taxa de Uso Único de Códigos
```
y = Ncodigos_uso_unico / Ncodigos_utilizados
```

Onde:
- **Ncodigos_uso_unico**: Códigos que foram usados apenas uma vez
- **Ncodigos_utilizados**: Total de códigos utilizados

Requisito: **y ≥ 1.0 (100%)**

### 3. Cobertura de Controle de Acesso por Tipo
```
z = Nacessos_corretos / Nacessos_total
```

Onde:
- **Nacessos_corretos**: Acessos onde profissional viu apenas dados do seu tipo
- **Nacessos_total**: Total de acessos de profissionais

Requisito: **z ≥ 1.0 (100%)**

## Arquitetura Implementada

### 1. Sistema de Códigos de Conexão

**Arquivo**: `backend/src/services/PatientConnectionCodeService.js`

#### Funcionalidades Principais

**Geração de Código**:
```javascript
generateCode: async (patientId) => {
    // 1. Remove código anterior se existir (um código ativo por vez)
    await pool.query('DELETE FROM patient_connection_code WHERE patient_id = $1', [patientId]);
    
    // 2. Gera código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 3. Cria código com expiração de 5 minutos
    const query = `
        INSERT INTO patient_connection_code (id, patient_id, code, expires_at)
        VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '5 minutes')
        RETURNING *;
    `;
    
    return resultado;
}
```

**Validação de Código**:
```javascript
findValidByCode: async (code) => {
    const query = `
        SELECT pcc.*, p.name as patient_name
        FROM patient_connection_code pcc
        INNER JOIN patient p ON pcc.patient_id = p.id
        WHERE pcc.code = $1 
          AND pcc.expires_at > NOW() 
          AND pcc.used = false;
    `;
    
    // Retorna null se código inválido, expirado ou já usado
    return resultado;
}
```

**Conexão com Código**:
```javascript
connectWithCode: async (code, professionalId, professionalType) => {
    // 1. Valida código
    const codeData = await findValidByCode(code);
    if (!codeData) {
        throw new Error('Código inválido ou expirado');
    }
    
    // 2. Verifica associação existente
    const existingAssociation = await findByPatientId(codeData.patient_id);
    
    // 3. Impede duplicação de tipo de profissional
    if (existingAssociation) {
        if (professionalType === 'Nutricionist' && existingAssociation.nutricionist_id) {
            throw new Error('Paciente já possui um nutricionista associado');
        }
        if (professionalType === 'Physical_educator' && existingAssociation.physical_educator_id) {
            throw new Error('Paciente já possui um educador físico associado');
        }
    }
    
    // 4. Cria ou atualiza associação
    const association = await createOrUpdateAssociation(codeData.patient_id, professionalId, professionalType);
    
    // 5. Marca código como usado (uso único)
    await markAsUsed(codeData.id);
    
    return { success: true, association, patient_name: codeData.patient_name };
}
```

### 2. Tabelas do Banco de Dados

**Arquivo**: `backend/db-init/init.sql`

#### Tabela: patient_connection_code
```sql
CREATE TABLE patient_connection_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    UNIQUE(patient_id)  -- Um código ativo por paciente
);

CREATE INDEX idx_connection_code ON patient_connection_code(code);
CREATE INDEX idx_connection_patient ON patient_connection_code(patient_id);
```

**Campos Críticos**:
- `code`: VARCHAR(6) UNIQUE - Código de 6 dígitos único
- `expires_at`: TIMESTAMP - Data/hora de expiração (5 minutos)
- `used`: BOOLEAN - Flag de uso único
- `patient_id`: UNIQUE constraint - Apenas um código ativo por paciente

#### Tabela: patient_professional_association
```sql
CREATE TABLE patient_professional_association (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    nutricionist_id UUID REFERENCES nutricionist(id) ON DELETE SET NULL,
    physical_educator_id UUID REFERENCES physical_educator(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(patient_id)  -- Uma associação por paciente
);
```

**Campos Críticos**:
- `patient_id`: UNIQUE constraint - Uma associação por paciente
- `nutricionist_id`: Nullable - Associação com nutricionista
- `physical_educator_id`: Nullable - Associação com educador físico
- `is_active`: Flag para desativar associação sem deletar

### 3. Controle de Acesso por Tipo de Profissional

**Arquivo**: `backend/src/middlewares/patientAccessMiddleware.js`

#### Middleware: checkPatientAccess(dataType)

**Validações Implementadas**:

1. **Paciente acessando próprios dados**:
```javascript
if (userType === 'Patient') {
    const patient = await PatientService.getByAuthId(req.user.id);
    if (patient && patient.id === patientId) {
        return next(); // Permite acesso
    }
    return res.status(403).json({ message: 'Você só pode acessar seus próprios dados' });
}
```

2. **Validação de tipo de usuário**:
```javascript
if (userType !== 'Nutricionist' && userType !== 'Physical_educator') {
    return res.status(403).json({ message: 'Acesso não autorizado' });
}
```

3. **Validação de associação**:
```javascript
const association = await PatientProfessionalAssociationRepository.findByPatientId(patientId);

if (!association || !association.is_active) {
    return res.status(403).json({ message: 'Você não possui acesso a este paciente' });
}

const isAssociated =
    (userType === 'Nutricionist' && association.nutricionist_id === professionalId) ||
    (userType === 'Physical_educator' && association.physical_educator_id === professionalId);

if (!isAssociated) {
    return res.status(403).json({ message: 'Você não está associado a este paciente' });
}
```

4. **Controle de acesso por tipo de dado**:
```javascript
if (dataType === 'meal' && userType !== 'Nutricionist') {
    return res.status(403).json({ 
        message: 'Apenas nutricionistas podem acessar dados de alimentação' 
    });
}

if (dataType === 'workout' && userType !== 'Physical_educator') {
    return res.status(403).json({ 
        message: 'Apenas educadores físicos podem acessar dados de treino' 
    });
}
```

### 4. Rotas Implementadas

**Arquivo**: `backend/src/routes/patientConnectionCodeRoutes.js`

```javascript
// Geração de código (requer autenticação do paciente)
POST /patient-connection-code/generate/:patientId

// Buscar código ativo (requer autenticação)
GET /patient-connection-code/active/:patientId

// Conectar com código (requer autenticação do profissional)
POST /patient-connection-code/connect

// Deletar código (requer autenticação do paciente)
DELETE /patient-connection-code/:patientId

// Limpar códigos expirados (admin/cron)
DELETE /patient-connection-code/cleanup/expired
```

### 5. Sistema de Logs

**Arquivo**: `backend/src/controllers/PatientConnectionCodeController.js`

#### Logs Registrados

**GENERATE_CONNECTION_CODE** (Geração de Código):
- Ação: `GENERATE_CONNECTION_CODE`
- Log Type: `CREATE`
- Campos: patientId, código gerado, IP, timestamp

**CONNECT_WITH_CODE** (Uso de Código):
- Ação: `CONNECT_WITH_CODE`
- Log Type: `CREATE` (sucesso) ou `ERROR` (falha)
- Campos: professionalId, professionalType, patientId, código, IP, timestamp

**DELETE_CONNECTION_CODE** (Deleção de Código):
- Ação: `DELETE_CONNECTION_CODE`
- Log Type: `DELETE`
- Campos: patientId, IP, timestamp

**UNAUTHORIZED_ACCESS_ATTEMPT** (Tentativa de Acesso Não Autorizado):
- Ação: `UNAUTHORIZED_ACCESS_ATTEMPT`
- Log Type: `SECURITY`
- Campos: userId, attemptedPatientId, userType, dataType, IP, timestamp

**AUTHORIZED_DATA_ACCESS** (Acesso Autorizado):
- Ação: `AUTHORIZED_DATA_ACCESS`
- Log Type: `ACCESS`
- Campos: professionalId, patientId, userType, dataType, IP, timestamp

### 6. Limpeza Automática de Códigos Expirados

**Implementação**: Endpoint administrativo ou job cron

```javascript
cleanupExpiredCodes: async () => {
    const query = 'DELETE FROM patient_connection_code WHERE expires_at < NOW() RETURNING *;';
    const { rows } = await pool.query(query);
    return rows; // Retorna códigos deletados
}
```

**Recomendação**: Executar periodicamente (ex: a cada 10 minutos)

## Fluxo Completo de Compartilhamento

### Passo 1: Paciente Gera Código

**Endpoint**: `POST /patient-connection-code/generate/:patientId`

**Request**:
```bash
curl -X POST http://localhost:5001/patient-connection-code/generate/{patientId} \
  -H "Authorization: Bearer <patient-token>"
```

**Response**:
```json
{
  "id": "uuid-do-codigo",
  "patient_id": "uuid-do-paciente",
  "code": "123456",
  "created_at": "2025-11-29T10:00:00Z",
  "expires_at": "2025-11-29T10:05:00Z",
  "used": false
}
```

**Log Criado**:
```
Action: GENERATE_CONNECTION_CODE
Type: CREATE
Description: Código de conexão gerado para paciente {patientId}
```

### Passo 2: Paciente Compartilha Código

O paciente compartilha manualmente o código (ex: "123456") com o profissional via:
- Mensagem de texto
- WhatsApp
- Ligação telefônica
- Presencialmente

### Passo 3: Profissional Usa Código

**Endpoint**: `POST /patient-connection-code/connect`

**Request**:
```bash
curl -X POST http://localhost:5001/patient-connection-code/connect \
  -H "Authorization: Bearer <professional-token>" \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'
```

**Response (Sucesso)**:
```json
{
  "success": true,
  "association": {
    "id": "uuid-da-associacao",
    "patient_id": "uuid-do-paciente",
    "nutricionist_id": "uuid-do-nutricionista",
    "physical_educator_id": null,
    "is_active": true,
    "created_at": "2025-11-29T10:02:00Z"
  },
  "patient_name": "João Silva"
}
```

**Log Criado**:
```
Action: CONNECT_WITH_CODE
Type: CREATE
Description: Nutricionist {id} conectado ao paciente João Silva via código
```

**Validações Executadas**:
1. Código existe e não está expirado
2. Código não foi usado anteriormente (used = false)
3. Profissional não está já associado (se nutricionista, verifica nutricionist_id)
4. Marca código como usado após sucesso

### Passo 4: Profissional Acessa Dados

**Endpoint**: `GET /meal/patient/:patientId` (exemplo para nutricionista)

**Middleware Aplicado**: `checkPatientAccess('meal')`

**Validações**:
1. Existe associação ativa entre profissional e paciente
2. Tipo de profissional corresponde ao tipo de dado:
   - Nutricionista → dados de dieta (meal)
   - Educador Físico → dados de treino (workout)

**Log Criado**:
```
Action: AUTHORIZED_DATA_ACCESS
Type: ACCESS
Description: Nutricionist {id} acessou dados meal do paciente {patientId}
```

## Estrutura dos Testes

### Teste 1: Geração de Código
Valida criação de código temporário.

**Arquivo**: `backend/tests/integration/PatientConnectionCode.test.js`

**Cenários**:
- 1.1 - Gerar código com autenticação válida
- 1.2 - Código deve ter 6 dígitos
- 1.3 - Código deve ter expiração de 5 minutos
- 1.4 - Apenas um código ativo por paciente
- 1.5 - Rejeitar sem autenticação

**Validações**:
- Código no formato /^\d{6}$/
- expires_at = created_at + 5 minutos
- used = false
- Código único (constraint UNIQUE)

### Teste 2: Validação de Código
Valida uso de código por profissional.

**Cenários**:
- 2.1 - Nutricionista conecta com código válido
- 2.2 - Educador físico conecta com código válido
- 2.3 - Rejeitar código inválido
- 2.4 - Rejeitar código expirado
- 2.5 - Rejeitar código já utilizado

**Validações**:
- Associação criada no banco
- Código marcado como used = true
- Erro 404 para código inválido/expirado
- patient_name retornado na resposta

### Teste 3: Controle de Acesso por Tipo
Valida que profissional acessa apenas dados do seu tipo.

**Cenários**:
- 3.1 - Nutricionista acessa dados de dieta (permitido)
- 3.2 - Nutricionista tenta acessar dados de treino (bloqueado)
- 3.3 - Educador físico acessa dados de treino (permitido)
- 3.4 - Educador físico tenta acessar dados de dieta (bloqueado)
- 3.5 - Paciente acessa seus próprios dados (permitido)

**Validações**:
- Status 200 para acessos permitidos
- Status 403 para acessos bloqueados
- Mensagens de erro específicas
- Logs de tentativas não autorizadas

### Teste 4: Expiração Automática
Valida que códigos expiram após 5 minutos.

**Cenários**:
- 4.1 - Código válido dentro de 5 minutos
- 4.2 - Código expirado após 5 minutos
- 4.3 - Limpeza automática de códigos expirados
- 4.4 - Código usado não pode ser reutilizado

**Validações**:
- findValidByCode retorna null após expiração
- WHERE expires_at > NOW() filtra corretamente
- Cleanup deleta apenas códigos expirados
- Flag used impede reutilização

### Teste 5: Registro de Logs
Valida que todas as operações são auditadas.

**Cenários**:
- 5.1 - Geração de código registrada
- 5.2 - Uso de código registrado
- 5.3 - Tentativa de acesso não autorizado registrada
- 5.4 - Acesso autorizado registrado
- 5.5 - Deleção de código registrada

**Validações**:
- Logs contêm action, log_type, status, user_id
- IP e timestamp capturados
- Detalhes específicos registrados (patientId, professionalId, dataType)

### Teste 6: Associação Única por Tipo
Valida que paciente não pode ter múltiplos profissionais do mesmo tipo.

**Cenários**:
- 6.1 - Primeiro nutricionista conecta com sucesso
- 6.2 - Segundo nutricionista é rejeitado
- 6.3 - Educador físico pode conectar no mesmo paciente
- 6.4 - Segundo educador físico é rejeitado

**Validações**:
- Erro "já possui um nutricionista associado"
- Erro "já possui um educador físico associado"
- Associação mantém nutricionista E educador físico separadamente

## Como Executar os Testes

### Pré-requisitos
1. Node.js v18+ instalado
2. PostgreSQL rodando (porta 5433)
3. Dependências instaladas: `npm install --save-dev jest @jest/globals supertest`
4. Banco de dados com tabelas patient_connection_code e patient_professional_association
5. Variável de ambiente JWT_SECRET configurada

### Teste de Integração Completo

**Executar todos os testes**:
```bash
cd backend
npm test -- tests/integration/PatientConnectionCode.test.js
```

**Executar teste específico**:
```bash
npm test -- tests/integration/PatientConnectionCode.test.js -t "deve gerar código com autenticação válida"
```

### Teste Manual com cURL

**1. Gerar Código (como paciente)**:
```bash
curl -X POST http://localhost:5001/patient-connection-code/generate/{patientId} \
  -H "Authorization: Bearer <patient-token>" \
  -H "Content-Type: application/json"
```

**2. Verificar Código Ativo**:
```bash
curl -X GET http://localhost:5001/patient-connection-code/active/{patientId} \
  -H "Authorization: Bearer <patient-token>"
```

**3. Conectar com Código (como profissional)**:
```bash
curl -X POST http://localhost:5001/patient-connection-code/connect \
  -H "Authorization: Bearer <professional-token>" \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'
```

**4. Testar Acesso a Dados**:
```bash
# Nutricionista acessa dietas
curl -X GET http://localhost:5001/meal/patient/{patientId} \
  -H "Authorization: Bearer <nutri-token>"

# Educador físico acessa treinos
curl -X GET http://localhost:5001/workout/patient/{patientId} \
  -H "Authorization: Bearer <educator-token>"
```

**5. Deletar Código**:
```bash
curl -X DELETE http://localhost:5001/patient-connection-code/{patientId} \
  -H "Authorization: Bearer <patient-token>"
```

### Verificar Logs no Banco

```sql
-- Ver logs de geração de código
SELECT * FROM logs 
WHERE action = 'GENERATE_CONNECTION_CODE' 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver logs de uso de código
SELECT * FROM logs 
WHERE action = 'CONNECT_WITH_CODE' 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver tentativas de acesso não autorizado
SELECT * FROM logs 
WHERE action = 'UNAUTHORIZED_ACCESS_ATTEMPT' 
ORDER BY created_at DESC;

-- Ver códigos ativos
SELECT * FROM patient_connection_code 
WHERE expires_at > NOW() AND used = false;

-- Ver códigos expirados
SELECT * FROM patient_connection_code 
WHERE expires_at < NOW() OR used = true;

-- Ver associações ativas
SELECT 
    ppa.*,
    p.name as patient_name,
    n.name as nutricionist_name,
    pe.name as educator_name
FROM patient_professional_association ppa
LEFT JOIN patient p ON ppa.patient_id = p.id
LEFT JOIN nutricionist n ON ppa.nutricionist_id = n.id
LEFT JOIN physical_educator pe ON ppa.physical_educator_id = pe.id
WHERE ppa.is_active = true;
```

## Interpretação dos Resultados

### Resultado APROVADO

**Critérios**:
- Taxa de expiração correta ≥ 100%
- Taxa de uso único ≥ 100%
- Controle de acesso por tipo ≥ 100%
- Todos os logs registrados corretamente

**Significado**:
- Códigos expirando corretamente após 5 minutos ou uso
- Nenhum código reutilizado
- Profissionais acessando apenas dados permitidos
- Sistema pronto para produção

### Resultado PARCIAL

**Critérios**:
- Taxa de expiração entre 95-100%
- Alguns códigos permitindo reutilização
- Alguns acessos incorretos de tipo de dado

**Ações Recomendadas**:
1. Verificar query de validação de código (expires_at > NOW() AND used = false)
2. Testar flag used após conexão bem-sucedida
3. Validar middleware checkPatientAccess
4. Revisar logs de tentativas não autorizadas

### Resultado REPROVADO

**Critérios**:
- Códigos expirados permitindo acesso
- Códigos reutilizados
- Profissionais acessando dados incorretos

**Ações Imediatas**:

**1. Verificar Expiração de Códigos**:
```sql
-- Códigos expirados que ainda estão válidos?
SELECT * FROM patient_connection_code 
WHERE expires_at < NOW() AND used = false;

-- Deve retornar vazio
```

**2. Verificar Flag de Uso Único**:
```sql
-- Verificar se markAsUsed está funcionando
SELECT * FROM patient_connection_code 
WHERE used = true;

-- Deve conter códigos já utilizados
```

**3. Verificar Controle de Acesso**:
```javascript
// Testar middleware manualmente
const association = await PatientProfessionalAssociationRepository.findByPatientId(patientId);
console.log('Associação:', association);
console.log('Nutricionista associado:', association?.nutricionist_id);
console.log('Educador associado:', association?.physical_educator_id);
```

**4. Verificar Logs**:
```sql
-- Ver se tentativas não autorizadas estão sendo registradas
SELECT COUNT(*) FROM logs WHERE action = 'UNAUTHORIZED_ACCESS_ATTEMPT';

-- Ver se acessos autorizados estão sendo registrados
SELECT COUNT(*) FROM logs WHERE action = 'AUTHORIZED_DATA_ACCESS';
```

## Troubleshooting

### Problema: "Código não expira após 5 minutos"

**Causa**: Query de validação não verifica expires_at corretamente

**Solução**:
```javascript
// Verificar query em PatientConnectionCodeRepository.js
const query = `
    SELECT * FROM patient_connection_code 
    WHERE code = $1 
      AND expires_at > NOW()  // <- Verificar esta linha
      AND used = false;
`;
```

**Teste**:
```sql
-- Criar código expirado manualmente
INSERT INTO patient_connection_code (id, patient_id, code, expires_at, used)
VALUES (gen_random_uuid(), 'patient-id', '999999', NOW() - INTERVAL '1 minute', false);

-- Tentar buscar (deve retornar vazio)
SELECT * FROM patient_connection_code 
WHERE code = '999999' AND expires_at > NOW() AND used = false;
```

### Problema: "Código pode ser usado múltiplas vezes"

**Causa**: Flag used não está sendo atualizada após uso

**Solução**:
```javascript
// Verificar PatientConnectionCodeService.js
await PatientConnectionCodeRepository.markAsUsed(codeData.id);

// Implementação de markAsUsed:
markAsUsed: async (codeId) => {
    const query = `
        UPDATE patient_connection_code 
        SET used = true 
        WHERE id = $1 
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [codeId]);
    return rows[0];
}
```

**Teste**:
```sql
-- Verificar se código foi marcado como usado
SELECT code, used FROM patient_connection_code WHERE code = '123456';
-- Deve mostrar used = true
```

### Problema: "Nutricionista consegue acessar dados de treino"

**Causa**: Middleware checkPatientAccess não está configurado corretamente

**Solução**:
```javascript
// Verificar rotas em mealRoutes.js
import { checkPatientAccess } from '../middlewares/patientAccessMiddleware.js';

router.get('/patient/:patientId', 
    authenticateToken, 
    checkPatientAccess('meal'),  // <- Especificar tipo
    MealController.getByPatientId
);

// Verificar rotas em workoutRoutes.js
router.get('/patient/:patientId', 
    authenticateToken, 
    checkPatientAccess('workout'),  // <- Especificar tipo
    WorkoutController.getByPatientId
);
```

### Problema: "Paciente pode gerar múltiplos códigos ativos"

**Causa**: Constraint UNIQUE não está funcionando ou código anterior não é deletado

**Solução**:
```sql
-- Verificar constraint
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'patient_connection_code'::regclass;

-- Deve mostrar constraint UNIQUE em patient_id
```

```javascript
// Verificar se código anterior é deletado em createOrUpdate
await pool.query('DELETE FROM patient_connection_code WHERE patient_id = $1', [patientId]);
```

### Problema: "Educador físico já associado pode se associar novamente"

**Causa**: Validação de duplicação não está funcionando

**Solução**:
```javascript
// Verificar PatientConnectionCodeService.connectWithCode
const existingAssociation = await PatientProfessionalAssociationRepository.findByPatientId(codeData.patient_id);

if (existingAssociation) {
    if (professionalType === 'Physical_educator' && existingAssociation.physical_educator_id) {
        throw new Error('Paciente já possui um educador físico associado');
    }
}
```

### Problema: "Logs não estão sendo criados"

**Solução**:
```javascript
// Verificar se LogService.createLog está sendo chamado
// No PatientConnectionCodeController.js
await LogService.createLog({
    action: "GENERATE_CONNECTION_CODE",
    logType: "CREATE",
    description: `Código de conexão gerado para paciente ${patientId}`,
    ip,
    oldValue: null,
    newValue: codeData,
    status: "SUCCESS",
    userId: userId
});
```

**Teste**:
```sql
SELECT COUNT(*) FROM logs WHERE action LIKE '%CONNECTION_CODE%';
-- Deve retornar > 0 se códigos foram gerados/usados
```

## Conformidade com Requisitos

| Requisito | Implementação | Status |
|-----------|---------------|--------|
| Código expira em 5 minutos | expires_at = NOW() + INTERVAL '5 minutes' | ✓ |
| Código expira após uso | Flag used = true após connectWithCode | ✓ |
| Código único de 6 dígitos | Math.floor(100000 + Math.random() * 900000) | ✓ |
| Um código ativo por paciente | UNIQUE constraint em patient_id | ✓ |
| Uso único do código | WHERE used = false na validação | ✓ |
| Acesso por tipo de profissional | checkPatientAccess(dataType) middleware | ✓ |
| Nutricionista → dieta | checkPatientAccess('meal') | ✓ |
| Educador → treino | checkPatientAccess('workout') | ✓ |
| Registro de logs | LogService em todas operações | ✓ |
| Bloqueio de código inválido | Erro "inválido ou expirado" | ✓ |
| Associação única por tipo | Validação de professional_id existente | ✓ |

## Integração no Sistema

```javascript
// src/index.js ou src/app.js
import patientConnectionCodeRoutes from "./routes/patientConnectionCodeRoutes.js";
import { checkPatientAccess } from "./middlewares/patientAccessMiddleware.js";

// Rotas de código de conexão
app.use("/patient-connection-code", patientConnectionCodeRoutes);

// Aplicar middleware em rotas de dados
import mealRoutes from "./routes/mealRoutes.js";
import workoutRoutes from "./routes/workoutRoutes.js";

// Meal routes com controle de acesso
app.use("/meal", mealRoutes);
// Em mealRoutes.js: router.get('/patient/:patientId', authenticateToken, checkPatientAccess('meal'), ...)

// Workout routes com controle de acesso
app.use("/workout", workoutRoutes);
// Em workoutRoutes.js: router.get('/patient/:patientId', authenticateToken, checkPatientAccess('workout'), ...)
```

## Fluxo de Integração Frontend

### 1. Tela de Geração de Código (Paciente)

```javascript
const generateCode = async () => {
    const response = await fetch(`/patient-connection-code/generate/${patientId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${patientToken}`
        }
    });
    
    const data = await response.json();
    
    // Mostrar código ao paciente
    setCode(data.code);
    setExpiresAt(data.expires_at);
    
    // Iniciar timer de expiração
    const expirationTime = new Date(data.expires_at);
    const now = new Date();
    const timeLeft = expirationTime - now;
    
    setTimeout(() => {
        alert('Código expirado! Gere um novo código.');
        setCode(null);
    }, timeLeft);
};
```

### 2. Tela de Uso de Código (Profissional)

```javascript
const connectWithCode = async (code) => {
    const response = await fetch('/patient-connection-code/connect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${professionalToken}`
        },
        body: JSON.stringify({ code })
    });
    
    if (response.ok) {
        const data = await response.json();
        alert(`Conectado com sucesso ao paciente ${data.patient_name}!`);
        // Redirecionar para lista de pacientes
        navigate('/patients');
    } else {
        const error = await response.json();
        alert(error.message);
    }
};
```

### 3. Tela de Dados do Paciente (Profissional)

```javascript
const fetchPatientData = async (patientId) => {
    const endpoint = userType === 'Nutricionist' 
        ? `/meal/patient/${patientId}` 
        : `/workout/patient/${patientId}`;
    
    const response = await fetch(endpoint, {
        headers: {
            'Authorization': `Bearer ${professionalToken}`
        }
    });
    
    if (response.status === 403) {
        alert('Você não tem permissão para acessar estes dados');
        return;
    }
    
    const data = await response.json();
    setPatientData(data);
};
```

## Melhorias Futuras

### 1. Notificação de Conexão

**Email para Paciente**:
```javascript
// Após conexão bem-sucedida
await sendEmail({
    to: patient.email,
    subject: 'Nova Conexão com Profissional',
    text: `${professionalType} ${professionalName} foi conectado à sua conta.`
});
```

### 2. QR Code para Compartilhamento

**Geração de QR Code**:
```javascript
import QRCode from 'qrcode';

const generateQRCode = async (code) => {
    const qrDataUrl = await QRCode.toDataURL(code);
    return qrDataUrl; // Exibir imagem no frontend
};
```

### 3. Desassociação de Profissional

**Endpoint de desassociação**:
```javascript
POST /patient-professional-association/disconnect/:professionalType

// Body: { patientId }
// Remove nutricionist_id ou physical_educator_id da associação
```

### 4. Histórico de Conexões

**Tabela de histórico**:
```sql
CREATE TABLE connection_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patient(id),
    professional_id UUID,
    professional_type user_type_enum,
    action VARCHAR(50), -- 'connect', 'disconnect'
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Renovação de Código Expirado

**Endpoint de renovação**:
```javascript
POST /patient-connection-code/renew/:patientId

// Deleta código anterior e gera novo
// Retorna novo código com nova expiração
```

### 6. Múltiplos Profissionais do Mesmo Tipo

**Alterar constraint**:
```sql
-- Remover UNIQUE(patient_id)
-- Permitir múltiplos nutricionistas/educadores
-- Adicionar campo is_primary para identificar principal
```

---

**Criado em:** 29/11/2025
**Versão:** 1.0.0
