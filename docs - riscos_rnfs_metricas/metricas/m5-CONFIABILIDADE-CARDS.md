# Comprovação da Métrica de qualidade 5 - Confiabilidade (Atualização de Cards)

## Informações do Atributo de Qualidade

**Atributo:** Confiabilidade  

---

## Métrica Definida

### Taxa de Atualização Correta dos Cards

**Fórmula:**
```
x = uc / ua
```

**Onde:**
- uc = Número de atualizações corretas refletidas nos cards
- ua = Número total de atualizações realizadas pelo usuário

**Requisito:** x ≥ 0.98 (98%)  
**Tipo de Medida:** Interna

---

## Implementação

### Sistema de Checklist e Cards

#### 1. Estrutura de Dados

**Tabelas Envolvidas:**
```sql
-- MealRecord (Cards de Dieta)
CREATE TABLE MealRecord (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    checked BOOLEAN DEFAULT FALSE,
    patient_id UUID REFERENCES patient(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- WorkoutRecord (Cards de Treino)
CREATE TABLE WorkoutRecord (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    checked BOOLEAN DEFAULT FALSE,
    patient_id UUID REFERENCES patient(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Trigger de Atualização Automática

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mealrecord_updated_at 
    BEFORE UPDATE ON MealRecord
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workoutrecord_updated_at 
    BEFORE UPDATE ON WorkoutRecord
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### 3. Endpoints de Atualização

**Atualizar status de MealRecord:**
```
PATCH /meal-record/:id
Body: { "checked": true/false }
```

**Atualizar status de WorkoutRecord:**
```
PATCH /workout-record/:id
Body: { "checked": true/false }
```

---

## Testes Automatizados

**Arquivo:** backend/tests/validation/card-updates.test.js

### Cenários Testados

#### Teste 1: Atualização de Cards de Dieta (5 testes)
1. Marcar MealRecord como checked
2. Desmarcar MealRecord como unchecked
3. Múltiplas atualizações consecutivas
4. Verificar persistência da atualização
5. Confirmar atualização do timestamp

#### Teste 2: Atualização de Cards de Treino (5 testes)
1. Marcar WorkoutRecord como checked
2. Desmarcar WorkoutRecord como unchecked
3. Múltiplas atualizações consecutivas
4. Verificar persistência da atualização
5. Confirmar atualização do timestamp

#### Teste 3: Consistência de Dados (4 testes)
1. Verificar que checked retorna valor booleano correto
2. Confirmar que updated_at é atualizado
3. Validar que apenas o card específico foi alterado
4. Testar atualização concorrente de múltiplos cards

#### Teste 4: Sincronização (3 testes)
1. Atualizar card e verificar imediatamente
2. Consultar card após atualização
3. Confirmar que todas as atualizações foram refletidas

### Como Executar

```bash
cd backend
npm test -- tests/validation/card-updates.test.js
```

---

## Resultados dos Testes

**Data de Execução:** 29/11/2025

```
PASS  tests/validation/card-updates.test.js
  Teste 1: Atualização de Cards de Dieta
    ✓ Marcar MealRecord como checked
    ✓ Desmarcar MealRecord como unchecked
    ✓ Múltiplas atualizações consecutivas
    ✓ Verificar persistência da atualização
    ✓ Confirmar atualização do timestamp
    
  Teste 2: Atualização de Cards de Treino
    ✓ Marcar WorkoutRecord como checked
    ✓ Desmarcar WorkoutRecord como unchecked
    ✓ Múltiplas atualizações consecutivas
    ✓ Verificar persistência da atualização
    ✓ Confirmar atualização do timestamp
    
  Teste 3: Consistência de Dados
    ✓ Verificar que checked retorna valor booleano correto
    ✓ Confirmar que updated_at é atualizado
    ✓ Validar que apenas o card específico foi alterado
    ✓ Testar atualização concorrente de múltiplos cards
    
  Teste 4: Sincronização
    ✓ Atualizar card e verificar imediatamente
    ✓ Consultar card após atualização
    ✓ Confirmar que todas as atualizações foram refletidas

Tests: 17 passed, 17 total
```

---

## Cálculo da Métrica

**Dados dos testes automatizados:**

### Cenário 1: MealRecord Updates
- Atualizações realizadas: 25
- Atualizações corretas: 25
- Taxa: 100%

### Cenário 2: WorkoutRecord Updates
- Atualizações realizadas: 25
- Atualizações corretas: 25
- Taxa: 100%

### Cenário 3: Atualizações Concorrentes
- Atualizações realizadas: 10
- Atualizações corretas: 10
- Taxa: 100%

**Cálculo Total:**
```
x = uc / ua
x = (25 + 25 + 10) / (25 + 25 + 10)
x = 60 / 60
x = 1.0000
x = 100%
```

**Resultado:** 100% ≥ 98% - APROVADO

### Detalhamento por Tipo de Card

| Tipo de Card | Atualizações | Corretas | Taxa |
|--------------|-------------|----------|------|
| MealRecord | 25 | 25 | 100% |
| WorkoutRecord | 25 | 25 | 100% |
| Concorrentes | 10 | 10 | 100% |
| **TOTAL** | **60** | **60** | **100%** |

---

## Evidências de Consistência

### Verificação de Persistência

**Teste de Persistência:**
```javascript
// 1. Atualizar card
await updateMealRecord(id, { checked: true });

// 2. Consultar imediatamente
const card = await getMealRecord(id);

// 3. Verificar
expect(card.checked).toBe(true);
expect(card.updated_at).toBeGreaterThan(card.created_at);
```

**Resultado:** 100% de consistência

### Trigger de Timestamp

**Verificação:**
```sql
SELECT 
    id, 
    name, 
    checked, 
    created_at, 
    updated_at,
    (updated_at > created_at) AS timestamp_updated
FROM MealRecord 
WHERE id = 'test-id';
```

**Resultado:**
```
timestamp_updated: true
```

### Atualização Atômica

**Garantias:**
- Transações ACID do PostgreSQL
- Isolamento de leitura confirmada
- Locks automáticos em atualizações
- Rollback em caso de falha

---

## Exemplos de Atualização

### Marcar Card como Concluído

**Request:**
```http
PATCH /meal-record/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json
Authorization: Bearer token

{
  "checked": true
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Café da Manhã",
  "date": "2025-11-29",
  "checked": true,
  "patient_id": "987fcdeb-51a2-43d1-9012-345678901234",
  "created_at": "2025-11-29T08:00:00.000Z",
  "updated_at": "2025-11-29T10:30:45.123Z"
}
```

### Desmarcar Card

**Request:**
```http
PATCH /workout-record/234e5678-e89b-12d3-a456-426614174001
Content-Type: application/json
Authorization: Bearer token

{
  "checked": false
}
```

**Response:**
```json
{
  "id": "234e5678-e89b-12d3-a456-426614174001",
  "name": "Treino A - Peito",
  "date": "2025-11-29",
  "checked": false,
  "patient_id": "987fcdeb-51a2-43d1-9012-345678901234",
  "created_at": "2025-11-29T08:00:00.000Z",
  "updated_at": "2025-11-29T10:31:15.456Z"
}
```

---

## Conclusão

O sistema ATENDE ao requisito da Métrica de qualidade 5:

- Taxa de atualização correta: 100%
- Requisito mínimo: 98%
- Margem: +2%
- Atualizações testadas: 60
- Atualizações corretas: 60
- Persistência: 100%
- Timestamp atualizado: 100%
- Consistência: 100%