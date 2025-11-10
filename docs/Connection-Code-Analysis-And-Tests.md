# Análise do Sistema de Códigos de Conexão - FitLife

## 📋 Status de Implementação dos Critérios de Aceitação

### ✅ Critérios IMPLEMENTADOS

#### 1. Expiração Automática do Código ✅
- **Implementado em:** `PatientConnectionCodeRepository.js`
- **Como funciona:**
  - Código expira em 5 minutos: `const expiresAt = new Date(Date.now() + 5 * 60 * 1000);`
  - Validação na query SQL: `WHERE pcc.expires_at > NOW() AND pcc.used = false`
  - Marca código como usado após primeira conexão: `markAsUsed()`
  - Limpeza automática de códigos expirados via endpoint: `DELETE FROM patient_connection_code WHERE expires_at < NOW()`

#### 2. Uso Único do Código ✅
- **Implementado em:** `PatientConnectionCodeService.js`
- **Como funciona:**
  - Campo `used` na tabela: `used BOOLEAN DEFAULT FALSE`
  - Validação: `AND pcc.used = false`
  - Marcação após uso: `await PatientConnectionCodeRepository.markAsUsed(codeData.id)`

#### 3. Registro em Logs ✅
- **Implementado em:** `PatientConnectionCodeController.js`
- **Ações registradas:**
  - ✅ Geração de código (`GENERATE_CONNECTION_CODE`)
  - ✅ Consulta de código ativo (`GET_ACTIVE_CONNECTION_CODE`)
  - ✅ Conexão via código (`CONNECT_WITH_CODE`)
  - ✅ Deleção de código (`DELETE_CONNECTION_CODE`)
  - ✅ Limpeza de códigos expirados (`CLEANUP_EXPIRED_CODES`)
  - ✅ Todos os erros são logados com status `FAILURE`

### ⚠️ Critérios PARCIALMENTE IMPLEMENTADOS

#### 4. Controle de Acesso por Tipo de Profissional ⚠️

**O que está implementado:**
- ✅ Validação de tipo de usuário no `connectWithCode`:
  ```javascript
  if (userType !== 'Nutricionist' && userType !== 'Physical_educator') {
      return res.status(403).json({ message: "Apenas nutricionistas e educadores físicos podem usar códigos de conexão" });
  }
  ```
- ✅ Associação correta por tipo de profissional
- ✅ Impedimento de duplicação do mesmo tipo de profissional

**❌ O que está FALTANDO - CRÍTICO:**

##### **Falta implementar middleware de autorização para acesso aos dados**

Atualmente, **qualquer profissional autenticado pode acessar dados de qualquer paciente**, pois não há verificação de associação nas rotas de consulta:

**Rotas vulneráveis:**
1. `GET /meal-calendar/monthly/:patientId/:year/:month` - Sem verificação de associação
2. `GET /meal-calendar/day/:patientId/:date` - Sem verificação de associação
3. `GET /workout-calendar/monthly/:patientId/:year/:month` - Sem verificação de associação
4. `GET /workout-calendar/day/:patientId/:date` - Sem verificação de associação
5. `GET /meal-records/:date/:patientId` - Sem verificação de associação
6. `GET /workout-records/:date/:patientId` - Sem verificação de associação

**Risco de Segurança:**
- Um nutricionista pode acessar dados de treino (que deveria ser apenas do educador físico)
- Um educador físico pode acessar dados de dieta (que deveria ser apenas do nutricionista)
- Profissionais podem acessar dados de pacientes que não estão associados a eles

---

## 🚨 RECOMENDAÇÕES DE CORREÇÃO

### 1. Criar Middleware de Autorização

Criar arquivo: `/backend/src/middlewares/patientAccessMiddleware.js`

