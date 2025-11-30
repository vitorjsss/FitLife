# RNF2.0: Processamento Confiável no Gerenciamento de Medidas

## Visão Geral

Este documento descreve os testes automatizados para validar a eficácia das validações de dados no sistema FitLife, especificamente para o requisito RNF2.0: Processamento confiável no gerenciamento de Medidas.

## Métrica Avaliada

```
x = Nvalores_invalidos_detectados / Nvalores_invalidos_inseridos
```

Onde:**
- `Nvalores_invalidos_detectados` = Número de entradas inválidas corretamente rejeitadas pelo sistema
- `Nvalores_invalidos_inseridos` = Número total de entradas inválidas testadas

Requisito:** x ≥ 1.0 (100%)

Objetivo:** Quanto mais próximo de 1, maior a garantia de que o sistema rejeita entradas inconsistentes.

## Requisito RNF2.0

### Descrição

Ambiente:** O profissional de saúde utiliza o sistema para inserir e atualizar informações nutricionais e corporais dos pacientes.

Estímulo:** O profissional insere, atualiza ou consulta medidas nutricionais e corporais.

Resposta:** O sistema deve garantir que as informações sejam processadas corretamente, sem perda, duplicação ou inconsistências. As validações devem impedir valores implausíveis.

Medida de resposta:** A confiabilidade será avaliada pela porcentagem de entradas inválidas corretamente rejeitadas.

### Critérios de Aceitação

- O sistema deve registrar medidas nutricionais e corporais de forma consistente e íntegra
- Nenhum dado inserido deve ser perdido ou sobrescrito sem consentimento
- O sistema deve validar que valores numéricos estão dentro de limites plausíveis
- As medidas armazenadas devem ser recuperadas sem alteração ou inconsistência
- O sistema deve manter histórico das alterações para auditoria

## Estrutura dos Testes

### Arquivo de Testes**
```
backend/tests/validation/data-validation.test.js
```

### **Total de Testes: 33**

Os testes estão organizados em 7 categorias:

| Categoria | Testes | Descrição |
|-----------|--------|-----------||
| Validação de Peso | 5 | Peso negativo, zero, fora de faixa (20-300 kg), formato inválido |
| Validação de Altura | 5 | Altura negativa, zero, fora de faixa (50-250 cm), unidade errada |
| Validação de Circunferências | 6 | Circunferências negativas, zero, fora de faixa (10-200 cm), inconsistências |
| Validação de IMC e Percentuais | 5 | Percentuais negativos, acima de 100%, IMC implausível, massa > peso |
| Validação de Campos Obrigatórios | 4 | Ausência de patient_id, peso, altura, data |
| Validação de Tipos de Dados | 4 | UUID inválido, data inválida, boolean/array em campos numéricos |
| Validação de Consistência | 4 | Data futura, data antiga, soma de massas > peso, patient_id inexistente |

## Detalhamento dos Testes

### Categoria 1: Validação de Peso

Garante que apenas valores plausíveis de peso sejam aceitos.

#### Teste 1.1 - Rejeitar peso negativo
```javascript
POST /body-measurement
{
  "weight": -70.5,  // Negativo
  "height": 175
}
```
Esperado:** Status 400 ou 422

#### Teste 1.2 - Rejeitar peso zero
```javascript
{ "weight": 0 }  // Zero não é válido
```

#### Teste 1.3 - Rejeitar peso abaixo do mínimo
```javascript
{ "weight": 15 }  // Abaixo de 20 kg
```
Limite mínimo:** 20 kg

#### Teste 1.4 - Rejeitar peso acima do máximo
```javascript
{ "weight": 350 }  // Acima de 300 kg
```
Limite máximo:** 300 kg

#### Teste 1.5 - Rejeitar formato inválido
```javascript
{ "weight": "setenta kilos" }  // String ao invés de número
```

### Categoria 2: Validação de Altura

#### Teste 2.1 - Rejeitar altura negativa**
```javascript
{ "height": -175 }  // Negativo
```

#### Teste 2.2 - Rejeitar altura zero**
```javascript
{ "height": 0 }  // Zero
```

#### Teste 2.3 - Rejeitar altura abaixo do mínimo**
```javascript
{ "height": 30 }  // Abaixo de 50 cm
```
Limite mínimo:** 50 cm

#### Teste 2.4 - Rejeitar altura acima do máximo**
```javascript
{ "height": 300 }  // Acima de 250 cm
```
Limite máximo:** 250 cm

#### Teste 2.5 - Rejeitar unidade errada (metros)**
```javascript
{ "height": 1.75 }  // Deveria ser 175 cm
```
Nota:** Sistema espera altura em centímetros, não metros.

