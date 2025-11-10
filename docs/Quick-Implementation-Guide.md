# 🚀 Guia Rápido de Implementação - Sistema de Códigos de Conexão

## ✅ Checklist de Correções Necessárias

### 1. CRÍTICO - Implementar Controle de Acesso aos Dados

#### 📝 Passo 1: Adicionar professionalId ao Token JWT

**Arquivo:** `/backend/src/services/AuthService.js`

Localize a função de login e modifique a geração do token:

```javascript
// Dentro da função login, após validar as credenciais:

// Buscar ID do profissional/paciente
let professionalId = null;

if (user.user_type === 'Nutricionist') {
    const nutricionist = await NutricionistRepository.findByAuthId(user.id);
    professionalId = nutricionist?.id;
} else if (user.user_type === 'Physical_educator') {
    const educator = await PhysicalEducatorRepository.findByAuthId(user.id);
    professionalId = educator?.id;
} else if (user.user_type === 'Patient') {
    const patient = await PatientRepository.findByAuthId(user.id);
    professionalId = patient?.id;
}

// Gerar token com professionalId
const token = jwt.sign(
    { 
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        professionalId: professionalId  // ← ADICIONAR ESTA LINHA
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);
```

#### 📝 Passo 2: Aplicar Middleware nas Rotas

**Arquivo:** `/backend/src/routes/mealCalendarRoutes.js`

```javascript
import express from 'express';
import MealCalendarController from '../controllers/MealCalendarController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { checkPatientAccess } from '../middlewares/patientAccessMiddleware.js';  // ← ADICIONAR

const router = express.Router();

router.get(
    '/monthly/:patientId/:year/:month',
    authMiddleware,
    checkPatientAccess('meal'),  // ← ADICIONAR ESTA LINHA
    MealCalendarController.getMonthlyProgress
);

router.get(
    '/day/:patientId/:date',
    authMiddleware,
    checkPatientAccess('meal'),  // ← ADICIONAR ESTA LINHA
    MealCalendarController.getDayDetails
);

export default router;
```

**Arquivo:** `/backend/src/routes/workoutCalendarRoutes.js`

```javascript
import express from 'express';
import WorkoutCalendarController from '../controllers/WorkoutCalendarController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { checkPatientAccess } from '../middlewares/patientAccessMiddleware.js';  // ← ADICIONAR

const router = express.Router();

router.get(
    '/monthly/:patientId/:year/:month',
    authMiddleware,
    checkPatientAccess('workout'),  // ← ADICIONAR ESTA LINHA
    WorkoutCalendarController.getMonthlyProgress
);

router.get(
    '/day/:patientId/:date',
    authMiddleware,
    checkPatientAccess('workout'),  // ← ADICIONAR ESTA LINHA
    WorkoutCalendarController.getDayDetails
);

export default router;
```

**Arquivo:** `/backend/src/routes/mealRecordRoutes.js`

```javascript
import { checkPatientAccess } from '../middlewares/patientAccessMiddleware.js';

// Adicionar middleware nas rotas que acessam dados do paciente:
router.get('/:date/:patientId', authMiddleware, checkPatientAccess('meal'), ...);
router.post('/', authMiddleware, checkPatientAccess('meal'), ...);
router.put('/:id', authMiddleware, checkPatientAccess('meal'), ...);
router.delete('/:id', authMiddleware, checkPatientAccess('meal'), ...);
```

**Arquivo:** `/backend/src/routes/workoutRecordRoutes.js`

```javascript
import { checkPatientAccess } from '../middlewares/patientAccessMiddleware.js';

// Adicionar middleware nas rotas que acessam dados do paciente:
router.get('/:date/:patientId', authMiddleware, checkPatientAccess('workout'), ...);
router.post('/', authMiddleware, checkPatientAccess('workout'), ...);
router.put('/:id', authMiddleware, checkPatientAccess('workout'), ...);
router.delete('/:id', authMiddleware, checkPatientAccess('workout'), ...);
```

### 2. RECOMENDADO - Configurar Job de Limpeza Automática

**Arquivo:** `/backend/src/schedulers/CodeCleanupScheduler.js`

