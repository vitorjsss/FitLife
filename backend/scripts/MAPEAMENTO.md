# Mapeamento Scripts → Testes → RNFs/Riscos

Este documento mapeia a relação entre scripts de execução, arquivos de teste e documentação de RNFs/Riscos.

## 📊 Visão Geral

| Script | Teste(s) Associado(s) | RNF/Risco | Documento |
|--------|----------------------|-----------|-----------|
| `rnf1.0-test-availability.sh` | `validation/availability.test.js` | RNF1.0 | `RNF1.0-Sistema-Monitoramento-Disponibilidade.md` |
| `rnf2.0-test-data-validation.sh` | `validation/data-validation.test.js` | RNF2.0 | `RNF2.0-Processamento confiável (medidas).md` |
| `rnf2.1-test-checklist-reliability.sh` | `validation/checklist-reliability.test.js` | RNF2.1 | `RNF2.1-Confiabilidade do sistema de checklist.md` |
| `rnf2.1-test-checklist-manual.sh` | Manual (cURL) | RNF2.1 | `RNF2.1-Confiabilidade do sistema de checklist.md` |
| `rnf3.0-test-login-audit.sh` | `validation/login-audit.test.js` | RNF3.0 | `RNF3.0-SEGURANCA-AUTENTICACAO.md` |
| `rnf3.2-run-security-tests.sh` | `integration/PatientConnectionCode.test.js` | RNF3.2 | `RNF3.2-COMPARTILHAMENTO-SEGURO-DADOS.md` |
| `rnf3.2-test-security.sh` | Manual via middleware | RNF3.2 | `RNF3.2-COMPARTILHAMENTO-SEGURO-DADOS.md` |

---

## 🎯 RNF1.0: Sistema de Monitoramento de Disponibilidade

### Scripts
- **Bash:** `scripts/rnf/rnf1.0-test-availability.sh`
- **PowerShell:** `scripts/rnf/rnf1.0-test-availability.ps1`

### Testes
- **Arquivo:** `tests/validation/availability.test.js`
- **Suites:** 5 suites, múltiplos cenários
  - 🔐 Teste 1: Disponibilidade da Funcionalidade de Login (3 cenários)
  - 🍽️ Teste 2: Disponibilidade da Visualização de Dietas (3 cenários)
  - 💪 Teste 3: Disponibilidade da Visualização de Treinos (3 cenários)
  - ⚡ Teste 4: Teste de Carga e Estabilidade (1 cenário)
  - 📋 Teste 5: Registro de Logs de Indisponibilidade (2 cenários)

### Métricas
```
X = (Ttotal - Tindisponibilidade) / Ttotal
Requisito: X ≥ 0.90 (90%)
```

### Componentes Testados
- Middleware: `src/middlewares/availabilityMonitor.js`
- Controller: `src/controllers/HealthCheckController.js`
- Endpoints: `/auth/login`, `/meal-calendar/*`, `/workout-calendar/*`

### Riscos Mitigados
- **Risco 2:** Indisponibilidade do sistema
- Taxa de detecção de falhas ≥ 95%
- Tempo de resposta < 2 segundos

### Documentação
- **RNF:** `/docs - riscos e rnfs/rnfs/RNF1.0-Sistema-Monitoramento-Disponibilidade.md`
- **Risco:** `/docs - riscos e rnfs/riscos/ANALISE-RISCO-2.md`

---

## 🎯 RNF2.0: Processamento Confiável (Medidas)

### Scripts
- **Bash:** `scripts/rnf/rnf2.0-test-data-validation.sh`
- **PowerShell:** `scripts/rnf/rnf2.0-test-data-validation.ps1`

### Testes
- **Arquivo:** `tests/validation/data-validation.test.js`
- **Total:** 33 testes em 7 categorias
  1. Validação de Peso (5 testes)
  2. Validação de Altura (5 testes)
  3. Validação de IMC (4 testes)
  4. Validação de Circunferências (6 testes)
  5. Validação de Percentual de Gordura (4 testes)
  6. Validação de Massa Muscular (4 testes)
  7. Validação de Dados Combinados (5 testes)

