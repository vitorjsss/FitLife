# 📋 Testes de Confiabilidade do Sistema de Checklist (RNF2.1)

## 📊 Visão Geral

Este documento detalha os testes automatizados implementados para validar o **RNF2.1: Processamento Inteligente dos Cards com Checklist**, garantindo que o sistema atende aos requisitos de confiabilidade estabelecidos.

## 🎯 Métrica Principal

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
- Se x ≥ 0,98: ✅ Sistema **ATENDE** ao requisito de confiabilidade
- Se x < 0,98: ❌ Sistema **NÃO ATENDE** ao requisito

Quanto mais próximo de 1 (100%), mais consistente e confiável é o processamento dos checklists. Valores baixos indicam falhas na sincronização em tempo real ou problemas de persistência.

## 📋 Critérios de Aceitação (RNF2.1)

### 1. Atualização em Tempo Real ⏱️
**Requisito:** O sistema deve atualizar em tempo real o status dos cards quando o usuário marcar ou desmarcar uma atividade.

**Testes Implementados:**
- ✅ Criação de WorkoutRecord com status inicial correto
- ✅ Marcação de WorkoutRecord como concluído
- ✅ Desmarcação de WorkoutRecord
- ✅ Criação de MealRecord com status inicial correto
- ✅ Marcação de MealRecord como concluído
- ✅ Teste de concorrência (10 atualizações rápidas)

### 2. Reflexão Visual do Estado 🎨
**Requisito:** Cada card deve refletir visualmente o estado atual: cinza para pendente e verde para concluído.

**Testes Implementados:**
- ✅ Verificação de estado "pendente" (checked = false → cinza)
- ✅ Verificação de estado "concluído" (checked = true → verde)
- ✅ Consistência visual em lote (5 registros)

### 3. Persistência dos Dados 💾
**Requisito:** O sistema deve garantir que os dados de checklist sejam armazenados de forma persistente, mesmo após logout ou falha de conexão.

**Testes Implementados:**
- ✅ Persistência após múltiplas atualizações
- ✅ Integridade referencial (Foreign Keys)
- ✅ Persistência de timestamps (created_at, updated_at)

### 4. Histórico de Marcações 📜
**Requisito:** O usuário deve conseguir visualizar o histórico de marcações realizadas durante o dia.

**Testes Implementados:**
- ✅ Busca de registros por data
- ✅ Ordenação cronológica do histórico
- ✅ Preservação do histórico após atualizações

### 5. Tratamento de Erros ⚠️
**Requisito:** Em caso de erro de processamento, o sistema deve exibir uma mensagem clara.

**Testes Implementados:**
- ✅ Tentativa de atualização com ID inválido
- ✅ Tentativa de criar registro sem campos obrigatórios
- ✅ Rollback em caso de transação falhada

## 🚀 Como Executar os Testes

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

## 📊 Exemplo de Saída

```
═══════════════════════════════════════════════════════════════════════════════
  INICIALIZANDO TESTES DE CONFIABILIDADE DO CHECKLIST (RNF2.1)
═══════════════════════════════════════════════════════════════════════════════

▶ Criando Dados de Teste
────────────────────────────────────────────────────────────────────────────────
  ✓ Auth criado: 364679a6-3006-4081-85ba-9dddf698f9b1
  ✓ Patient criado: 16a9cfea-a3ed-4195-a4bf-96a0dc5ca214
  ✓ Token JWT gerado
  ℹ Setup concluído com sucesso!


▶ TESTE 1: Atualização em Tempo Real
────────────────────────────────────────────────────────────────────────────────
  ✓ WorkoutRecord criado com status inicial correto (pendente)
  ✓ WorkoutRecord marcado como concluído com sucesso
  ✓ WorkoutRecord desmarcado com sucesso
  ✓ MealRecord criado com status inicial correto (pendente)
  ✓ MealRecord marcado como concluído com sucesso
  ✓ Teste de concorrência: 10/10 atualizações corretas (100.00%)


▶ TESTE 2: Reflexão Visual do Estado
────────────────────────────────────────────────────────────────────────────────
  ✓ Estado visual correto: cinza (pendente)
  ✓ Estado visual correto: verde (concluído)
  ✓ Consistência visual: 5/5 registros corretos (100%)


▶ TESTE 3: Persistência dos Dados
────────────────────────────────────────────────────────────────────────────────
  ✓ Persistência mantida após múltiplas atualizações: checked = false
  ✓ Integridade referencial mantida (Foreign Key válida)
  ✓ Timestamps persistidos corretamente


▶ TESTE 4: Histórico de Marcações
────────────────────────────────────────────────────────────────────────────────
  ✓ Histórico recuperado: 8 registros encontrados para 27/11/2025
  ✓ Histórico ordenado cronologicamente (8 registros)
  ✓ Histórico preservado: 8 registros mantidos após atualização


▶ TESTE 5: Tratamento de Erros
────────────────────────────────────────────────────────────────────────────────
  ✓ Atualização com ID inválido tratada sem crash
  ✓ Erro capturado corretamente: campo obrigatório faltando (patient_id)
  ✓ Rollback executado corretamente: dados revertidos após erro


═══════════════════════════════════════════════════════════════════════════════
  RELATÓRIO FINAL - MÉTRICAS DE CONFIABILIDADE
═══════════════════════════════════════════════════════════════════════════════

▶ Estatísticas Gerais
────────────────────────────────────────────────────────────────────────────────
  📊 Total de atualizações testadas (ua): 18
  📊 Atualizações corretas (uc): 18
  📊 Atualizações falhadas: 0

▶ Taxa de Atualização Correta dos Cards (Métrica Principal)
────────────────────────────────────────────────────────────────────────────────
  📊 Fórmula: x = uc / ua
  📊 Cálculo: 18 / 18
  📊 Resultado (x): 100.00%
  📊 Requisito: ≥ 98%

  ✓ APROVADO - Taxa de Atualização Correta: ATENDE (≥ 98%)

▶ Métricas Detalhadas por Categoria
────────────────────────────────────────────────────────────────────────────────

  🔄 Atualização em Tempo Real:
  📊   Testes realizados: 6
  📊   Testes bem-sucedidos: 6
  📊   Taxa de sucesso: 100.00%

  🎨 Reflexão Visual do Estado:
  📊   Testes realizados: 3
  📊   Testes bem-sucedidos: 3
  📊   Taxa de sucesso: 100.00%

  💾 Persistência dos Dados:
  📊   Testes realizados: 3
  📊   Testes bem-sucedidos: 3
  📊   Taxa de sucesso: 100.00%

  📜 Histórico de Marcações:
  📊   Testes realizados: 3
  📊   Testes bem-sucedidos: 3
  📊   Taxa de sucesso: 100.00%

  ⚠️ Tratamento de Erros:
  📊   Testes realizados: 3
  📊   Testes bem-sucedidos: 3
  📊   Taxa de sucesso: 100.00%

▶ Análise de Confiabilidade
────────────────────────────────────────────────────────────────────────────────
  ✓ Sistema ATENDE ao requisito de confiabilidade (RNF2.1)
  ℹ O processamento dos checklists é consistente e confiável.

═══════════════════════════════════════════════════════════════════════════════
  FIM DOS TESTES
═══════════════════════════════════════════════════════════════════════════════

✅ Testes concluídos com sucesso!
```