```javascript
import cron from 'node-cron';
import { PatientConnectionCodeService } from '../services/PatientConnectionCodeService.js';
import { LogService } from '../services/LogService.js';

class CodeCleanupScheduler {
    start() {
        // Executa a cada 10 minutos
        cron.schedule('*/10 * * * *', async () => {
            try {
                console.log('[CodeCleanup] Iniciando limpeza de códigos expirados...');
                
                const deleted = await PatientConnectionCodeService.cleanupExpiredCodes();
                
                if (deleted.length > 0) {
                    console.log(`[CodeCleanup] ${deleted.length} códigos expirados removidos`);
                    
                    await LogService.createLog({
                        action: 'AUTO_CLEANUP_EXPIRED_CODES',
                        logType: 'DELETE',
                        description: `Limpeza automática removeu ${deleted.length} códigos expirados`,
                        ip: null,
                        oldValue: null,
                        newValue: { count: deleted.length, codes: deleted.map(c => c.code) },
                        status: 'SUCCESS',
                        userId: null
                    });
                }
            } catch (error) {
                console.error('[CodeCleanup] Erro ao limpar códigos:', error);
                
                await LogService.createLog({
                    action: 'AUTO_CLEANUP_EXPIRED_CODES',
                    logType: 'ERROR',
                    description: `Erro na limpeza automática: ${error.message}`,
                    ip: null,
                    oldValue: null,
                    newValue: { error: error.message },
                    status: 'FAILURE',
                    userId: null
                });
            }
        });

        console.log('✅ Code Cleanup Scheduler iniciado (executa a cada 10 minutos)');
    }
}

export default new CodeCleanupScheduler();
```

**Ativar no arquivo principal:**

```javascript
// No seu index.js ou app.js
import CodeCleanupScheduler from './schedulers/CodeCleanupScheduler.js';

// Após configurar o servidor:
CodeCleanupScheduler.start();
```

**Instalar dependência:**

```bash
npm install node-cron
```

### 3. TESTES - Configurar Ambiente de Testes

#### Passo 1: Instalar Dependências

```bash
cd backend
npm install --save-dev jest @jest/globals supertest cross-env
```

#### Passo 2: Adicionar Scripts no package.json

```json
{
  "scripts": {
    "test": "cross-env NODE_ENV=test jest --detectOpenHandles --forceExit",
    "test:watch": "cross-env NODE_ENV=test jest --watch",
    "test:coverage": "cross-env NODE_ENV=test jest --coverage",
    "test:unit": "cross-env NODE_ENV=test jest --testPathPattern=tests/unit",
    "test:integration": "cross-env NODE_ENV=test jest --testPathPattern=tests/integration"
  }
}
```

#### Passo 3: Criar Arquivo de Configuração Jest

**Arquivo:** `/backend/jest.config.js`

```javascript
export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js',
        '!src/config/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

#### Passo 4: Exportar App Express

**Arquivo:** `/backend/src/index.js` (no final do arquivo)

```javascript
// ... seu código existente ...

// Adicionar no final:
export default app;
```

#### Passo 5: Executar Testes

```bash
# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Todos os testes
npm test

# Com coverage
npm run test:coverage
```

---

## 🧪 Como Testar Manualmente (Usando Insomnia/Postman)

### Cenário 1: Conexão Bem-Sucedida

1. **Paciente gera código:**
   ```
   POST /patient-connection-code/generate/:patientId
   Authorization: Bearer {token_paciente}
   ```
   Resposta esperada:
   ```json
   {
     "id": "uuid",
     "patient_id": "uuid",
     "code": "123456",
     "expires_at": "2025-11-09T15:35:00.000Z",
     "used": false
   }
   ```

2. **Nutricionista conecta usando o código:**
   ```
   POST /patient-connection-code/connect
   Authorization: Bearer {token_nutricionista}
   Body: { "code": "123456" }
   ```
   Resposta esperada:
   ```json
   {
     "success": true,
     "association": {...},
     "patient_name": "Nome do Paciente"
   }
   ```

3. **Verificar logs:**
   ```sql
   SELECT * FROM logs 
   WHERE action IN ('GENERATE_CONNECTION_CODE', 'CONNECT_WITH_CODE')
   ORDER BY created_at DESC;
   ```

### Cenário 2: Código Expirado

1. Gerar código
2. Aguardar 5 minutos
3. Tentar conectar
4. Deve retornar erro 404: "Código inválido ou expirado"

### Cenário 3: Código Já Utilizado

1. Gerar código
2. Nutricionista conecta (sucesso)
3. Tentar conectar novamente com o mesmo código
4. Deve retornar erro 404

### Cenário 4: Controle de Acesso (APÓS implementar o middleware)

1. Nutricionista conecta ao paciente
2. **Teste acesso autorizado:**
   ```
   GET /meal-calendar/monthly/:patientId/2025/1
   Authorization: Bearer {token_nutricionista}
   ```
   Deve retornar 200 ✅

3. **Teste acesso NÃO autorizado:**
   ```
   GET /workout-calendar/monthly/:patientId/2025/1
   Authorization: Bearer {token_nutricionista}
   ```
   Deve retornar 403 ❌ "Apenas educadores físicos podem acessar dados de treino"

4. **Verificar logs de acesso:**
   ```sql
   SELECT * FROM logs 
   WHERE action = 'UNAUTHORIZED_ACCESS_ATTEMPT'
   ORDER BY created_at DESC;
   ```

---

## 📊 Verificação de Compliance com Requisitos

### Checklist Final:

- [ ] **Expiração automática (5 minutos)**
  - Verificar: Código expira após 5 minutos? ✅
  - Teste: Tentar usar código após 5 minutos deve falhar
  
- [ ] **Uso único do código**
  - Verificar: Código marcado como `used = true` após conexão? ✅
  - Teste: Segundo uso do mesmo código deve falhar
  
- [ ] **Logs registram todas as ações**
  - Verificar: Logs com action `GENERATE_CONNECTION_CODE`? ✅
  - Verificar: Logs com action `CONNECT_WITH_CODE`? ✅
  - Verificar: Logs com action `UNAUTHORIZED_ACCESS_ATTEMPT`? ⚠️ (após implementar middleware)
  
- [ ] **Acesso restrito por tipo de profissional**
  - Verificar: Nutricionista só acessa dados de dieta? ⚠️ (implementar middleware)
  - Verificar: Educador só acessa dados de treino? ⚠️ (implementar middleware)
  - Teste: Nutricionista tentando acessar treino deve retornar 403

---

## 🔍 Queries SQL Úteis para Auditoria

```sql
-- Ver todos os códigos ativos
SELECT pcc.*, p.name as patient_name
FROM patient_connection_code pcc
JOIN patient p ON pcc.patient_id = p.id
WHERE pcc.expires_at > NOW() AND pcc.used = false;

