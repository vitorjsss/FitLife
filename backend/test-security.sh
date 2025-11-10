#!/bin/bash

# ═══════════════════════════════════════════════════════════════════
#  🔐 SCRIPT DE TESTES DE SEGURANÇA - FITLIFE BACKEND
#  Implementação conforme requisitos FMEA
# ═══════════════════════════════════════════════════════════════════

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5001"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Função para imprimir cabeçalho
print_header() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo -e "  ${BLUE}$1${NC}"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
}

# Função para teste
run_test() {
    local test_name="$1"
    local expected_status="$2"
    local actual_status="$3"
    local description="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo "TESTE $TOTAL_TESTS: $test_name"
    echo "→ $description"
    
    if [ "$actual_status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSOU${NC} - Status: $actual_status (Esperado: $expected_status)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FALHOU${NC} - Status: $actual_status (Esperado: $expected_status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Verificar se jq está instalado
if ! command -v jq &> /dev/null; then
    echo -e "${RED}ERRO: jq não está instalado${NC}"
    echo "Instale com: brew install jq (macOS) ou apt-get install jq (Linux)"
    exit 1
fi

# Verificar se servidor está rodando
if ! curl -s "$BASE_URL/health" > /dev/null; then
    echo -e "${RED}ERRO: Servidor não está respondendo em $BASE_URL${NC}"
    echo "Inicie o servidor com: npm start"
    exit 1
fi

print_header "🔐 TESTES DE SEGURANÇA - FITLIFE BACKEND"

echo "URL Base: $BASE_URL"
echo "Data: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ═══════════════════════════════════════════════════════════════════
# FASE 1: LOGIN DOS USUÁRIOS DE TESTE
# ═══════════════════════════════════════════════════════════════════

print_header "FASE 1: Autenticação dos Usuários de Teste"

# Login João (Paciente)
echo "→ Login: João (Paciente)"
JOAO_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teste.joao@fitlife.com","password":"senha123"}')

JOAO_TOKEN=$(echo $JOAO_RESPONSE | jq -r '.accessToken')

if [ "$JOAO_TOKEN" != "null" ] && [ -n "$JOAO_TOKEN" ]; then
    echo -e "${GREEN}✓ João logado com sucesso${NC}"
    echo "  Token: ${JOAO_TOKEN:0:20}..."
else
    echo -e "${RED}✗ Falha no login de João${NC}"
    echo "  Response: $JOAO_RESPONSE"
    echo ""
    echo -e "${YELLOW}AVISO: Certifique-se de executar o script SQL de criação de usuários de teste${NC}"
    echo "  Ver: docs/GUIA-COMPLETO-TESTES-SEGURANCA.md (Seção 2.2)"
    exit 1
fi

echo ""

# Login Maria (Paciente)
echo "→ Login: Maria (Paciente)"
MARIA_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teste.maria@fitlife.com","password":"senha123"}')

MARIA_TOKEN=$(echo $MARIA_RESPONSE | jq -r '.accessToken')

if [ "$MARIA_TOKEN" != "null" ] && [ -n "$MARIA_TOKEN" ]; then
    echo -e "${GREEN}✓ Maria logada com sucesso${NC}"
    echo "  Token: ${MARIA_TOKEN:0:20}..."
else
    echo -e "${RED}✗ Falha no login de Maria${NC}"
    exit 1
fi

echo ""

# Login Ana (Nutricionista)
echo "→ Login: Ana (Nutricionista)"
ANA_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teste.ana@fitlife.com","password":"senha123"}')

ANA_TOKEN=$(echo $ANA_RESPONSE | jq -r '.accessToken')
ANA_PROFESSIONAL_ID=$(echo $ANA_RESPONSE | jq -r '.professionalId')

if [ "$ANA_TOKEN" != "null" ] && [ -n "$ANA_TOKEN" ]; then
    echo -e "${GREEN}✓ Ana logada com sucesso${NC}"
    echo "  Token: ${ANA_TOKEN:0:20}..."
    echo "  ProfessionalId: $ANA_PROFESSIONAL_ID"
else
    echo -e "${RED}✗ Falha no login de Ana${NC}"
    exit 1
fi

echo ""

# Login Carlos (Educador)
echo "→ Login: Carlos (Educador Físico)"
CARLOS_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teste.carlos@fitlife.com","password":"senha123"}')

CARLOS_TOKEN=$(echo $CARLOS_RESPONSE | jq -r '.accessToken')
CARLOS_PROFESSIONAL_ID=$(echo $CARLOS_RESPONSE | jq -r '.professionalId')

if [ "$CARLOS_TOKEN" != "null" ] && [ -n "$CARLOS_TOKEN" ]; then
    echo -e "${GREEN}✓ Carlos logado com sucesso${NC}"
    echo "  Token: ${CARLOS_TOKEN:0:20}..."
    echo "  ProfessionalId: $CARLOS_PROFESSIONAL_ID"
else
    echo -e "${RED}✗ Falha no login de Carlos${NC}"
    exit 1
fi

echo ""

# IDs dos pacientes (devem corresponder aos criados no SQL)
JOAO_ID="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
MARIA_ID="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"

# ═══════════════════════════════════════════════════════════════════
# FASE 2: TESTES DE AUTORIZAÇÃO
# ═══════════════════════════════════════════════════════════════════

print_header "FASE 2: Testes de Controle de Acesso"

# ───────────────────────────────────────────────────────────────────
# TESTE 1: Paciente acessando próprios dados (PERMITIDO)
# ───────────────────────────────────────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/meal-calendar/monthly/$JOAO_ID/2025/11" \
  -H "Authorization: Bearer $JOAO_TOKEN")

run_test \
  "Paciente acessando próprios dados de refeição" \
  "200" \
  "$STATUS" \
  "João → /meal-calendar/monthly/$JOAO_ID/2025/11"

# ───────────────────────────────────────────────────────────────────
# TESTE 2: Paciente tentando acessar dados de outro (BLOQUEADO)
# ───────────────────────────────────────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/meal-calendar/monthly/$MARIA_ID/2025/11" \
  -H "Authorization: Bearer $JOAO_TOKEN")