```javascript
import PatientProfessionalAssociationRepository from '../repositories/PatientProfessionalAssociationRepository.js';

/**
 * Middleware para verificar se o profissional tem acesso ao paciente
 * E se o tipo de dado solicitado é compatível com o tipo de profissional
 */
export const checkPatientAccess = (dataType = null) => {
    return async (req, res, next) => {
        try {
            const userType = req.user?.user_type;
            const patientId = req.params.patientId;
            const professionalId = req.user?.professionalId; // Precisa ser adicionado ao token JWT

            // Verifica se é paciente acessando seus próprios dados
            if (userType === 'Patient') {
                // Buscar patientId do auth_id
                const patient = await getPatientByAuthId(req.user.id);
                if (patient && patient.id === patientId) {
                    return next();
                }
                return res.status(403).json({ 
                    message: 'Você só pode acessar seus próprios dados' 
                });
            }

            // Verifica se é profissional
            if (userType !== 'Nutricionist' && userType !== 'Physical_educator') {
                return res.status(403).json({ 
                    message: 'Acesso não autorizado' 
                });
            }

            // Busca associação entre profissional e paciente
            const association = await PatientProfessionalAssociationRepository.findByPatientId(patientId);

            if (!association || !association.is_active) {
                return res.status(403).json({ 
                    message: 'Você não possui acesso a este paciente' 
                });
            }

            // Verifica se o profissional está associado ao paciente
            const isAssociated = 
                (userType === 'Nutricionist' && association.nutricionist_id === professionalId) ||
                (userType === 'Physical_educator' && association.physical_educator_id === professionalId);

            if (!isAssociated) {
                return res.status(403).json({ 
                    message: 'Você não está associado a este paciente' 
                });
            }

            // Se especificou tipo de dado, verifica compatibilidade
            if (dataType) {
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
            }

            next();
        } catch (error) {
            console.error('Erro no checkPatientAccess:', error);
            res.status(500).json({ message: 'Erro ao verificar permissões' });
        }
    };
};

// Helper para buscar patient pelo auth_id
async function getPatientByAuthId(authId) {
    // Implementar busca no PatientRepository
}
```

### 2. Atualizar Rotas para Usar o Middleware

**Arquivo: `/backend/src/routes/mealCalendarRoutes.js`**
```javascript
import express from 'express';
import MealCalendarController from '../controllers/MealCalendarController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { checkPatientAccess } from '../middlewares/patientAccessMiddleware.js';

const router = express.Router();

router.get(
    '/monthly/:patientId/:year/:month',
    authMiddleware,
    checkPatientAccess('meal'), // ← ADICIONAR
    MealCalendarController.getMonthlyProgress
);

router.get(
    '/day/:patientId/:date',
    authMiddleware,
    checkPatientAccess('meal'), // ← ADICIONAR
    MealCalendarController.getDayDetails
);

export default router;
```

**Arquivo: `/backend/src/routes/workoutCalendarRoutes.js`**
```javascript
import express from 'express';
import WorkoutCalendarController from '../controllers/WorkoutCalendarController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { checkPatientAccess } from '../middlewares/patientAccessMiddleware.js';

const router = express.Router();

router.get(
    '/monthly/:patientId/:year/:month',
    authMiddleware,
    checkPatientAccess('workout'), // ← ADICIONAR
    WorkoutCalendarController.getMonthlyProgress
);

router.get(
    '/day/:patientId/:date',
    authMiddleware,
    checkPatientAccess('workout'), // ← ADICIONAR
    WorkoutCalendarController.getDayDetails
);

export default router;
```

### 3. Adicionar professionalId ao Token JWT

**Arquivo: `/backend/src/services/AuthService.js`** (na função de login)

```javascript
// Ao gerar o token, incluir o professionalId
let professionalId = null;

if (user.user_type === 'Nutricionist') {
    const nutricionist = await NutricionistRepository.findByAuthId(user.id);
    professionalId = nutricionist?.id;
} else if (user.user_type === 'Physical_educator') {
    const educator = await PhysicalEducatorRepository.findByAuthId(user.id);
    professionalId = educator?.id;
} else if (user.user_type === 'Patient') {
    const patient = await PatientRepository.findByAuthId(user.id);
    professionalId = patient?.id; // Ou patientId
}

const token = jwt.sign(
    { 
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        professionalId: professionalId // ← ADICIONAR
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);
```

---

## 🧪 PLANO DE TESTES

### Testes Unitários

#### 1. Testes do Repository (`PatientConnectionCodeRepository.test.js`)