### Métricas
```
x = Nvalores_invalidos_detectados / Nvalores_invalidos_inseridos
Requisito: x ≥ 1.0 (100%)
```

### Componentes Testados
- Repository: `src/repositories/MedidasCorporaisRepository.js`
- Controller: `src/controllers/MedidasCorporaisController.js`
- Middleware: Validações de entrada

### Casos de Teste
**Peso:**
- ❌ Valor negativo (-5 kg) → Rejeitado
- ❌ Zero (0 kg) → Rejeitado
- ✅ Valor mínimo válido (0.5 kg) → Aceito
- ❌ Valor extremo (500 kg) → Rejeitado
- ✅ Valor normal (70.5 kg) → Aceito

**Altura:**
- ❌ Valor negativo (-1.70 m) → Rejeitado
- ❌ Zero (0 m) → Rejeitado
- ✅ Valor mínimo (0.5 m) → Aceito
- ❌ Valor extremo (3.0 m) → Rejeitado
- ✅ Valor normal (1.75 m) → Aceito

**IMC:**
- ❌ Valor negativo → Rejeitado
- ❌ Zero → Rejeitado
- ✅ Desnutrição (< 18.5) → Aceito
- ✅ Normal (18.5-24.9) → Aceito
- ✅ Obesidade (> 30) → Aceito

### Riscos Mitigados
- **Risco 4:** Erro de validação de dados
- Detecção de 100% de valores implausíveis
- Proteção contra dados corrompidos

### Documentação
- **RNF:** `/docs - riscos e rnfs/rnfs/RNF2.0-Processamento confiável (medidas).md`
- **Risco:** `/docs - riscos e rnfs/riscos/ANALISE-RISCO-3&4.md`

---

## 🎯 RNF2.1: Confiabilidade do Sistema de Checklist

### Scripts
- **Automatizado (Bash):** `scripts/rnf/rnf2.1-test-checklist-reliability.sh`
- **Automatizado (PowerShell):** `scripts/rnf/rnf2.1-test-checklist-reliability.ps1`
- **Manual (Exploratório):** `scripts/rnf/rnf2.1-test-checklist-manual.sh`

### Testes
- **Arquivo:** `tests/validation/checklist-reliability.test.js`
- **Suites:** 7 categorias de testes
  1. Criação e Atualização de WorkoutRecord (4 testes)
  2. Criação e Atualização de MealRecord (3 testes)
  3. Persistência de Dados (3 testes)
  4. Reflexão Visual do Estado (3 testes)
  5. Histórico de Marcações (2 testes)
  6. Teste de Concorrência (2 testes)
  7. Tratamento de Erros (3 testes)

### Métricas
```
x = uc / ua
onde:
  uc = número de atualizações corretas refletidas nos cards
  ua = número total de atualizações realizadas pelo usuário
Requisito: x ≥ 0.98 (98%)
```

### Componentes Testados
- Repository: `src/repositories/MealRecordRepository.js`, `src/repositories/WorkoutRecordRepository.js`
- Controller: `src/controllers/MealRecordController.js`, `src/controllers/WorkoutRecordController.js`
- Database: Constraints e triggers

### Cenários de Teste

**WorkoutRecord:**
1. Criar com status pendente (`checked: false`)
2. Marcar como concluído (`checked: true`)
3. Desmarcar (`checked: false`)
4. Verificar persistência após múltiplas atualizações

**MealRecord:**
1. Criar com status pendente
2. Marcar como concluído
3. Verificar reflexão visual (cinza → verde)

**Concorrência:**
- 10 atualizações rápidas consecutivas
- Todas devem ser refletidas corretamente

**Persistência:**
- Estado deve ser mantido após logout
- Recuperação correta do banco de dados

### Script Manual
O script `rnf2.1-test-checklist-manual.sh` executa testes exploratórios com cURL:
1. Criar usuário de teste
2. Fazer login e obter token
3. Criar refeição com `checked: false`
4. Atualizar para `checked: true`
5. Verificar persistência no banco (via psql)
6. Buscar via API GET
7. Repetir para WorkoutRecord
8. Verificar logs de auditoria
9. Cleanup dos dados de teste