run_test \
  "Paciente tentando acessar dados de outro paciente" \
  "403" \
  "$STATUS" \
  "João → /meal-calendar/monthly/$MARIA_ID/2025/11 (DEVE SER BLOQUEADO)"

# ───────────────────────────────────────────────────────────────────
# TESTE 3: Nutricionista com associação acessando refeições (PERMITIDO)
# ───────────────────────────────────────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/meal-calendar/monthly/$JOAO_ID/2025/11" \
  -H "Authorization: Bearer $ANA_TOKEN")

run_test \
  "Nutricionista acessando dados de refeição (com associação)" \
  "200" \
  "$STATUS" \
  "Ana (Nutricionista) → /meal-calendar/monthly/$JOAO_ID/2025/11"

# ───────────────────────────────────────────────────────────────────
# TESTE 4: Nutricionista tentando acessar treinos (BLOQUEADO)
# ───────────────────────────────────────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/workout-calendar/monthly/$JOAO_ID/2025/11" \
  -H "Authorization: Bearer $ANA_TOKEN")

run_test \
  "Nutricionista tentando acessar dados de treino" \
  "403" \
  "$STATUS" \
  "Ana → /workout-calendar/monthly/$JOAO_ID/2025/11 (TIPO INCOMPATÍVEL)"

# ───────────────────────────────────────────────────────────────────
# TESTE 5: Educador com associação acessando treinos (PERMITIDO)
# ───────────────────────────────────────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/workout-calendar/monthly/$JOAO_ID/2025/11" \
  -H "Authorization: Bearer $CARLOS_TOKEN")

run_test \
  "Educador Físico acessando dados de treino (com associação)" \
  "200" \
  "$STATUS" \
  "Carlos (Educador) → /workout-calendar/monthly/$JOAO_ID/2025/11"

# ───────────────────────────────────────────────────────────────────
# TESTE 6: Educador tentando acessar refeições (BLOQUEADO)
# ───────────────────────────────────────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/meal-calendar/monthly/$JOAO_ID/2025/11" \
  -H "Authorization: Bearer $CARLOS_TOKEN")

run_test \
  "Educador Físico tentando acessar dados de refeição" \
  "403" \
  "$STATUS" \
  "Carlos → /meal-calendar/monthly/$JOAO_ID/2025/11 (TIPO INCOMPATÍVEL)"

# ───────────────────────────────────────────────────────────────────
# TESTE 7: Nutricionista sem associação (BLOQUEADO)
# ───────────────────────────────────────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/meal-calendar/monthly/$MARIA_ID/2025/11" \
  -H "Authorization: Bearer $ANA_TOKEN")

run_test \
  "Nutricionista tentando acessar paciente sem associação" \
  "403" \
  "$STATUS" \
  "Ana → /meal-calendar/monthly/$MARIA_ID/2025/11 (SEM ASSOCIAÇÃO)"

