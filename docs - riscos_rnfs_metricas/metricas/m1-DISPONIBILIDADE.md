# Comprovação Métrica de qualidade 1.0 - Disponibilidade do Sistema

## Informações do Atributo de Qualidade

**Atributo:** Disponibilidade  

---

## Métrica Definida

### Taxa de Disponibilidade das Funcionalidades Críticas

**Fórmula:**
```
X = (Ttotal - Tindisponibilidade) / Ttotal
```

**Onde:**
- Ttotal = Tempo total de observação em segundos
- Tindisponibilidade = Tempo em que a funcionalidade esteve indisponível em segundos

**Requisito:** X ≥ 0.90 (90%)  
**Tipo de Medida:** Externa

---

## Implementação

### Funcionalidades Críticas Monitoradas

1. Login/Autenticação (POST /auth/login)
2. Visualização de Dietas (GET /meal-record/date/{date}/patient/{id})
3. Visualização de Treinos (GET /workout-record/date/{date}/patient/{id})

### Garantias de Disponibilidade

- Docker Compose com restart: always
- Health checks configurados
- Timeout máximo: 2000ms por operação
- Registro de downtime em logs

---

## Testes Automatizados

**Arquivo:** backend/tests/validation/availability.test.js

### Cenários Testados

1. Login responde com sucesso
2. Login responde em tempo aceitável (< 2s)
3. Múltiplas tentativas de login consecutivas
4. Listagem de dietas responde com sucesso
5. Visualização de dietas responde em tempo aceitável
6. Múltiplas consultas de dietas consecutivas
7. Listagem de treinos responde com sucesso
8. Visualização de treinos responde em tempo aceitável
9. Múltiplas consultas de treinos consecutivas
10. Sistema suporta carga simultânea

### Como Executar

```bash
cd backend
npm test -- tests/validation/availability.test.js
```

---

## Resultados dos Testes

**Data de Execução:** 29/11/2025

```
PASS  tests/validation/availability.test.js
  Teste 1: Disponibilidade de Login
    ✓ Login deve responder com sucesso
    ✓ Login deve responder em tempo aceitável (< 2s)
    ✓ Múltiplas tentativas de login consecutivas
  Teste 2: Disponibilidade de Dietas
    ✓ Listagem de dietas deve responder com sucesso
    ✓ Visualização de dietas deve responder em tempo aceitável
    ✓ Múltiplas consultas de dietas consecutivas
  Teste 3: Disponibilidade de Treinos
    ✓ Listagem de treinos deve responder com sucesso
    ✓ Visualização de treinos deve responder em tempo aceitável
    ✓ Múltiplas consultas de treinos consecutivas
  Teste 4: Teste de Carga e Estabilidade
    ✓ Sistema deve suportar carga simultânea

Tests: 10 passed, 10 total
```

---

## Cálculo da Métrica

**Dados dos testes automatizados:**
- Total de operações testadas: 19
- Operações bem-sucedidas: 19
- Operações falhadas: 0
- Tempo total de observação: 15.234s
- Tempo de indisponibilidade: 0s

**Cálculo:**
```
X = (Ttotal - Tindisponibilidade) / Ttotal
X = (15.234 - 0) / 15.234
X = 15.234 / 15.234
X = 1.0000
X = 100%
```

**Resultado:** 100% ≥ 90% - APROVADO

### Detalhamento por Funcionalidade

| Funcionalidade | Testes | Sucessos | Disponibilidade |
|----------------|--------|----------|-----------------|
| Login | 7 | 7 | 100% |
| Dietas | 6 | 6 | 100% |
| Treinos | 6 | 6 | 100% |
| **Total** | **19** | **19** | **100%** |

---

## Conclusão

O sistema ATENDE ao requisito da métrica de qualidade 1:

- Taxa de disponibilidade: 100%
- Requisito mínimo: 90%
- Margem: +10%
- Todas as funcionalidades críticas disponíveis
- Tempo de resposta médio < 2s