### Riscos Mitigados
- **Risco 10:** Desatualização do checklist
- Taxa de atualização correta ≥ 98%
- Sincronização em tempo real
- Histórico completo de alterações

### Documentação
- **RNF:** `/docs - riscos e rnfs/rnfs/RNF2.1-Confiabilidade do sistema de checklist.md`
- **Risco:** `/docs - riscos e rnfs/riscos/ANALISE-RISCO-3&4.md` (Risco 10)

---

## 🎯 RNF3.0: Segurança e Autenticação

### Scripts
- **Bash:** `scripts/rnf/rnf3.0-test-login-audit.sh`
- **PowerShell:** `scripts/rnf/rnf3.0-test-login-audit.ps1`

### Testes
- **Arquivo:** `tests/validation/login-audit.test.js`
- **Suites:** 5 categorias
  1. ✅ Registro de Login Bem-Sucedido (2 testes)
  2. ❌ Registro de Login com Falha (3 testes)
  3. 🔒 Registro de Tentativas de Força Bruta (2 testes)
  4. 📊 Métricas de Auditoria (2 testes)
  5. 🗑️ Limpeza de Logs Antigos (1 teste)

### Métricas
```
x = Ntentativas_registradas / Ntentativas_totais
Requisito: x ≥ 1.0 (100%)
```

### Componentes Testados
- Service: `src/services/AuthService.js`
- Repository: `src/repositories/LogRepository.js`
- Table: `audit_log` (PostgreSQL)

### Cenários de Teste

**Login Bem-Sucedido:**
- Registra: user_id, email, ip, timestamp, user_agent, status: SUCCESS

**Login Falhado:**
- Senha incorreta → Log com reason: "Senha inválida"
- Email não encontrado → Log com reason: "Usuário não encontrado"
- Conta bloqueada → Log com reason: "Conta bloqueada"

**Força Bruta:**
- Detecta 5+ tentativas consecutivas
- Bloqueia conta automaticamente
- Registra todas as tentativas

**Campos Obrigatórios:**
- ✅ user_id (ou null se usuário não existe)
- ✅ email
- ✅ ip
- ✅ timestamp
- ✅ status (SUCCESS/FAILURE)
- ✅ user_agent
- ✅ reason (para falhas)

### Riscos Mitigados
- **Risco 1:** Vazamento de credenciais
- **Risco 3:** Acesso não autorizado
- 100% de tentativas registradas
- Rastreabilidade completa

### Documentação
- **RNF:** `/docs - riscos e rnfs/rnfs/RNF3.0-SEGURANCA-AUTENTICACAO.md`
- **Risco:** `/docs - riscos e rnfs/riscos/ANALISE-RISCO-1.md`

---

## 🎯 RNF3.2: Compartilhamento Seguro de Dados

### Scripts
- **Completo (com setup):** `scripts/rnf/rnf3.2-run-security-tests.sh`
- **Simplificado:** `scripts/rnf/rnf3.2-test-security.sh`

### Testes
- **Integração:** `tests/integration/PatientConnectionCode.test.js`
- **Validação:** Via middleware `src/middlewares/patientAccessMiddleware.js`

### Métricas
```
1. Taxa de Expiração Correta de Códigos
   x = Ncodigos_expirados_corretos / Ncodigos_expirados_total
   Requisito: x ≥ 1.0 (100%)

2. Taxa de Uso Único de Códigos
   y = Ncodigos_uso_unico / Ncodigos_utilizados
   Requisito: y ≥ 1.0 (100%)

3. Controle de Acesso por Tipo
   z = Nacessos_corretos / Nacessos_total
   Requisito: z ≥ 1.0 (100%)
```

### Componentes Testados
- Service: `src/services/PatientConnectionCodeService.js`
- Repository: `src/repositories/PatientConnectionCodeRepository.js`
- Controller: `src/controllers/PatientConnectionCodeController.js`
- Middleware: `src/middlewares/patientAccessMiddleware.js`
- Tables: `patient_connection_code`, `patient_professional_association`