```javascript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import PatientConnectionCodeRepository from '../repositories/PatientConnectionCodeRepository.js';
import { pool } from '../config/db.js';

describe('PatientConnectionCodeRepository', () => {
    let testPatientId;

    beforeEach(async () => {
        // Criar paciente de teste
        const result = await pool.query(
            'INSERT INTO patient (id, name, birthdate, sex, auth_id) VALUES (gen_random_uuid(), $1, $2, $3, gen_random_uuid()) RETURNING id',
            ['Paciente Teste', '1990-01-01', 'M']
        );
        testPatientId = result.rows[0].id;
    });

    afterEach(async () => {
        // Limpar dados de teste
        await pool.query('DELETE FROM patient_connection_code WHERE patient_id = $1', [testPatientId]);
        await pool.query('DELETE FROM patient WHERE id = $1', [testPatientId]);
    });

    describe('generateCode', () => {
        it('deve gerar um código de 6 dígitos', () => {
            const code = PatientConnectionCodeRepository.generateCode();
            expect(code).toMatch(/^\d{6}$/);
            expect(code.length).toBe(6);
        });
    });

    describe('createOrUpdate', () => {
        it('deve criar um novo código para o paciente', async () => {
            const codeData = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);

            expect(codeData).toBeDefined();
            expect(codeData.patient_id).toBe(testPatientId);
            expect(codeData.code).toMatch(/^\d{6}$/);
            expect(codeData.used).toBe(false);
            expect(new Date(codeData.expires_at)).toBeInstanceOf(Date);
        });

        it('deve remover código anterior ao criar novo', async () => {
            const firstCode = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            const secondCode = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);

            expect(secondCode.code).not.toBe(firstCode.code);

            const allCodes = await pool.query(
                'SELECT * FROM patient_connection_code WHERE patient_id = $1',
                [testPatientId]
            );
            expect(allCodes.rows.length).toBe(1);
        });

        it('deve criar código com expiração de 5 minutos', async () => {
            const before = Date.now();
            const codeData = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            const after = Date.now();

            const expiresAt = new Date(codeData.expires_at).getTime();
            const expectedMin = before + (5 * 60 * 1000);
            const expectedMax = after + (5 * 60 * 1000);

            expect(expiresAt).toBeGreaterThanOrEqual(expectedMin - 1000); // margem de 1s
            expect(expiresAt).toBeLessThanOrEqual(expectedMax + 1000);
        });
    });

    describe('findValidByCode', () => {
        it('deve encontrar código válido', async () => {
            const created = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            const found = await PatientConnectionCodeRepository.findValidByCode(created.code);

            expect(found).toBeDefined();
            expect(found.code).toBe(created.code);
            expect(found.patient_id).toBe(testPatientId);
        });

        it('não deve encontrar código inexistente', async () => {
            const found = await PatientConnectionCodeRepository.findValidByCode('999999');
            expect(found).toBeUndefined();
        });

        it('não deve encontrar código expirado', async () => {
            // Criar código expirado manualmente
            const code = '123456';
            const expiredDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutos atrás

            await pool.query(
                'INSERT INTO patient_connection_code (id, patient_id, code, expires_at) VALUES (gen_random_uuid(), $1, $2, $3)',
                [testPatientId, code, expiredDate]
            );

            const found = await PatientConnectionCodeRepository.findValidByCode(code);
            expect(found).toBeUndefined();
        });

        it('não deve encontrar código já usado', async () => {
            const created = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            await PatientConnectionCodeRepository.markAsUsed(created.id);

            const found = await PatientConnectionCodeRepository.findValidByCode(created.code);
            expect(found).toBeUndefined();
        });
    });

    describe('markAsUsed', () => {
        it('deve marcar código como usado', async () => {
            const created = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);
            const marked = await PatientConnectionCodeRepository.markAsUsed(created.id);

            expect(marked.used).toBe(true);
            expect(marked.id).toBe(created.id);
        });
    });

    describe('deleteExpired', () => {
        it('deve deletar apenas códigos expirados', async () => {
            // Código válido
            const validCode = await PatientConnectionCodeRepository.createOrUpdate(testPatientId);

            // Código expirado
            await pool.query(
                'INSERT INTO patient_connection_code (id, patient_id, code, expires_at) VALUES (gen_random_uuid(), $1, $2, $3)',
                [testPatientId, '999999', new Date(Date.now() - 10 * 60 * 1000)]
            );

            const deleted = await PatientConnectionCodeRepository.deleteExpired();
            expect(deleted.length).toBeGreaterThanOrEqual(1);

            const stillExists = await PatientConnectionCodeRepository.findValidByCode(validCode.code);
            expect(stillExists).toBeDefined();
        });
    });
});
```

#### 2. Testes do Service (`PatientConnectionCodeService.test.js`)