### Categoria 3: Validação de Circunferências

#### Campos Testados:
- `waist_circumference` (cintura)
- `hip_circumference` (quadril)
- `arm_circumference` (braço)
- `thigh_circumference` (coxa)
- `calf_circumference` (panturrilha)

#### Teste 3.1 - Circunferência negativa**
```javascript
{ "waist_circumference": -80 }  // Negativo
```

#### Teste 3.2 - Circunferência muito baixa**
```javascript
{ "hip_circumference": 5 }  // Abaixo de 10 cm
```

#### Teste 3.3 - Circunferência muito alta**
```javascript
{ "arm_circumference": 250 }  // Acima de 200 cm
```

#### Teste 3.4 - Circunferência negativa (coxa)**
```javascript
{ "thigh_circumference": -45 }  // Negativo
```

#### Teste 3.5 - Circunferência zero**
```javascript
{ "calf_circumference": 0 }  // Zero
```

#### Teste 3.6 - Inconsistência anatômica**
```javascript
{
  "waist_circumference": 100,
  "hip_circumference": 80  // Cintura > Quadril (implausível)
}
```

Limites:** 10 cm - 200 cm para todas as circunferências

### Categoria 4: Validação de IMC e Percentuais

#### Teste 4.1 - Percentual de gordura negativo**
```javascript
{ "body_fat_percentage": -15 }  // Negativo
```

#### Teste 4.2 - Percentual acima de 100%**
```javascript
{ "body_fat_percentage": 120 }  // > 100%
```

#### Teste 4.3 - Percentual muito baixo**
```javascript
{ "body_fat_percentage": 1 }  // Abaixo de 3%
```
Limite mínimo:** 3% (essencial para sobrevivência)

#### Teste 4.4 - IMC implausível**
```javascript
{ "weight": 10, "height": 175 }  // IMC = 3.27 ❌
```
Limites de IMC:** 10 - 60 kg/m²

#### Teste 4.5 - Massa muscular maior que peso**
```javascript
{
  "weight": 70,
  "muscle_mass": 80  // Impossível
}
```

### Categoria 5: Validação de Campos Obrigatórios

#### Teste 5.1 - Ausência de patient_id**
```javascript
{
  "weight": 70,
  "height": 175
  // patient_id ausente
}
```

#### Teste 5.2 - Ausência de peso**
```javascript
{
  "patient_id": "uuid",
  "height": 175
  // weight ausente
}
```

#### Teste 5.3 - Ausência de altura**
```javascript
{
  "patient_id": "uuid",
  "weight": 70
  // height ausente
}
```

#### Teste 5.4 - Ausência de data**
```javascript
{
  "patient_id": "uuid",
  "weight": 70,
  "height": 175
  // measurement_date ausente
}
```

### Categoria 7: Validação de Consistência
```javascript
{ "patient_id": "abc123" }  // Não é UUID
```

#### Teste 6.2 - Data inválida**
```javascript
{ "measurement_date": "30/02/2025" }  // Fevereiro não tem 30 dias
```

#### Teste 6.3 - Boolean em campo numérico**
```javascript
{ "weight": true }  // Boolean ao invés de número
```

#### Teste 6.4 - Array em campo simples**
```javascript
{ "weight": [70, 75] }  // Array ao invés de número
```



### **7️⃣ Categoria 7: Validação de Consistência**

#### Teste 7.1 - Data futura**
```javascript
{ "measurement_date": "2026-12-31" }  // No futuro
```

#### Teste 7.2 - Data muito antiga**
```javascript
{ "measurement_date": "1870-01-01" }  // Mais de 150 anos
```

#### Teste 7.3 - Soma de massas > peso**
```javascript
{
  "weight": 70,
  "muscle_mass": 50,
  "bone_mass": 5,
  "body_fat_percentage": 30  // Fat = 21kg
  // Total = 50 + 5 + 21 = 76kg > 70kg ❌
}
```

#### Teste 7.4 - Patient_id inexistente**
```javascript
{ "patient_id": "00000000-0000-0000-0000-000000000000" }  // Não existe
```

## Como Executar

### Opção 1: PowerShell (Windows)
```powershell
cd C:\GP\FitLife\backend
.\test-data-validation.ps1
```

### Opção 2: Bash (Linux/Mac)**
```bash
cd /c/GP/FitLife/backend
chmod +x test-data-validation.sh
./test-data-validation.sh
```

### Opção 3: NPM Direto**
```bash
npm test -- tests/validation/data-validation.test.js
```

### Opção 4: Modo Verbose**
```bash
npm test -- tests/validation/data-validation.test.js --verbose --colors
```



## Interpretação dos Resultados

### **Exemplo de Saída**