# ───────────────────────────────────────────────────────────────────
# TESTE 8: Educador sem associação (BLOQUEADO)
# ───────────────────────────────────────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/workout-calendar/monthly/$MARIA_ID/2025/11" \
  -H "Authorization: Bearer $CARLOS_TOKEN")

run_test \
  "Educador tentando acessar paciente sem associação" \
  "403" \
  "$STATUS" \
  "Carlos → /workout-calendar/monthly/$MARIA_ID/2025/11 (SEM ASSOCIAÇÃO)"

# ───────────────────────────────────────────────────────────────────
# TESTE 9: Requisição sem token (BLOQUEADO)
# ───────────────────────────────────────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/meal-calendar/monthly/$JOAO_ID/2025/11")

run_test \
  "Requisição sem token de autenticação" \
  "401" \
  "$STATUS" \
  "Sem Authorization header → /meal-calendar/monthly/... (SEM TOKEN)"

# ═══════════════════════════════════════════════════════════════════
# FASE 3: RELATÓRIO FINAL
# ═══════════════════════════════════════════════════════════════════

print_header "📊 RELATÓRIO FINAL DE TESTES"

echo "Total de Testes Executados: $TOTAL_TESTS"
echo -e "Testes Aprovados: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Testes Falhados: ${RED}$FAILED_TESTS${NC}"
echo ""

# Calcular taxa de sucesso
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "Taxa de Sucesso: $SUCCESS_RATE%"
else
    SUCCESS_RATE=0
fi

echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ TODOS OS TESTES PASSARAM!${NC}"
    echo -e "${GREEN}  Sistema de segurança está funcionando corretamente.${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
else
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ✗ ALGUNS TESTES FALHARAM!${NC}"
    echo -e "${RED}  Verifique a implementação do middleware de segurança.${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo ""
fi

# ═══════════════════════════════════════════════════════════════════
# FASE 4: VERIFICAÇÃO DE LOGS DE AUDITORIA
# ═══════════════════════════════════════════════════════════════════

print_header "📝 Verificação de Logs de Auditoria"

echo "Para verificar os logs de segurança no banco de dados, execute:"
echo ""
echo -e "${YELLOW}psql -h localhost -p 5433 -U postgres -d fitlife -c \"${NC}"
echo -e "${YELLOW}SELECT created_at, action, description, ip ${NC}"
echo -e "${YELLOW}FROM log ${NC}"
echo -e "${YELLOW}WHERE log_type = 'SECURITY' AND status = 'FAILURE' ${NC}"
echo -e "${YELLOW}ORDER BY created_at DESC LIMIT 10;\"${NC}"
echo ""

echo "Ou use a consulta mais detalhada:"
echo ""
echo -e "${YELLOW}psql -h localhost -p 5433 -U postgres -d fitlife -c \"${NC}"
echo -e "${YELLOW}SELECT ${NC}"
echo -e "${YELLOW}  created_at,${NC}"
echo -e "${YELLOW}  new_value->>'userType' as tipo_usuario,${NC}"
echo -e "${YELLOW}  new_value->>'dataType' as tipo_dado,${NC}"
echo -e "${YELLOW}  description,${NC}"
echo -e "${YELLOW}  ip${NC}"
echo -e "${YELLOW}FROM log ${NC}"
echo -e "${YELLOW}WHERE log_type = 'SECURITY' ${NC}"
echo -e "${YELLOW}  AND created_at > NOW() - INTERVAL '5 minutes'${NC}"
echo -e "${YELLOW}ORDER BY created_at DESC;\"${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════
# ANÁLISE FMEA
# ═══════════════════════════════════════════════════════════════════

print_header "📊 Análise FMEA - Redução de Risco"

echo "ANTES DA IMPLEMENTAÇÃO:"
echo "  • Probabilidade (P): 3"
echo "  • Severidade (S): 5"
echo "  • Risco: 15 (ALTO)"
echo ""
echo "DEPOIS DA IMPLEMENTAÇÃO:"
echo "  • Probabilidade (P): 1 (Middleware bloqueia acessos não autorizados)"
echo "  • Severidade (S): 2 (Apenas logs são gerados, sem vazamento de dados)"
echo "  • Risco: 2 (BAIXO)"
echo ""
echo "REDUÇÃO DE RISCO: 86.7% (de 15 para 2)"
echo ""

# ═══════════════════════════════════════════════════════════════════
# FIM
# ═══════════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Testes concluídos em: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Código de saída
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi
