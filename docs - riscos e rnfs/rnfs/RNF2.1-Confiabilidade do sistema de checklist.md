# RNF2.1: Confiabilidade do Sistema de Checklist

## Visão Geral

Este documento detalha os testes automatizados implementados para validar o RNF2.1: Processamento Inteligente dos Cards com Checklist, garantindo que o sistema atende aos requisitos de confiabilidade estabelecidos.

## Métrica Principal

### Taxa de Atualização Correta dos Cards

**Fórmula:**
```
x = uc / ua

onde:
  uc = número de atualizações corretas refletidas nos cards
  ua = número total de atualizações realizadas pelo usuário
```

**Requisito:**
- **x ≥ 0,98 (98%)**

**Interpretação:**
- Se x ≥ 0,98: Sistema ATENDE ao requisito de confiabilidade
- Se x < 0,98: Sistema NÃO ATENDE ao requisito

Quanto mais próximo de 1 (100%), mais consistente e confiável é o processamento dos checklists. Valores baixos indicam falhas na sincronização em tempo real ou problemas de persistência.

## Critérios de Aceitação (RNF2.1)

### 1. Atualização em Tempo Real
**Requisito:** O sistema deve atualizar em tempo real o status dos cards quando o usuário marcar ou desmarcar uma atividade.

**Testes Implementados:**
- Criação de WorkoutRecord com status inicial correto
- Marcação de WorkoutRecord como concluído
- Desmarcação de WorkoutRecord
- Criação de MealRecord com status inicial correto
- Marcação de MealRecord como concluído
- Teste de concorrência (10 atualizações rápidas)

### 2. Reflexão Visual do Estado
**Requisito:** Cada card deve refletir visualmente o estado atual: cinza para pendente e verde para concluído.

**Testes Implementados:**
- Verificação de estado "pendente" (checked = false → cinza)
- Verificação de estado "concluído" (checked = true → verde)
- Consistência visual em lote (5 registros)

### 3. Persistência dos Dados
**Requisito:** O sistema deve garantir que os dados de checklist sejam armazenados de forma persistente, mesmo após logout ou falha de conexão.

**Testes Implementados:**
- Persistência após múltiplas atualizações
- Integridade referencial (Foreign Keys)
- Persistência de timestamps (created_at, updated_at)

### 4. Histórico de Marcações
**Requisito:** O usuário deve conseguir visualizar o histórico de marcações realizadas durante o dia.

**Testes Implementados:**
- Busca de registros por data
- Ordenação cronológica do histórico
- Preservação do histórico após atualizações

### 5. Tratamento de Erros
**Requisito:** Em caso de erro de processamento, o sistema deve exibir uma mensagem clara.

**Testes Implementados:**
- Tentativa de atualização com ID inválido
- Tentativa de criar registro sem campos obrigatórios
- Rollback em caso de transação falhada

## Como Executar os Testes

### Pré-requisitos

1. **Node.js** instalado (v14 ou superior)
2. **PostgreSQL** rodando e acessível
3. **Variáveis de ambiente** configuradas (`.env`)
4. **Dependências** instaladas (`npm install`)

### Opção 1: Script PowerShell (Windows)

```powershell
cd C:\GP\FitLife\backend
.\test-checklist-reliability.ps1
```

### Opção 2: Script Bash (Linux/Mac)

```bash
cd /path/to/FitLife/backend
chmod +x test-checklist-reliability.sh
./test-checklist-reliability.sh
```

### Opção 3: NPM Direto

```bash
cd backend
npm test -- tests/validation/checklist-reliability.test.js --verbose --colors
```

### Opção 4: Jest Watch Mode (Desenvolvimento)

```bash
npm test -- tests/validation/checklist-reliability.test.js --watch
```

## Detalhamento dos Testes

### Teste 1: Atualização em Tempo Real (6 testes)

| # | Descrição | O que valida |
|---|-----------|--------------|
| 1.1 | Criar WorkoutRecord com status inicial | Status "pendente" ao criar |
| 1.2 | Marcar WorkoutRecord como concluído | Transição pendente → concluído |
| 1.3 | Desmarcar WorkoutRecord | Transição concluído → pendente |
| 1.4 | Criar MealRecord com status inicial | Status "pendente" ao criar |
| 1.5 | Marcar MealRecord como concluído | Transição pendente → concluído |
| 1.6 | Múltiplas atualizações rápidas | Concorrência e race conditions |

### Teste 2: Reflexão Visual (3 testes)

| # | Descrição | O que valida |
|---|-----------|--------------|
| 2.1 | Estado "pendente" | checked = false → cinza |
| 2.2 | Estado "concluído" | checked = true → verde |
| 2.3 | Consistência visual em lote | 5 registros com estados diferentes |

### Teste 3: Persistência (3 testes)

| # | Descrição | O que valida |
|---|-----------|--------------|
| 3.1 | Múltiplas atualizações | Dados mantidos após várias mudanças |
| 3.2 | Integridade referencial | Foreign keys válidas (patient_id) |
| 3.3 | Timestamps | created_at e updated_at corretos |

### Teste 4: Histórico (3 testes)

| # | Descrição | O que valida |
|---|-----------|--------------|
| 4.1 | Busca por data | Filtro de registros funcionando |
| 4.2 | Ordenação cronológica | Histórico ordenado por data |
| 4.3 | Preservação | Histórico não é deletado ao atualizar |

### Teste 5: Tratamento de Erros (3 testes)

| # | Descrição | O que valida |
|---|-----------|--------------|
| 5.1 | ID inválido | Sistema não quebra com UUID inválido |
| 5.2 | Campos obrigatórios | Validação de patient_id |
| 5.3 | Rollback de transação | Dados revertidos em caso de erro |

## Troubleshooting

### Problema: "Cannot connect to database"

**Solução:**
1. Verificar se o PostgreSQL está rodando
2. Conferir variáveis de ambiente no `.env`
3. Testar conexão manual: `psql -U postgres -d fitlife`

### Problema: "Tests timing out"

**Solução:**
1. Aumentar timeout no Jest:
```javascript
jest.setTimeout(30000); // 30 segundos
```
2. Verificar performance do banco de dados
3. Reduzir número de testes de concorrência

### Problema: "Foreign key constraint violation"

**Solução:**
1. Verificar se tabelas existem (patient, auth, WorkoutRecord, MealRecord)
2. Executar migrations: `npm run migrate`
3. Verificar schema no banco: `\d+ WorkoutRecord`

### Problema: "Tests pass but metric is < 98%"

**Solução:**
1. Verificar logs detalhados: buscar por `✗ Falha`
2. Analisar qual categoria está falhando
3. Executar teste específico:
```bash
npm test -- tests/validation/checklist-reliability.test.js --testNamePattern="Atualização em Tempo Real"
```

## Checklist de Validação

Antes de considerar o RNF2.1 como concluído, verifique:

- Taxa de atualização correta ≥ 98%
- Todos os 18 testes passando
- Tempo de resposta < 500ms por atualização
- Zero race conditions detectadas
- Integridade referencial 100%
- Rollback funcionando corretamente
- Mensagens de erro claras e úteis
- Logs de auditoria gerados
- Performance aceitável com carga

## Integração Contínua

### GitHub Actions (exemplo)

```yaml
name: Checklist Reliability Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: fitlife_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run checklist reliability tests
        run: npm test -- tests/validation/checklist-reliability.test.js
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: postgres
          DB_PASSWORD: postgres
          DB_NAME: fitlife_test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: test-results/
```