### Cenários de Teste (rnf3.2-run-security-tests.sh)

**Etapa 0:** Reset do Ambiente
- Limpa dados de teste anteriores
- Remove usuários `teste.%@fitlife.com`

**Etapa 1:** Verificar Backend
- Testa endpoint `/health`
- Garante backend está rodando

**Etapa 2:** Verificar Banco
- Testa conexão PostgreSQL
- Porta 5433

**Etapa 3:** Criar Usuários de Teste
- João (Paciente)
- Maria (Paciente)
- Ana (Nutricionista)
- Carlos (Educador Físico)
- Cria associação: João ↔ Ana + Carlos

**Etapa 4:** Fazer Login
- Obtém tokens JWT para todos os usuários

**Etapa 5:** Executar Testes de Segurança

| # | Teste | Usuário | Endpoint | Esperado | Motivo |
|---|-------|---------|----------|----------|--------|
| 1 | Paciente → próprios dados | João → João (meal) | `/meal-calendar/monthly/joao-id/2025/11` | 200 ✅ | Acesso próprio |
| 2 | Paciente → dados de outro | João → Maria (meal) | `/meal-calendar/monthly/maria-id/2025/11` | 403 ❌ | Sem permissão |
| 3 | Nutricionista → refeições | Ana → João (meal) | `/meal-calendar/monthly/joao-id/2025/11` | 200 ✅ | Associação + tipo correto |
| 4 | Nutricionista → treinos | Ana → João (workout) | `/workout-calendar/monthly/joao-id/2025/11` | 403 ❌ | Tipo incompatível |
| 5 | Educador → treinos | Carlos → João (workout) | `/workout-calendar/monthly/joao-id/2025/11` | 200 ✅ | Associação + tipo correto |
| 6 | Educador → refeições | Carlos → João (meal) | `/meal-calendar/monthly/joao-id/2025/11` | 403 ❌ | Tipo incompatível |
| 7 | Nutricionista → sem associação | Ana → Maria (meal) | `/meal-calendar/monthly/maria-id/2025/11` | 403 ❌ | Sem associação |

**Etapa 6:** Verificar Logs de Auditoria
- Verifica tabela `log` (ou `logs`)
- Filtra `log_type = 'SECURITY'`
- Mostra últimos 5 logs

### Cenários de Teste (rnf3.2-test-security.sh)

Versão simplificada com 9 testes:
1. Paciente → próprios dados (200)
2. Paciente → dados de outro (403)
3. Nutricionista com associação → refeições (200)
4. Nutricionista → treinos (403)
5. Educador com associação → treinos (200)
6. Educador → refeições (403)
7. Profissional sem associação (403)
8. Educador sem associação (403)
9. Requisição sem token (401)

### Testes de Integração (PatientConnectionCode.test.js)

**Suites:**
1. Geração de Código (5 cenários)
2. Validação de Código (5 cenários)
3. Controle de Acesso por Tipo (5 cenários)
4. Expiração Automática (4 cenários)
5. Registro de Logs (5 cenários)
6. Associação Única por Tipo (4 cenários)

**Total:** 28+ cenários de teste

### Riscos Mitigados
- **Risco 3:** Acesso não autorizado a dados de pacientes
- **Risco 4:** Compartilhamento inseguro de código
- Códigos temporários (5 minutos)
- Uso único
- Controle de tipo de profissional
- Logs completos de auditoria

### Documentação
- **RNF:** `/docs - riscos e rnfs/rnfs/RNF3.2-COMPARTILHAMENTO-SEGURO-DADOS.md`
- **Risco:** `/docs - riscos e rnfs/riscos/ANALISE-RISCO-3&4.md`

---

## 🔍 Testes Não Associados a Scripts