## 🎨 Interpretação dos Resultados

### ✅ Cenário Ideal (x ≥ 98%)

```
📊 Resultado (x): 100.00%
✓ APROVADO - Taxa de Atualização Correta: ATENDE (≥ 98%)
✓ Sistema ATENDE ao requisito de confiabilidade (RNF2.1)
```

**Significado:** O sistema está processando corretamente todas as atualizações dos checklists. Os cards refletem com precisão o estado real dos treinos e refeições.

### ⚠️ Cenário de Alerta (95% ≤ x < 98%)

```
📊 Resultado (x): 96.50%
✗ REPROVADO - Taxa de Atualização Correta: NÃO ATENDE (< 98%)
⚠️ ATENÇÃO: Taxa próxima ao limite mínimo!
```

**Significado:** O sistema está funcionando, mas com falhas ocasionais. Recomenda-se investigar as causas das atualizações incorretas antes que o problema se agrave.

**Ações Recomendadas:**
- Revisar logs de erro
- Verificar problemas de concorrência
- Testar conectividade com banco de dados
- Analisar performance das queries

### ❌ Cenário Crítico (x < 95%)

```
📊 Resultado (x): 92.30%
✗ REPROVADO - Taxa de Atualização Correta: NÃO ATENDE (< 98%)
🚨 CRÍTICO: Taxa muito abaixo do requisito!
```

**Significado:** O sistema tem problemas graves de sincronização ou persistência. Ação imediata necessária.

**Ações Urgentes:**
- Parar deploys até correção
- Revisar transações do banco de dados
- Verificar integridade dos dados
- Analisar falhas de conexão
- Testar rollback e recovery

## 🔍 Detalhamento dos Testes

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

## 🐛 Troubleshooting

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

## 📝 Checklist de Validação

Antes de considerar o RNF2.1 como concluído, verifique:

- [ ] Taxa de atualização correta ≥ 98%
- [ ] Todos os 18 testes passando
- [ ] Tempo de resposta < 500ms por atualização
- [ ] Zero race conditions detectadas
- [ ] Integridade referencial 100%
- [ ] Rollback funcionando corretamente
- [ ] Mensagens de erro claras e úteis
- [ ] Logs de auditoria gerados
- [ ] Performance aceitável com carga

## 📊 Integração Contínua

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

## 📞 Suporte

Para dúvidas ou problemas com os testes:

1. **Logs detalhados**: Ativar modo verbose
   ```bash
   npm test -- tests/validation/checklist-reliability.test.js --verbose
   ```

2. **Debug no VS Code**: Adicionar ao `launch.json`
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Jest Checklist Tests",
     "program": "${workspaceFolder}/node_modules/.bin/jest",
     "args": ["tests/validation/checklist-reliability.test.js"],
     "console": "integratedTerminal"
   }
   ```

3. **Documentação de referência**:
   - [Jest Documentation](https://jestjs.io/docs/getting-started)
   - [PostgreSQL Testing](https://www.postgresql.org/docs/current/regress.html)
   - [Supertest Guide](https://github.com/visionmedia/supertest)

---

**Última atualização**: 27 de novembro de 2025  
**Versão**: 1.0.0  
**Status**: ✅ Implementado e Validado
