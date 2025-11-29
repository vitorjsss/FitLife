# ANÁLISE DE RISCO 2 - ACESSO INDEVIDO POR FALTA DE CONTROLE DE AUTORIZAÇÃO

**Risco:** Acesso indevido por ausência de validação de papéis e perfis

## Objetivo
Validar que o sistema bloqueia acessos não autorizados a dados de pacientes, profissionais e endpoints sensíveis, conforme o risco identificado.

## 1. Cenários de Teste

### Cenário 1: Paciente tentando acessar dados de outro paciente
**Passos:**
1. Login como paciente João
2. Tentar acessar `/meal-calendar/monthly/MARIA_ID/2025/11`
**Esperado:** HTTP 403, mensagem de bloqueio, log criado

### Cenário 2: Nutricionista tentando acessar treinos
**Passos:**
1. Login como nutricionista Ana
2. Tentar acessar `/workout-calendar/monthly/JOAO_ID/2025/11`
**Esperado:** HTTP 403, mensagem de bloqueio, log criado

### Cenário 3: Profissional sem associação ativa
**Passos:**
1. Login como nutricionista Ana
2. Tentar acessar `/meal-calendar/monthly/MARIA_ID/2025/11` sem associação
**Esperado:** HTTP 403, mensagem de bloqueio, log criado

### Cenário 4: Acesso legítimo
**Passos:**
1. Login como nutricionista Ana
2. Acessar `/meal-calendar/monthly/JOAO_ID/2025/11` com associação ativa
**Esperado:** HTTP 200, dados retornados

---

## 2. Scripts de Teste

### Preparação do Ambiente
```bash
cd /Users/vitor/Downloads/FitLife
docker-compose up -d db
cd backend
npm start
psql -h localhost -p 5433 -U postgres -d fitlife
```

### Script SQL - Dados de Teste
```sql
-- Criar usuários, perfis e associações para testes
DELETE FROM auth WHERE email LIKE 'teste.%@fitlife.com';
INSERT INTO auth (...);
INSERT INTO patient (...);
INSERT INTO nutricionist (...);
INSERT INTO physical_educator (...);
INSERT INTO patient_professional_association (...);
-- Senha padrão: senha123
```

### Testes com cURL
Salvar comandos em `test-security.sh`, dar permissão de execução e rodar o script para validar os cenários acima.

---

## 3. Auditoria de Logs

### Consulta de Logs de Segurança
```sql
SELECT created_at, action, description, user_id, ip FROM log WHERE log_type = 'SECURITY' AND status = 'FAILURE' ORDER BY created_at DESC LIMIT 20;
```

### Monitoramento em Tempo Real
```sql
SELECT NOW() as timestamp, ip FROM log WHERE created_at > NOW() - INTERVAL '1 minute' AND log_type = 'SECURITY' ORDER BY created_at DESC;
```

---

## 4. Checklist de Validação

- [ ] Paciente acessa apenas seus próprios dados
- [ ] Profissional só acessa paciente associado
- [ ] Nutricionista não acessa dados de treino
- [ ] Educador não acessa dados de refeição
- [ ] Logs criados para tentativas bloqueadas
- [ ] Testes manuais e automatizados executados

---

## 5. Troubleshooting

- Token não fornecido: adicionar header Authorization
- Token inválido: fazer login novamente para obter novo token
- Banco de dados não está rodando: iniciar serviço e testar conexão

---

**Última atualização:** 10/11/2025
**Versão:** 1.0
echo ""

# ==============================
# TESTE 4: Nutricionista acessando dados de refeição (DEVE FUNCIONAR)
# ==============================
echo "TESTE 4: Ana (Nutricionista) acessando dados de refeição de João"
echo "→ GET /meal-calendar/monthly/$JOAO_ID/2025/11"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/meal-calendar/monthly/$JOAO_ID/2025/11" \
  -H "Authorization: Bearer $ANA_TOKEN")

if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ PASSOU: Status 200 (Nutricionista associada pode acessar)${NC}"
else
    echo -e "${RED}✗ FALHOU: Status $STATUS (Esperado: 200)${NC}"
fi

```

**Como executar:**

```bash
# Dar permissão de execução
chmod +x test-security.sh

# Executar os testes
./test-security.sh
```

---

## 3. Testes Automatizados

### 3.1 Executar Testes Unitários

```bash
cd /Users/vitor/Downloads/FitLife/backend

