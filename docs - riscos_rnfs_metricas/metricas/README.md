# ÍNDICE DE MÉTRICAS DE QUALIDADE - FITLIFE

Este diretório contém a documentação completa das 9 métricas de qualidade implementadas e validadas no sistema FitLife.

## ESTRUTURA DOS DOCUMENTOS

Cada documento de métrica segue o formato:
- **Métrica**: Fórmula e interpretação
- **Implementação**: Código e mecanismos técnicos
- **Cenários de Teste**: Lista numerada de casos de teste
- **Resultados dos Testes**: Saída esperada da execução
- **Cálculo da Métrica**: Aplicação da fórmula com dados reais
- **Conclusão**: Status de aprovação/reprovação

---

## DISPONIBILIDADE

### [M1 - DISPONIBILIDADE.md](./m1-DISPONIBILIDADE.md)
**RNF 1.0 - Disponibilidade do Sistema**
- Fórmula: X = (Ttotal - Tindisponibilidade) / Ttotal ≥ 0.90
- Requisito: ≥ 90% de disponibilidade
- Resultado: 100%
- Testes: 12

### [M4 - DISPONIBILIDADE-MTTR.md](./m4-DISPONIBILIDADE-MTTR.md)
**RNF 1.2 - Mean Time To Recovery**
- Fórmula: x = (Σ tf) / n ≤ 5 minutos
- Requisito: ≤ 5 minutos
- Resultado: 0.01 minutos
- Testes: 10

### [M7 - DISPONIBILIDADE-BACKUP.md](./m7-DISPONIBILIDADE-BACKUP.md)
**RNF 1.2 Ext - Tempo de Restauração de Backup**
- Fórmula: x = a / 30 ≤ 1
- Requisito: ≤ 30 minutos
- Resultado: 1.5 minutos
- Testes: 10

---

## CONFIABILIDADE

### [M2 - CONFIABILIDADE.md](./m2-CONFIABILIDADE.md)
**RNF 2.0 - Taxa de Detecção de Dados Inválidos**
- Fórmula: x = Ndetectados / Ninválidos ≥ 0.98
- Requisito: ≥ 98%
- Resultado: 100%
- Testes: 19

### [M5 - CONFIABILIDADE-CARDS.md](./m5-CONFIABILIDADE-CARDS.md)
**RNF 2.1 - Taxa de Correção de Atualizações de Cards**
- Fórmula: x = uc / ua ≥ 0.98
- Requisito: ≥ 98%
- Resultado: 100%
- Testes: 17

### [M8 - CONFIABILIDADE-RELATORIOS.md](./m8-CONFIABILIDADE-RELATORIOS.md)
**RNF 2.1 Ext - Taxa de Consistência de Relatórios**
- Fórmula: x = a / b ≥ 0.95
- Requisito: ≥ 95%
- Resultado: 100%
- Testes: 11

---

## SEGURANÇA

### [M3 - SEGURANCA.md](./m3-SEGURANCA.md)
**RNF 3.0 - Taxa de Registro de Tentativas de Login**
- Fórmula: x = Nregistrados / Ntentativas ≥ 0.98
- Requisito: ≥ 98%
- Resultado: 100%
- Testes: 11

### [M6 - SEGURANCA-CREDENCIAIS.md](./m6-SEGURANCA-CREDENCIAIS.md)
**RNF 3.1 - Taxa de Alterações Seguras de Credenciais**
- Fórmula: x = ac / at = 1.0
- Requisito: 100%
- Resultado: 100%
- Testes: 20

### [M9 - SEGURANCA-CRIPTOGRAFIA.md](./m9-SEGURANCA-CRIPTOGRAFIA.md)
**RNF 3.2 - Taxa de Dados Sensíveis Criptografados**
- Fórmula: x = a / b = 1.0
- Requisito: 100%
- Resultado: 100%
- Testes: 18

---

## RESUMO EXECUTIVO

### [RESUMO-METRICAS.md](./RESUMO-METRICAS.md)
Documento consolidado com:
- Visão geral das 9 métricas
- Tabela comparativa
- Resultados por categoria (Disponibilidade, Confiabilidade, Segurança)
- Infraestrutura de testes
- Comandos de execução
- Conclusão geral

**Total de Testes de Validação: 129**

---

## ARQUIVOS DE TESTE

Todos os testes estão em `/backend/tests/validation/`:

1. `availability.test.js` - M1
2. `data-validation.test.js` - M2
3. `login-audit.test.js` - M3
4. `mttr.test.js` - M4
5. `card-updates.test.js` - M5
6. `credential-security.test.js` - M6
7. `backup-restoration.test.js` - M7
8. `report-consistency.test.js` - M8
9. `data-encryption.test.js` - M9

---

## EXECUÇÃO

```bash
# Executar todos os testes de validação
cd backend
npm test tests/validation/

# Executar teste específico
npm test tests/validation/availability.test.js
```

---