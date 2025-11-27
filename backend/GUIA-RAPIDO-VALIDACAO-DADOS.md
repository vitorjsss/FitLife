# 🚀 Guia Rápido - Testes de Validação de Dados (RNF2.0)

## ⚡ Execução Rápida

### **Windows (PowerShell)**
```powershell
cd C:\GP\FitLife\backend
.\test-data-validation.ps1
```

### **Linux/Mac**
```bash
cd /c/GP/FitLife/backend
chmod +x test-data-validation.sh
./test-data-validation.sh
```

### **NPM Direto**
```bash
npm test -- tests/validation/data-validation.test.js
```

---

## 📊 Métrica Avaliada

```
x = Nvalores_invalidos_detectados / Nvalores_invalidos_inseridos
```

**Meta:** x ≥ 1.0 (100%)  
**Objetivo:** Sistema deve rejeitar TODAS as entradas inválidas

---

## 🧪 O Que é Testado

| Categoria | Testes | Validações |
|-----------|--------|------------|
| ⚖️ **Peso** | 5 | Negativo, zero, < 20kg, > 300kg, formato inválido |
| 📏 **Altura** | 5 | Negativo, zero, < 50cm, > 250cm, unidade errada |
| 📐 **Circunferências** | 6 | Negativo, zero, < 10cm, > 200cm, inconsistências |
| 📊 **IMC/Percentuais** | 5 | Negativo, > 100%, < 3%, IMC < 10 ou > 60, massa > peso |
| ✔️ **Campos Obrigatórios** | 4 | Ausência de patient_id, peso, altura, data |
| 🔢 **Tipos de Dados** | 4 | UUID inválido, data inválida, boolean/array em números |
| 🔄 **Consistência** | 4 | Data futura, antiga, soma de massas, patient_id inexistente |

**Total:** 33 testes

---

## 🎯 Resultado Esperado

```
✅ Testes concluídos com sucesso!

📊 Resultado (x): 100.00%
🎯 Requisito: x ≥ 1.0 (100%)

⚖️ Peso: 5/5 detectados (100.0%)
📏 Altura: 5/5 detectados (100.0%)
📐 Circunferências: 6/6 detectados (100.0%)
📊 IMC/Percentuais: 5/5 detectados (100.0%)
✔️ Campos Obrigatórios: 4/4 detectados (100.0%)
🔢 Tipos de Dados: 4/4 detectados (100.0%)
🔄 Consistência: 4/4 detectados (100.0%)

✅ APROVADO - RNF2.0 ATENDIDO
```

---

## ⚠️ Problemas Comuns

### **1. Rota não encontrada (404)**
```javascript
// Adicionar em src/routes/index.js
const bodyMeasurementRoutes = require('./bodyMeasurementRoutes');
app.use('/body-measurement', bodyMeasurementRoutes);
```

### **2. Entradas inválidas sendo aceitas (Taxa < 100%)**
```javascript
// Implementar validação em src/middlewares/bodyMeasurementValidation.js
const { body, validationResult } = require('express-validator');

const validateBodyMeasurement = [
    body('weight')
        .isFloat({ min: 20, max: 300 })
        .withMessage('Peso entre 20 e 300 kg'),
    
    body('height')
        .isFloat({ min: 50, max: 250 })
        .withMessage('Altura entre 50 e 250 cm'),
    
    // ... outras validações
];
```

### **3. Banco de dados não conecta**
```powershell
# Iniciar Docker
docker-compose up -d db

# Verificar status
docker ps | findstr fitlife
```