```javascript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import PatientConnectionCodeService from '../services/PatientConnectionCodeService.js';
import PatientConnectionCodeRepository from '../repositories/PatientConnectionCodeRepository.js';
import PatientProfessionalAssociationRepository from '../repositories/PatientProfessionalAssociationRepository.js';

jest.mock('../repositories/PatientConnectionCodeRepository.js');
jest.mock('../repositories/PatientProfessionalAssociationRepository.js');

describe('PatientConnectionCodeService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('connectWithCode', () => {
        it('deve rejeitar código inválido', async () => {
            PatientConnectionCodeRepository.findValidByCode.mockResolvedValue(null);

            await expect(
                PatientConnectionCodeService.connectWithCode('123456', 'prof-id', 'Nutricionist')
            ).rejects.toThrow('Código inválido ou expirado');
        });

        it('deve rejeitar se paciente já possui nutricionista', async () => {
            PatientConnectionCodeRepository.findValidByCode.mockResolvedValue({
                id: 'code-id',
                patient_id: 'patient-id',
                code: '123456',
                patient_name: 'Paciente Teste'
            });

            PatientProfessionalAssociationRepository.findByPatientId.mockResolvedValue({
                id: 'assoc-id',
                patient_id: 'patient-id',
                nutricionist_id: 'outro-nutri-id',
                physical_educator_id: null
            });

            await expect(
                PatientConnectionCodeService.connectWithCode('123456', 'prof-id', 'Nutricionist')
            ).rejects.toThrow('Paciente já possui um nutricionista associado');
        });

        it('deve criar nova associação para nutricionista', async () => {
            const mockCode = {
                id: 'code-id',
                patient_id: 'patient-id',
                code: '123456',
                patient_name: 'Paciente Teste'
            };

            PatientConnectionCodeRepository.findValidByCode.mockResolvedValue(mockCode);
            PatientProfessionalAssociationRepository.findByPatientId.mockResolvedValue(null);
            PatientProfessionalAssociationRepository.create.mockResolvedValue({
                id: 'new-assoc-id',
                patient_id: 'patient-id',
                nutricionist_id: 'prof-id',
                physical_educator_id: null
            });
            PatientConnectionCodeRepository.markAsUsed.mockResolvedValue({});

            const result = await PatientConnectionCodeService.connectWithCode(
                '123456',
                'prof-id',
                'Nutricionist'
            );

            expect(result.success).toBe(true);
            expect(result.patient_name).toBe('Paciente Teste');
            expect(PatientConnectionCodeRepository.markAsUsed).toHaveBeenCalledWith('code-id');
        });

        it('deve atualizar associação existente adicionando educador físico', async () => {
            const mockCode = {
                id: 'code-id',
                patient_id: 'patient-id',
                code: '123456',
                patient_name: 'Paciente Teste'
            };

            const mockAssociation = {
                id: 'assoc-id',
                patient_id: 'patient-id',
                nutricionist_id: 'nutri-id',
                physical_educator_id: null
            };

            PatientConnectionCodeRepository.findValidByCode.mockResolvedValue(mockCode);
            PatientProfessionalAssociationRepository.findByPatientId.mockResolvedValue(mockAssociation);
            PatientProfessionalAssociationRepository.update.mockResolvedValue({
                ...mockAssociation,
                physical_educator_id: 'prof-id'
            });
            PatientConnectionCodeRepository.markAsUsed.mockResolvedValue({});

            const result = await PatientConnectionCodeService.connectWithCode(
                '123456',
                'prof-id',
                'Physical_educator'
            );

            expect(result.success).toBe(true);
            expect(PatientProfessionalAssociationRepository.update).toHaveBeenCalledWith(
                'assoc-id',
                { physical_educator_id: 'prof-id' }
            );
        });

        it('deve marcar código como usado após conexão bem-sucedida', async () => {
            const mockCode = {
                id: 'code-id',
                patient_id: 'patient-id',
                code: '123456',
                patient_name: 'Paciente Teste'
            };

            PatientConnectionCodeRepository.findValidByCode.mockResolvedValue(mockCode);
            PatientProfessionalAssociationRepository.findByPatientId.mockResolvedValue(null);
            PatientProfessionalAssociationRepository.create.mockResolvedValue({});
            PatientConnectionCodeRepository.markAsUsed.mockResolvedValue({});

            await PatientConnectionCodeService.connectWithCode('123456', 'prof-id', 'Nutricionist');

            expect(PatientConnectionCodeRepository.markAsUsed).toHaveBeenCalledTimes(1);
            expect(PatientConnectionCodeRepository.markAsUsed).toHaveBeenCalledWith('code-id');
        });
    });
});
```