```
RELATÓRIO FINAL - VALIDAÇÃO DE DADOS PLAUSÍVEIS (RNF2.0)

═══════════════════════════════════════════════════════════════════════
  ESTATÍSTICAS GERAIS
═══════════════════════════════════════════════════════════════════════

Total de Entradas Inválidas Testadas: 33
Detectadas e Rejeitadas: 33
Não Detectadas (passaram): 0

═══════════════════════════════════════════════════════════════════════
  MÉTRICA PRINCIPAL
═══════════════════════════════════════════════════════════════════════

Fórmula: x = Ndetectados / Ntotal
Resultado (x): 100.00%
Requisito: x ≥ 1.0 (100%)

═══════════════════════════════════════════════════════════════════════
  ESTATÍSTICAS POR CATEGORIA
═══════════════════════════════════════════════════════════════════════

Peso:
   Total: 5 | Detectados: 5 | Taxa: 100.0%
Altura:
   Total: 5 | Detectados: 5 | Taxa: 100.0%
Circunferências:
   Total: 6 | Detectados: 6 | Taxa: 100.0%
IMC/Percentuais:
   Total: 5 | Detectados: 5 | Taxa: 100.0%
Campos Obrigatórios:
   Total: 4 | Detectados: 4 | Taxa: 100.0%
Tipos de Dados:
   Total: 4 | Detectados: 4 | Taxa: 100.0%
Consistência:
   Total: 4 | Detectados: 4 | Taxa: 100.0%

═══════════════════════════════════════════════════════════════════════
  AVALIAÇÃO FINAL
═══════════════════════════════════════════════════════════════════════

APROVADO - Taxa de Detecção: ATENDE (100%)
RNF2.0 ATENDIDO - Sistema rejeita todas as entradas inválidas
```

### **Critérios de Avaliação**

| Resultado | Status | Ação Necessária |
|-----------|--------|---------------|
| x = 1.0 (100%) | APROVADO | Nenhuma. Sistema validando corretamente. |
| 0.95 ≤ x < 1.0 | ATENÇÃO | Investigar validações que falharam. Algumas entradas inválidas estão passando. |
| x < 0.95 | REPROVADO | Crítico. Implementar validações ausentes imediatamente. |

## Troubleshooting

### Problema 1: "Cannot POST /body-measurement"

Causa:** Rota não existe ou não está registrada.

Solução:**
```javascript
// src/routes/index.js
const bodyMeasurementRoutes = require('./bodyMeasurementRoutes');
app.use('/body-measurement', bodyMeasurementRoutes);
```

### Problema 2: Entradas inválidas sendo aceitas (Taxa < 100%)

Causa:** Validações não implementadas no backend.

Solução:** Implementar middleware de validação:

```javascript
// src/middlewares/bodyMeasurementValidation.js
const { body, validationResult } = require('express-validator');

const validateBodyMeasurement = [
    body('patient_id')
        .notEmpty().withMessage('Patient ID é obrigatório')
        .isUUID().withMessage('Patient ID deve ser um UUID válido'),
    
    body('weight')
        .notEmpty().withMessage('Peso é obrigatório')
        .isFloat({ min: 20, max: 300 }).withMessage('Peso deve estar entre 20 e 300 kg'),
    
    body('height')
        .notEmpty().withMessage('Altura é obrigatória')
        .isFloat({ min: 50, max: 250 }).withMessage('Altura deve estar entre 50 e 250 cm'),
    
    body('body_fat_percentage')
        .optional()
        .isFloat({ min: 3, max: 60 }).withMessage('Percentual de gordura entre 3% e 60%'),
    
    body('waist_circumference')
        .optional()
        .isFloat({ min: 10, max: 200 }).withMessage('Circunferência entre 10 e 200 cm'),
    
    // ... outras validações
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = { validateBodyMeasurement };
```

Aplicar na rota:**
```javascript
// src/routes/bodyMeasurementRoutes.js
const { validateBodyMeasurement } = require('../middlewares/bodyMeasurementValidation');

router.post('/', authMiddleware, validateBodyMeasurement, bodyMeasurementController.create);
```

### Problema 3: "autenticação falhou para o usuário"

Causa:** PostgreSQL não está aceitando conexões.

Solução:**
```bash
# Reiniciar Docker
docker-compose restart db

# Verificar logs
docker-compose logs db

# Verificar pg_hba.conf
docker exec -it fitlife-db-1 cat /var/lib/postgresql/data/pg_hba.conf
```

### Problema 4: Tabela BodyMeasurement não existe

Causa:** Migração não executada.