# Todos os testes
npm test

# Apenas testes unitários
npm run test:unit

# Com verbose (ver detalhes)
npm run test:verbose

# Com cobertura
npm run test:coverage
```

### 3.2 Interpretação dos Resultados

```
PASS  tests/unit/PatientConnectionCodeRepository.test.js
  PatientConnectionCodeRepository - Unit Tests
    generateCode
      ✓ deve gerar um código de 6 dígitos (5 ms)
      ✓ deve gerar códigos diferentes em chamadas sucessivas (3 ms)
    createOrUpdate
      ✓ deve criar um novo código para o paciente (15 ms)
      ✓ deve criar código com expiração de 5 minutos (12 ms)
      ...

Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
Snapshots:   0 total
Time:        1.6 s
```

**✅ Sucesso:** Todos os 21 testes passando significa que:
- Códigos são gerados corretamente
- Expiração funciona (5 minutos)
- Validações estão ativas
- Códigos expirados são rejeitados
- Códigos usados são rejeitados
- Limpeza automática funciona

---

## 4. Auditoria de Logs

### 4.1 Consultar Logs de Segurança

```sql
-- Ver todas tentativas de acesso não autorizado
SELECT 
    created_at,
    action,
    description,
    user_id,
    ip,
    new_value->>'userType' as tipo_usuario,
    new_value->>'dataType' as tipo_dado,
    new_value->>'patientId' as paciente_tentado
FROM log
WHERE log_type = 'SECURITY'
  AND status = 'FAILURE'
ORDER BY created_at DESC
LIMIT 20;
```

### 4.2 Monitoramento em Tempo Real

```sql
-- Ver logs sendo criados em tempo real
-- Execute em um terminal SQL e deixe aberto
SELECT 
    NOW() as timestamp,
    action,
    description,
    ip
FROM log
WHERE created_at > NOW() - INTERVAL '1 minute'
  AND log_type = 'SECURITY'
ORDER BY created_at DESC;
```

Depois execute os testes de segurança em outro terminal e veja os logs aparecendo.

---

## 5. Cenários de Teste

### Cenário 1: Paciente Tentando Espionar Outro

**Situação:** João tenta ver os dados de Maria

**Passos:**
1. João faz login
2. João tenta acessar `/meal-calendar/monthly/MARIA_ID/2025/11`
3. Sistema BLOQUEIA
4. Log é criado

**Resultado Esperado:**
- HTTP 403 Forbidden
- Mensagem: "Você só pode acessar seus próprios dados"
- Log criado na tabela `log`

---

### Cenário 2: Nutricionista Tentando Ver Treinos

**Situação:** Ana (nutricionista) tenta ver treinos do João

**Passos:**
1. Ana faz login
2. Ana tenta acessar `/workout-calendar/monthly/JOAO_ID/2025/11`
3. Sistema BLOQUEIA
4. Log é criado

**Resultado Esperado:**
- HTTP 403 Forbidden
- Mensagem: "Apenas educadores físicos podem acessar dados de treino"
- Log com `dataType: 'workout'` e `userType: 'Nutricionist'`

---

### Cenário 3: Profissional Sem Associação

**Situação:** Ana tenta acessar Maria (sem associação)

**Passos:**
1. Ana faz login
2. Ana tenta acessar `/meal-calendar/monthly/MARIA_ID/2025/11`
3. Sistema verifica: não há associação entre Ana e Maria
4. Sistema BLOQUEIA
5. Log é criado

**Resultado Esperado:**
- HTTP 403 Forbidden
- Mensagem: "Você não está associado a este paciente"
- Log registrando tentativa

---

### Cenário 4: Acesso Legítimo

**Situação:** Ana acessa dados de refeição de João (associação ativa)

**Passos:**
1. Ana faz login
2. Ana acessa `/meal-calendar/monthly/JOAO_ID/2025/11`
3. Sistema verifica:
   - ✓ Token válido
   - ✓ Tipo de usuário: Nutricionist
   - ✓ Associação ativa existe
   - ✓ Ana está na associação
   - ✓ Tipo de dado (meal) compatível com Nutricionist
4. Sistema PERMITE acesso
5. Dados são retornados

**Resultado Esperado:**
- HTTP 200 OK
- JSON com os dados do calendário
- Log de sucesso (opcional)

---