### Testes de Integração

#### 3. Testes de API (`PatientConnectionCode.integration.test.js`)

```javascript
import request from 'supertest';
import app from '../src/index.js'; // Seu app Express
import { pool } from '../src/config/db.js';

describe('Patient Connection Code API Integration Tests', () => {
    let patientToken;
    let nutricionistToken;
    let educatorToken;
    let patientId;
    let nutricionistId;
    let educatorId;

    beforeAll(async () => {
        // Criar usuários de teste e obter tokens
        // ... (implementar setup)
    });

    afterAll(async () => {
        // Limpar dados de teste
        await pool.end();
    });

    describe('POST /patient-connection-code/generate/:patientId', () => {
        it('deve gerar código para paciente autenticado', async () => {
            const response = await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`)
                .expect(201);

            expect(response.body).toHaveProperty('code');
            expect(response.body.code).toMatch(/^\d{6}$/);
            expect(response.body).toHaveProperty('expires_at');
            expect(response.body.used).toBe(false);
        });

        it('deve retornar 401 sem autenticação', async () => {
            await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .expect(401);
        });
    });

    describe('POST /patient-connection-code/connect', () => {
        let validCode;

        beforeEach(async () => {
            const response = await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`);
            validCode = response.body.code;
        });

        it('deve conectar nutricionista com código válido', async () => {
            const response = await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutricionistToken}`)
                .send({ code: validCode })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('patient_name');
        });

        it('deve rejeitar código expirado', async () => {
            // Aguardar 5 minutos (ou manipular data no DB)
            await pool.query(
                'UPDATE patient_connection_code SET expires_at = NOW() - INTERVAL \'1 minute\' WHERE code = $1',
                [validCode]
            );

            const response = await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutricionistToken}`)
                .send({ code: validCode })
                .expect(404);

            expect(response.body.message).toContain('inválido ou expirado');
        });

        it('deve rejeitar código já usado', async () => {
            // Primeiro uso
            await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutricionistToken}`)
                .send({ code: validCode })
                .expect(200);

            // Segundo uso
            const response = await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutricionistToken}`)
                .send({ code: validCode })
                .expect(404);

            expect(response.body.message).toContain('inválido ou expirado');
        });

        it('deve rejeitar se paciente já possui nutricionista', async () => {
            // Primeira conexão
            await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutricionistToken}`)
                .send({ code: validCode })
                .expect(200);

            // Gerar novo código
            const newCodeResponse = await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`);
            
            // Tentar conectar outro nutricionista
            const response = await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${anotherNutricionistToken}`)
                .send({ code: newCodeResponse.body.code })
                .expect(409);

            expect(response.body.message).toContain('já possui um nutricionista');
        });

        it('não deve permitir paciente usar código de conexão', async () => {
            await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${patientToken}`)
                .send({ code: validCode })
                .expect(403);
        });
    });

    describe('Logs', () => {
        it('deve registrar geração de código nos logs', async () => {
            await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`);

            const logs = await pool.query(
                'SELECT * FROM logs WHERE action = $1 ORDER BY created_at DESC LIMIT 1',
                ['GENERATE_CONNECTION_CODE']
            );

            expect(logs.rows.length).toBe(1);
            expect(logs.rows[0].log_type).toBe('CREATE');
            expect(logs.rows[0].status).toBe('SUCCESS');
        });

        it('deve registrar conexão bem-sucedida nos logs', async () => {
            const codeResponse = await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`);

            await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutricionistToken}`)
                .send({ code: codeResponse.body.code });

            const logs = await pool.query(
                'SELECT * FROM logs WHERE action = $1 ORDER BY created_at DESC LIMIT 1',
                ['CONNECT_WITH_CODE']
            );

            expect(logs.rows.length).toBe(1);
            expect(logs.rows[0].status).toBe('SUCCESS');
        });

        it('deve registrar falha de conexão nos logs', async () => {
            await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutricionistToken}`)
                .send({ code: '999999' });

            const logs = await pool.query(
                'SELECT * FROM logs WHERE action = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
                ['CONNECT_WITH_CODE', 'FAILURE']
            );

            expect(logs.rows.length).toBeGreaterThan(0);
        });
    });
});
```

### Testes de Segurança/Autorização

#### 4. Testes de Controle de Acesso (`AccessControl.test.js`)

```javascript
describe('Access Control Tests', () => {
    describe('Meal Data Access', () => {
        it('nutricionista deve acessar dados de refeição de paciente associado', async () => {
            // Conectar nutricionista ao paciente
            const codeResponse = await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`);

            await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutricionistToken}`)
                .send({ code: codeResponse.body.code });

            // Acessar dados de refeição
            await request(app)
                .get(`/meal-calendar/monthly/${patientId}/2025/1`)
                .set('Authorization', `Bearer ${nutricionistToken}`)
                .expect(200);
        });

        it('nutricionista NÃO deve acessar dados de paciente não associado', async () => {
            await request(app)
                .get(`/meal-calendar/monthly/${otherPatientId}/2025/1`)
                .set('Authorization', `Bearer ${nutricionistToken}`)
                .expect(403);
        });

        it('educador físico NÃO deve acessar dados de refeição', async () => {
            // Conectar educador ao paciente
            const codeResponse = await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`);

            await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${educatorToken}`)
                .send({ code: codeResponse.body.code });

            // Tentar acessar dados de refeição
            await request(app)
                .get(`/meal-calendar/monthly/${patientId}/2025/1`)
                .set('Authorization', `Bearer ${educatorToken}`)
                .expect(403); // Deve ser bloqueado
        });
    });

    describe('Workout Data Access', () => {
        it('educador físico deve acessar dados de treino de paciente associado', async () => {
            const codeResponse = await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`);

            await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${educatorToken}`)
                .send({ code: codeResponse.body.code });

            await request(app)
                .get(`/workout-calendar/monthly/${patientId}/2025/1`)
                .set('Authorization', `Bearer ${educatorToken}`)
                .expect(200);
        });

        it('nutricionista NÃO deve acessar dados de treino', async () => {
            const codeResponse = await request(app)
                .post(`/patient-connection-code/generate/${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`);

            await request(app)
                .post('/patient-connection-code/connect')
                .set('Authorization', `Bearer ${nutricionistToken}`)
                .send({ code: codeResponse.body.code });

            await request(app)
                .get(`/workout-calendar/monthly/${patientId}/2025/1`)
                .set('Authorization', `Bearer ${nutricionistToken}`)
                .expect(403); // Deve ser bloqueado
        });
    });

    describe('Patient Own Data Access', () => {
        it('paciente deve acessar seus próprios dados de refeição', async () => {
            await request(app)
                .get(`/meal-calendar/monthly/${patientId}/2025/1`)
                .set('Authorization', `Bearer ${patientToken}`)
                .expect(200);
        });

        it('paciente deve acessar seus próprios dados de treino', async () => {
            await request(app)
                .get(`/workout-calendar/monthly/${patientId}/2025/1`)
                .set('Authorization', `Bearer ${patientToken}`)
                .expect(200);
        });

        it('paciente NÃO deve acessar dados de outro paciente', async () => {
            await request(app)
                .get(`/meal-calendar/monthly/${otherPatientId}/2025/1`)
                .set('Authorization', `Bearer ${patientToken}`)
                .expect(403);
        });
    });
});
```

---

## 📊 RESUMO EXECUTIVO

### Status Atual
- ✅ **70% Implementado** - Funcionalidades principais estão funcionando
- ⚠️ **30% Pendente** - Controle de acesso a dados por tipo de profissional

### Riscos Identificados
1. **🔴 CRÍTICO - Segurança:** Falta controle de acesso granular por tipo de profissional
2. **🟡 MÉDIO - Auditoria:** Logs não registram tentativas de acesso não autorizado
3. **🟢 BAIXO - Usabilidade:** Cleanup manual de códigos expirados

### Próximos Passos Recomendados
1. ✅ Implementar middleware `checkPatientAccess`
2. ✅ Adicionar `professionalId` ao token JWT
3. ✅ Atualizar todas as rotas de acesso a dados
4. ✅ Implementar testes automatizados
5. ✅ Criar job scheduler para limpeza automática de códigos expirados
6. ✅ Adicionar logs de tentativas de acesso não autorizado

### Estimativa de Esforço
- Implementação das correções: **4-6 horas**
- Implementação dos testes: **6-8 horas**
- **Total: 10-14 horas**