Solução:**
```sql
-- db-init/init.sql
CREATE TABLE IF NOT EXISTS "BodyMeasurement" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES "Patient"(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL CHECK (weight >= 20 AND weight <= 300),
    height DECIMAL(5,2) NOT NULL CHECK (height >= 50 AND height <= 250),
    waist_circumference DECIMAL(5,2) CHECK (waist_circumference >= 10 AND waist_circumference <= 200),
    hip_circumference DECIMAL(5,2) CHECK (hip_circumference >= 10 AND hip_circumference <= 200),
    arm_circumference DECIMAL(5,2) CHECK (arm_circumference >= 10 AND arm_circumference <= 200),
    thigh_circumference DECIMAL(5,2) CHECK (thigh_circumference >= 10 AND thigh_circumference <= 200),
    calf_circumference DECIMAL(5,2) CHECK (calf_circumference >= 10 AND calf_circumference <= 200),
    body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 3 AND body_fat_percentage <= 60),
    muscle_mass DECIMAL(5,2) CHECK (muscle_mass >= 10 AND muscle_mass <= 100),
    bone_mass DECIMAL(4,2) CHECK (bone_mass >= 1 AND bone_mass <= 10),
    bmi DECIMAL(4,2) GENERATED ALWAYS AS (weight / POWER(height / 100, 2)) STORED,
    measurement_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bodymeasurement_patient_id ON "BodyMeasurement"(patient_id);
CREATE INDEX idx_bodymeasurement_date ON "BodyMeasurement"(measurement_date);
```

### Problema 5: Validação IMC não funciona

Causa:** IMC calculado automaticamente no banco, não validado na entrada.

Solução:** Adicionar validação customizada:

```javascript
// Middleware customizado
body('weight').custom((weight, { req }) => {
    const height = req.body.height;
    if (height) {
        const bmi = weight / Math.pow(height / 100, 2);
        if (bmi < 10 || bmi > 60) {
            throw new Error('IMC calculado está fora da faixa plausível (10-60)');
        }
    }
    return true;
});
```

## Integração CI/CD

### GitHub Actions

```yaml
name: Data Validation Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-data-validation:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: fitlife
          POSTGRES_PASSWORD: fitlife
          POSTGRES_DB: fitlife_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5433:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: backend
        run: npm ci
      
      - name: Run migrations
        working-directory: backend
        run: npm run migrate
        env:
          DB_HOST: localhost
          DB_PORT: 5433
          DB_USER: fitlife
          DB_PASSWORD: fitlife
          DB_NAME: fitlife_test
      
      - name: Run Data Validation Tests
        working-directory: backend
        run: npm test -- tests/validation/data-validation.test.js --coverage
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5433
          JWT_SECRET: test_secret_key
      
      - name: Check validation threshold
        run: |
          if [ ${{ job.status }} != 'success' ]; then
            echo "Data validation tests failed!"
            exit 1
          fi
          echo "All invalid inputs correctly rejected!"
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: backend/coverage/lcov.info
          flags: data-validation
```

## Monitoramento de Validações

### Logs de Validação

Criar tabela para rastrear validações falhadas:

```sql
CREATE TABLE validation_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(100) NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    invalid_value TEXT,
    error_message TEXT,
    user_id UUID,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_validation_failures_endpoint ON validation_failures(endpoint);
CREATE INDEX idx_validation_failures_field ON validation_failures(field_name);
CREATE INDEX idx_validation_failures_created_at ON validation_failures(created_at);
```

### Consultas de Monitoramento**

```sql
-- Top 5 campos com mais validações falhadas
SELECT 
    field_name,
    COUNT(*) as failure_count,
    COUNT(DISTINCT user_id) as affected_users
FROM validation_failures
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY field_name
ORDER BY failure_count DESC
LIMIT 5;

-- Taxa de validação por endpoint (últimos 7 dias)
SELECT 
    endpoint,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END) as failed_validations,
    ROUND(100.0 * SUM(CASE WHEN error_message IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM validation_failures
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY endpoint;
```

## Referências

- RNF2.0: Processamento confiável no gerenciamento de Medidas
- Arquivo de testes: `backend/tests/validation/data-validation.test.js.disabled`
- Scripts de execução: `backend/test-data-validation.ps1`, `backend/test-data-validation.sh`

> **Nota de Atualização (29/11/2025):** Os testes de validação de dados foram temporariamente desabilitados pois testavam validações que deveriam ser implementadas nas rotas/controllers, não diretamente no banco de dados. As validações de domínio reais estão implementadas através de constraints no PostgreSQL (ver `backend/db-init/init.sql`). Os testes serão refatorados para validar as regras de negócio nas camadas apropriadas da aplicação.

Última atualização: 29/11/2025  
Versão: 1.1.0  
Requisito: RNF2.0