-- Ver todas as conexões estabelecidas
SELECT 
    p.name as patient_name,
    n.name as nutricionist_name,
    pe.name as educator_name,
    ppa.is_active,
    ppa.created_at
FROM patient_professional_association ppa
JOIN patient p ON ppa.patient_id = p.id
LEFT JOIN nutricionist n ON ppa.nutricionist_id = n.id
LEFT JOIN physical_educator pe ON ppa.physical_educator_id = pe.id
ORDER BY ppa.created_at DESC;

-- Auditoria de códigos (últimas 24h)
SELECT 
    action,
    log_type,
    description,
    status,
    created_at
FROM logs
WHERE action LIKE '%CONNECTION_CODE%'
    AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Tentativas de acesso não autorizado
SELECT *
FROM logs
WHERE action = 'UNAUTHORIZED_ACCESS_ATTEMPT'
ORDER BY created_at DESC
LIMIT 50;

-- Códigos expirados não limpos
SELECT COUNT(*) as expired_codes
FROM patient_connection_code
WHERE expires_at < NOW();
```

---

## 📈 Próximos Passos Recomendados

1. ✅ Implementar middleware de autorização (PRIORIDADE ALTA)
2. ✅ Adicionar professionalId ao token JWT (PRIORIDADE ALTA)
3. ✅ Configurar testes automatizados (PRIORIDADE MÉDIA)
4. ✅ Implementar limpeza automática de códigos (PRIORIDADE MÉDIA)
5. 📊 Criar dashboard de auditoria de acessos (PRIORIDADE BAIXA)
6. 🔔 Notificações para paciente quando profissional conecta (PRIORIDADE BAIXA)

---

## 🆘 Troubleshooting Comum

### Problema: "Token inválido ou expirado"
- Verificar se JWT_SECRET está configurado
- Verificar se o token foi gerado corretamente
- Verificar expiração do token (padrão: 24h)

### Problema: "Código inválido ou expirado" mesmo código sendo válido
- Verificar timezone do servidor vs banco de dados
- Executar: `SELECT NOW(), code, expires_at FROM patient_connection_code;`
- Verificar se campo `used` não está como `true`

### Problema: Testes falhando
- Verificar conexão com banco de dados de teste
- Verificar se app foi exportado do index.js
- Executar: `npm test -- --verbose` para ver detalhes

### Problema: Profissional acessa dados que não deveria
- **ISSO É ESPERADO ATÉ IMPLEMENTAR O MIDDLEWARE**
- Implementar `patientAccessMiddleware.js` nas rotas
- Verificar se `professionalId` está no token JWT

---

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do servidor
2. Verificar logs da tabela `logs`
3. Executar queries SQL de auditoria
4. Revisar este documento

**Documentos relacionados:**
- `/docs/Connection-Code-Analysis-And-Tests.md` - Análise completa
- `/backend/tests/` - Exemplos de testes