### **4. Tabela BodyMeasurement não existe**
```sql
CREATE TABLE "BodyMeasurement" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES "Patient"(id),
    weight DECIMAL(5,2) NOT NULL CHECK (weight >= 20 AND weight <= 300),
    height DECIMAL(5,2) NOT NULL CHECK (height >= 50 AND height <= 250),
    body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 3 AND body_fat_percentage <= 60),
    waist_circumference DECIMAL(5,2) CHECK (waist_circumference >= 10 AND waist_circumference <= 200),
    measurement_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **5. Token JWT inválido**
```bash
# Verificar .env
cat .env | grep JWT_SECRET
```

---

## 📋 Limites de Validação

### **Medidas Antropométricas**
| Campo | Mínimo | Máximo | Unidade |
|-------|--------|--------|---------|
| Peso | 20 | 300 | kg |
| Altura | 50 | 250 | cm |
| Circunferências | 10 | 200 | cm |
| Percentual de Gordura | 3 | 60 | % |
| IMC | 10 | 60 | kg/m² |
| Massa Muscular | 10 | 100 | kg |
| Massa Óssea | 1 | 10 | kg |

### **Campos Obrigatórios**
- ✅ `patient_id` (UUID)
- ✅ `weight` (número)
- ✅ `height` (número)
- ✅ `measurement_date` (timestamp)

---

## 📊 Interpretação Rápida

### **✅ x = 100% (APROVADO)**
Sistema rejeita todas as entradas inválidas. Pronto para produção.

### **⚠️ 95% ≤ x < 100% (ATENÇÃO)**
Algumas validações falharam. Investigar:
```bash
# Ver logs detalhados
npm test -- tests/validation/data-validation.test.js --verbose
```

### **❌ x < 95% (CRÍTICO)**
Muitas validações ausentes. Implementar middleware de validação urgentemente.

---

## ⏱️ Tempo de Execução

**Estimativa:** ~25-35 segundos

- Setup inicial: ~3s
- Categoria 1 (Peso): ~4s
- Categoria 2 (Altura): ~4s
- Categoria 3 (Circunferências): ~5s
- Categoria 4 (IMC/Percentuais): ~4s
- Categoria 5 (Obrigatórios): ~3s
- Categoria 6 (Tipos): ~3s
- Categoria 7 (Consistência): ~3s
- Relatório final: ~2s
- Cleanup: ~2s

---

## 🔧 Implementação Rápida de Validações

### **Middleware Básico**
```javascript
// src/middlewares/bodyMeasurementValidation.js
const { body, validationResult } = require('express-validator');

const validateBodyMeasurement = [
    body('patient_id')
        .notEmpty().withMessage('Patient ID obrigatório')
        .isUUID().withMessage('Patient ID inválido'),
    
    body('weight')
        .notEmpty().withMessage('Peso obrigatório')
        .isFloat({ min: 20, max: 300 }).withMessage('Peso: 20-300 kg'),
    
    body('height')
        .notEmpty().withMessage('Altura obrigatória')
        .isFloat({ min: 50, max: 250 }).withMessage('Altura: 50-250 cm'),
    
    body('body_fat_percentage')
        .optional()
        .isFloat({ min: 3, max: 60 }).withMessage('Gordura: 3-60%'),
    
    body('waist_circumference')
        .optional()
        .isFloat({ min: 10, max: 200 }).withMessage('Circunferência: 10-200 cm'),
    
    body('measurement_date')
        .notEmpty().withMessage('Data obrigatória')
        .isISO8601().withMessage('Data inválida')
        .custom((value) => {
            if (new Date(value) > new Date()) {
                throw new Error('Data não pode ser futura');
            }
            return true;
        }),
    
    // Validação customizada IMC
    body('weight').custom((weight, { req }) => {
        const height = req.body.height;
        if (height) {
            const bmi = weight / Math.pow(height / 100, 2);
            if (bmi < 10 || bmi > 60) {
                throw new Error('IMC fora da faixa (10-60)');
            }
        }
        return true;
    }),
    
    // Validação massa muscular
    body('muscle_mass').optional().custom((muscle, { req }) => {
        if (muscle > req.body.weight) {
            throw new Error('Massa muscular > peso total');
        }
        return true;
    }),
    
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

### **Aplicar na Rota**
```javascript
// src/routes/bodyMeasurementRoutes.js
const { validateBodyMeasurement } = require('../middlewares/bodyMeasurementValidation');

router.post('/', 
    authMiddleware, 
    validateBodyMeasurement, 
    bodyMeasurementController.create
);

router.put('/:id', 
    authMiddleware, 
    validateBodyMeasurement, 
    bodyMeasurementController.update
);
```

---

## 📈 Monitoramento

### **Rastrear Falhas de Validação**
```sql
CREATE TABLE validation_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(100) NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    invalid_value TEXT,
    error_message TEXT,
    user_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Campos mais problemáticos (últimos 7 dias)
SELECT 
    field_name,
    COUNT(*) as failures,
    COUNT(DISTINCT user_id) as affected_users
FROM validation_failures
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY field_name
ORDER BY failures DESC;
```

---

## 🔗 Próximos Passos

Após testes aprovados:

1. **Implementar em produção** - Deploy das validações
2. **Configurar alertas** - Notificar quando taxa < 95%
3. **Dashboard de qualidade** - Monitorar métricas em tempo real
4. **Testes E2E** - Validar fluxo completo
5. **Documentação para usuários** - Mensagens de erro claras

---

## 📖 Documentação Completa

Para detalhes completos, consulte:
- 📄 `backend/docs/TESTES-VALIDACAO-DADOS.md`
- 📄 `backend/tests/validation/data-validation.test.js`
- 📄 `backend/METRICAS-QUALIDADE-RESUMO.md`

---

**Criado em:** 27/11/2025  
**Versão:** 1.0.0  
**Requisito:** RNF2.0