### validation/risco-1-credenciais-validation.js
- **Risco:** Vazamento de credenciais
- **Objetivo:** Validar hash de senhas, não armazenar senha em texto plano
- **Status:** Teste existe, mas sem script de execução dedicado
- **Sugestão:** Criar `scripts/riscos/risco1-test-credentials.sh`

### validation/risco-1-frontend-integration.js
- **Risco:** Vazamento de credenciais no frontend
- **Objetivo:** Validar que frontend não expõe credenciais
- **Status:** Teste existe, mas sem script de execução
- **Sugestão:** Criar `scripts/riscos/risco1-test-frontend.sh`

### validation/risco-3-validation.js
- **Risco:** Acesso não autorizado
- **Objetivo:** Validar middleware de autorização
- **Status:** Coberto parcialmente por RNF3.2
- **Sugestão:** Integrar em `rnf3.2-run-security-tests.sh`

### validation/risco-4-validation.js
- **Risco:** Erro de validação de dados
- **Objetivo:** Similar ao RNF2.0
- **Status:** Coberto por `rnf2.0-test-data-validation.sh`

### validation/risco-5-backup-validation.js
- **Risco:** Perda de dados
- **Objetivo:** Validar sistema de backup
- **Status:** Teste existe, mas sem script de execução
- **Documento:** `/docs - riscos e rnfs/rnfs/RNF1.2-Disponibilidade de backup.md`
- **Sugestão:** Criar `scripts/rnf/rnf1.2-test-backup.sh`

### validation/risco-6-validation.js
- **Risco:** Falha de sincronização
- **Objetivo:** Validar sincronização de dados
- **Status:** Teste existe, mas sem script de execução
- **Sugestão:** Criar `scripts/riscos/risco6-test-sync.sh`

### validation/mealValidation.test.js
- **Objetivo:** Validação específica de refeições
- **Status:** Teste antigo, possivelmente redundante
- **Sugestão:** Integrar em testes de RNF ou remover se duplicado

---

## 📋 Checklist de Cobertura

### ✅ RNFs com Scripts Completos
- [x] RNF1.0 - Disponibilidade
- [x] RNF2.0 - Validação de Dados
- [x] RNF2.1 - Checklist
- [x] RNF3.0 - Login Audit
- [x] RNF3.2 - Compartilhamento Seguro

### ⚠️ RNFs com Testes mas Sem Scripts Dedicados
- [ ] RNF1.2 - Backup (teste existe: `risco-5-backup-validation.js`)
- [ ] RNF3.1 - Reautenticação (sem testes automatizados)

### ⚠️ Riscos com Testes mas Sem Scripts
- [ ] Risco 1 - Credenciais (`risco-1-credenciais-validation.js`, `risco-1-frontend-integration.js`)
- [ ] Risco 3 - Acesso não autorizado (`risco-3-validation.js`) - coberto parcialmente por RNF3.2
- [ ] Risco 4 - Validação de dados (`risco-4-validation.js`) - coberto por RNF2.0
- [ ] Risco 5 - Backup (`risco-5-backup-validation.js`)
- [ ] Risco 6 - Sincronização (`risco-6-validation.js`)

---

## 🎯 Recomendações

### Scripts a Criar
1. `scripts/rnf/rnf1.2-test-backup.sh` → `tests/validation/risco-5-backup-validation.js`
2. `scripts/riscos/risco1-test-credentials.sh` → `tests/validation/risco-1-credenciais-validation.js`
3. `scripts/riscos/risco1-test-frontend.sh` → `tests/validation/risco-1-frontend-integration.js`
4. `scripts/riscos/risco6-test-sync.sh` → `tests/validation/risco-6-validation.js`

### Testes a Revisar
- `tests/validation/mealValidation.test.js` - Verificar se não é duplicado
- `tests/validation/risco-3-validation.js` - Integrar em RNF3.2 ou criar script dedicado
- `tests/validation/risco-4-validation.js` - Verificar se não é duplicado de RNF2.0

### Documentação a Criar
- RNF3.1 precisa de testes automatizados
- Alguns riscos precisam de documentação atualizada

---

**Última Atualização:** 29/11/2025
**Versão:** 1.0.0
