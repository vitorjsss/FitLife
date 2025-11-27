# 🚀 GUIA RÁPIDO - Testes de Confiabilidade do Checklist (RNF2.1)

## ⚡ Execução Rápida

### Windows (PowerShell)
```powershell
cd C:\GP\FitLife\backend
.\test-checklist-reliability.ps1
```

### Linux/Mac (Bash)
```bash
cd /path/to/FitLife/backend
./test-checklist-reliability.sh
```

### NPM (Universal)
```bash
npm test -- tests/validation/checklist-reliability.test.js --verbose
```

## 📊 O que é testado?

### Métrica Principal
**Taxa de Atualização Correta dos Cards**
- Fórmula: `x = uc / ua`
- Requisito: **x ≥ 98%**
- uc = atualizações corretas
- ua = atualizações totais

### 5 Categorias de Testes (18 testes no total)

1. **🔄 Atualização em Tempo Real** (6 testes)
   - Criação com status inicial correto
   - Marcação como concluído
   - Desmarcação
   - Teste de concorrência

2. **🎨 Reflexão Visual** (3 testes)
   - Estado pendente (cinza)
   - Estado concluído (verde)
   - Consistência em lote

3. **💾 Persistência** (3 testes)
   - Múltiplas atualizações
   - Integridade referencial
   - Timestamps corretos

4. **📜 Histórico** (3 testes)
   - Busca por data
   - Ordenação cronológica
   - Preservação após atualizações

5. **⚠️ Tratamento de Erros** (3 testes)
   - ID inválido
   - Campos obrigatórios
   - Rollback de transação

## ✅ Resultado Esperado

```
═══════════════════════════════════════════════════════════════
  RELATÓRIO FINAL - MÉTRICAS DE CONFIABILIDADE
═══════════════════════════════════════════════════════════════

▶ Taxa de Atualização Correta dos Cards (Métrica Principal)
  📊 Resultado (x): 100.00%
  📊 Requisito: ≥ 98%

  ✓ APROVADO - Taxa de Atualização Correta: ATENDE (≥ 98%)

▶ Análise de Confiabilidade
  ✓ Sistema ATENDE ao requisito de confiabilidade (RNF2.1)
  ℹ O processamento dos checklists é consistente e confiável.

✅ Testes concluídos com sucesso!
```

## 🔴 Se Falhar

### Taxa < 98%
```
  📊 Resultado (x): 95.50%
  ✗ REPROVADO - Taxa de Atualização Correta: NÃO ATENDE (< 98%)
```

**Ações:**
1. Revisar logs de erro no terminal
2. Verificar conexão com banco de dados
3. Executar testes individuais para isolar problema
4. Ver documentação completa em `docs/TESTES-CHECKLIST-CONFIABILIDADE.md`

## 📋 Pré-requisitos

- ✅ Node.js v14+ instalado
- ✅ PostgreSQL rodando
- ✅ Variáveis de ambiente configuradas (`.env`)
- ✅ Dependências instaladas (`npm install`)
- ✅ Tabelas criadas no banco (WorkoutRecord, MealRecord, patient, auth)

## 🐛 Problemas Comuns

### "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
# Windows:
services.msc  # Procurar por PostgreSQL

# Linux:
sudo systemctl status postgresql
```

### "Table does not exist"
```bash
# Executar migrations
npm run migrate

# Ou verificar schema
psql -U postgres -d fitlife -c "\d+ WorkoutRecord"
```

### "Tests timeout"
```bash
# Aumentar timeout (editar jest.config.js)
testTimeout: 30000  // 30 segundos
```

## 📞 Ajuda

Documentação completa: `backend/docs/TESTES-CHECKLIST-CONFIABILIDADE.md`

Problemas? Verifique:
1. Logs do PostgreSQL
2. Variáveis de ambiente (`.env`)
3. Conexão de rede
4. Permissões do banco de dados

---

**Tempo estimado**: ~30 segundos  
**Total de testes**: 18  
**Requisito RNF2.1**: Taxa ≥ 98%
