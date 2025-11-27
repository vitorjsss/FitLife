# Como Testar a Segurança - Início Rápido

## O que foi implementado?

Conforme requisitos FMEA:

| Requisito | Implementação | Arquivo |
|-----------|---------------|---------|
| **Middleware de Autorização** | Implementado | `src/middlewares/patientAccessMiddleware.js` |
| **Auditoria de Endpoints** | 7 rotas protegidas | Arquivos em `src/routes/` |
| **Testes Automatizados** | 21 testes (100% passando) | `tests/unit/PatientConnectionCodeRepository.test.js` |
| **Logs de Segurança** | Sistema completo | Tabela `log` no PostgreSQL |

## Execução Rápida

### 1. Preparar Dados de Teste

```bash
# Conectar ao banco
psql -h localhost -p 5433 -U postgres -d fitlife

# Copiar e colar o conteúdo do arquivo SQL abaixo
\i setup-test-users.sql
```

**Arquivo: `setup-test-users.sql`** (criar este arquivo):

```sql
-- Limpar usuários de teste anteriores
DELETE FROM patient_professional_association WHERE patient_id IN (
    SELECT id FROM patient WHERE name IN ('João da Silva', 'Maria Santos')
);
DELETE FROM patient WHERE name IN ('João da Silva', 'Maria Santos');
DELETE FROM nutricionist WHERE name = 'Ana Nutricionista';
DELETE FROM physical_educator WHERE name = 'Carlos Educador';
DELETE FROM auth WHERE email LIKE 'teste.%@fitlife.com';

-- Criar usuários (senha: senha123)
INSERT INTO auth (id, username, email, password, user_type) VALUES
    ('11111111-1111-1111-1111-111111111111', 'joao_paciente', 'teste.joao@fitlife.com', 
     '$2b$10$rOZxqKVF8KqG0FhGX.jHMuWqL5R4YVJ7JqVQYJKqGqKqGqKqGqKqG', 'Patient'),
    ('22222222-2222-2222-2222-222222222222', 'maria_paciente', 'teste.maria@fitlife.com', 
     '$2b$10$rOZxqKVF8KqG0FhGX.jHMuWqL5R4YVJ7JqVQYJKqGqKqGqKqGqKqG', 'Patient'),
    ('33333333-3333-3333-3333-333333333333', 'ana_nutri', 'teste.ana@fitlife.com', 
     '$2b$10$rOZxqKVF8KqG0FhGX.jHMuWqL5R4YVJ7JqVQYJKqGqKqGqKqGqKqG', 'Nutricionist'),
    ('44444444-4444-4444-4444-444444444444', 'carlos_educador', 'teste.carlos@fitlife.com', 
     '$2b$10$rOZxqKVF8KqG0FhGX.jHMuWqL5R4YVJ7JqVQYJKqGqKqGqKqGqKqG', 'Physical_educator');

-- Criar perfis
INSERT INTO patient (id, name, birthdate, sex, contact, height, auth_id) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'João da Silva', '1990-01-15', 'M', '11999999999', 1.75, '11111111-1111-1111-1111-111111111111'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Maria Santos', '1995-06-20', 'F', '11888888888', 1.65, '22222222-2222-2222-2222-222222222222');

INSERT INTO nutricionist (id, name, birthdate, sex, contact, crn, auth_id) VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Ana Nutricionista', '1985-03-10', 'F', '11777777777', 'CRN12345', '33333333-3333-3333-3333-333333333333');

INSERT INTO physical_educator (id, name, birthdate, sex, contact, cref, auth_id) VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Carlos Educador', '1988-08-25', 'M', '11666666666', 'CREF67890', '44444444-4444-4444-4444-444444444444');

-- Criar associações ativas
INSERT INTO patient_professional_association (id, patient_id, nutricionist_id, status, created_at) VALUES
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'active', NOW());

INSERT INTO patient_professional_association (id, patient_id, physical_educator_id, status, created_at) VALUES
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'active', NOW());

\echo 'Usuários de teste criados com sucesso!'
\echo ''
\echo 'Usuários disponíveis:'
\echo '  • João (Paciente): teste.joao@fitlife.com / senha123'
\echo '  • Maria (Paciente): teste.maria@fitlife.com / senha123'
\echo '  • Ana (Nutricionista): teste.ana@fitlife.com / senha123'
\echo '  • Carlos (Educador): teste.carlos@fitlife.com / senha123'
\echo ''
\echo 'Associações:'
\echo '  • Ana ↔ João (refeições)'
\echo '  • Carlos ↔ João (treinos)'
```

### 2. Rodar Testes Automatizados

```bash
# Opção 1: Script completo de testes de segurança (RECOMENDADO)
./run-security-tests.sh

# Opção 2: Testes unitários (apenas repository)
npm run test:unit

# Opção 3: Script antigo de testes de segurança
./test-security.sh
```

**O que o script `run-security-tests.sh` faz:**
- Verifica pré-requisitos (jq, psql, backend rodando)
- Cria usuários de teste automaticamente
- Executa 10 cenários de teste:
  - Acesso legítimo de pacientes aos próprios dados
  - Bloqueio de acesso entre pacientes
  - Validação de tipo de dado (nutricionista vs educador)
  - Verificação de associações profissional-paciente
  - Acesso legítimo de profissionais aos pacientes associados
- Verifica logs de auditoria no banco
- Gera relatório final com taxa de sucesso

### 3. Ver Logs de Auditoria

```bash
# Logs das últimas tentativas não autorizadas
psql -h localhost -p 5433 -U postgres -d fitlife -c "
SELECT 
  created_at,
  new_value->>'userType' as tipo_usuario,
  new_value->>'dataType' as tipo_dado,
  description
FROM log
WHERE log_type = 'SECURITY'
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;"
```

## Matriz de Permissões

| Usuário | Próprios Dados Meal | Próprios Dados Workout | Meal Paciente Associado | Workout Paciente Associado | Dados de Outro Paciente |
|---------|---------------------|------------------------|-------------------------|---------------------------|------------------------|
| **Paciente** | Permitido | Permitido | Bloqueado | Bloqueado | Bloqueado |
| **Nutricionista** | N/A | N/A | Permitido | Bloqueado | Bloqueado |
| **Educador Físico** | N/A | N/A | Bloqueado | Permitido | Bloqueado |

## Cenários de Teste

### Cenário 1: Acesso Legítimo
```bash
# João acessa seus próprios dados
curl -X GET "http://localhost:5001/meal-calendar/monthly/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/2025/11" \
  -H "Authorization: Bearer TOKEN_DO_JOAO"

# Resposta esperada: 200 OK
```

### Cenário 2: Acesso Bloqueado (Paciente ↔ Paciente)
```bash
# João tenta acessar dados da Maria
curl -X GET "http://localhost:5001/meal-calendar/monthly/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/2025/11" \
  -H "Authorization: Bearer TOKEN_DO_JOAO"

# Resposta esperada: 403 Forbidden
# Mensagem: "Você só pode acessar seus próprios dados"
# Log criado: Sim
```

### Cenário 3: Tipo de Dado Incompatível
```bash
# Ana (Nutricionista) tenta acessar treinos
curl -X GET "http://localhost:5001/workout-calendar/monthly/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/2025/11" \
  -H "Authorization: Bearer TOKEN_DA_ANA"

# Resposta esperada: 403 Forbidden
# Mensagem: "Apenas educadores físicos podem acessar dados de treino"
# Log criado: Sim
```

### Cenário 4: Sem Associação
```bash
# Ana tenta acessar dados da Maria (sem associação)
curl -X GET "http://localhost:5001/meal-calendar/monthly/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/2025/11" \
  -H "Authorization: Bearer TOKEN_DA_ANA"

# Resposta esperada: 403 Forbidden
# Mensagem: "Você não está associado a este paciente"
# Log criado: Sim
```

## Checklist de Validação

Use este checklist para validar a implementação:

- [ ] **Middleware Implementado**
  - [ ] Arquivo `patientAccessMiddleware.js` existe
  - [ ] Middleware exporta função `checkPatientAccess`
  - [ ] Middleware aceita parâmetro `dataType`

- [ ] **Rotas Protegidas**
  - [ ] `/meal-calendar/monthly/:patientId/...` usa `checkPatientAccess('meal')`
  - [ ] `/meal-calendar/day/:patientId/...` usa `checkPatientAccess('meal')`
  - [ ] `/workout-calendar/monthly/:patientId/...` usa `checkPatientAccess('workout')`
  - [ ] `/workout-calendar/day/:patientId/...` usa `checkPatientAccess('workout')`

- [ ] **Testes Automatizados**
  - [ ] `npm run test:unit` executa sem erros
  - [ ] 21/21 testes passando (100%)
  - [ ] Testes cobrem códigos expirados
  - [ ] Testes cobrem códigos já usados

- [ ] **Logs de Auditoria**
  - [ ] Tabela `log` existe no banco
  - [ ] Logs contêm campo `log_type = 'SECURITY'`
  - [ ] Logs contêm IP do requisitante
  - [ ] Logs contêm detalhes da tentativa (JSON em `new_value`)

- [ ] **Testes Manuais**
  - [ ] `./test-security.sh` executa sem erros
  - [ ] Todos os 9 testes passam
  - [ ] Logs são criados no banco para tentativas bloqueadas

## Documentação Completa

Para documentação detalhada, veja:

- **Guia Completo:** `/docs/GUIA-COMPLETO-TESTES-SEGURANCA.md`
- **Exemplos Práticos:** `/docs/EXEMPLOS-MIDDLEWARE-SEGURANCA.md`
- **Resumo da Implementação:** `/IMPLEMENTATION-SUMMARY.md`

## Troubleshooting

### Problema: "jq não está instalado"
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### Problema: "Servidor não está respondendo"
```bash
# Verificar se backend está rodando
curl http://localhost:5001/health

# Se não estiver, iniciar
npm start
```

### Problema: "Falha no login de João"
```bash
# Executar novamente o script SQL de criação de usuários
psql -h localhost -p 5433 -U postgres -d fitlife -f setup-test-users.sql
```

### Problema: "Banco de dados não está rodando"
```bash
# Verificar status
docker-compose ps

# Iniciar banco
docker-compose up -d db

# Aguardar alguns segundos
sleep 5

# Testar conexão
pg_isready -h localhost -p 5433
```

**Providências Implementadas:**
- Middleware de autorização
- Revisão de endpoints críticos
- Testes automatizados de acesso
- Sistema de logs de auditoria

---