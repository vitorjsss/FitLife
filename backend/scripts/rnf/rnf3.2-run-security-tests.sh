#!/bin/bash

# Script de Testes de Segurança - FitLife Backend
# Executa todos os cenários de teste descritos no TESTE-SEGURANCA-README.md

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'F
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
DB_HOST="localhost"
DB_PORT="5433"
DB_USER="fitlife"
DB_PASSWORD="fitlife"
DB_NAME="fitlife"
BACKEND_URL="http://localhost:5001"

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Testes de Segurança - FitLife Backend${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================
# FUNÇÕES AUXILIARES
# ============================================

print_step() {
    echo -e "${BLUE}[$1] $2${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# ============================================
# ETAPA 0: RESET DO AMBIENTE
# ============================================

reset_environment() {
  echo "========================================"
  echo "  [0/6] Resetando ambiente de teste..."
  echo "========================================"

  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<'EOF' 2>/dev/null || true
-- Limpar dados de teste na ordem correta (das tabelas dependentes para as principais)

-- 1. Limpar associações primeiro (dependem de patient, nutricionist e physical_educator)
DELETE FROM patient_professional_association 
WHERE patient_id IN (SELECT id FROM patient WHERE auth_id IN (SELECT id FROM auth WHERE email LIKE 'teste.%@fitlife.com'));

-- 2. Limpar pacientes (dependem de auth)
DELETE FROM patient WHERE auth_id IN (SELECT id FROM auth WHERE email LIKE 'teste.%@fitlife.com');

-- 3. Limpar nutricionista (depende de auth)
DELETE FROM nutricionist WHERE auth_id IN (SELECT id FROM auth WHERE email LIKE 'teste.%@fitlife.com');

-- 4. Limpar educador físico (depende de auth)
DELETE FROM physical_educator WHERE auth_id IN (SELECT id FROM auth WHERE email LIKE 'teste.%@fitlife.com');

-- 5. Por último, limpar auth (tabela principal)
DELETE FROM auth WHERE email LIKE 'teste.%@fitlife.com';
EOF

  echo -e "${GREEN}✓ Ambiente resetado com sucesso${NC}"
  echo ""
}

# ============================================
# ETAPA 1: VERIFICAR BACKEND
# ============================================

check_backend() {
    print_step "1/6" "Verificando backend..."
    if ! curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
        print_error "Backend não está respondendo em $BACKEND_URL"
        print_warning "Execute: docker-compose up -d"
        exit 1
    fi
    print_success "Backend está rodando"
    echo ""
}

# ============================================
# ETAPA 2: VERIFICAR BANCO DE DADOS
# ============================================

check_database() {
    print_step "2/6" "Verificando banco de dados..."
    if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        print_error "Não foi possível conectar ao banco de dados"
        print_warning "Execute: docker-compose up -d db"
        exit 1
    fi
    print_success "Banco de dados acessível"
    echo ""
}

# ============================================
# ETAPA 3: CRIAR USUÁRIOS DE TESTE
# ============================================

create_test_users() {
    print_step "3/6" "Criando usuários de teste..."
    
    # Criar usuários via API (que gera o hash automaticamente)
    echo "  Criando usuário João..."
    JOAO_AUTH_ID=$(curl -s -X POST "$BACKEND_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"username":"joao_paciente","email":"teste.joao@fitlife.com","password":"senha123","user_type":"Patient"}' \
        | jq -r '.id')
    
    if [ -z "$JOAO_AUTH_ID" ] || [ "$JOAO_AUTH_ID" = "null" ]; then
        print_error "Falha ao criar usuário João"
        exit 1
    fi
    
    echo "  Criando usuário Maria..."
    MARIA_AUTH_ID=$(curl -s -X POST "$BACKEND_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"username":"maria_paciente","email":"teste.maria@fitlife.com","password":"senha123","user_type":"Patient"}' \
        | jq -r '.id')
    
    if [ -z "$MARIA_AUTH_ID" ] || [ "$MARIA_AUTH_ID" = "null" ]; then
        print_error "Falha ao criar usuário Maria"
        exit 1
    fi
    
    echo "  Criando usuário Ana..."
    ANA_AUTH_ID=$(curl -s -X POST "$BACKEND_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"username":"ana_nutri","email":"teste.ana@fitlife.com","password":"senha123","user_type":"Nutricionist"}' \
        | jq -r '.id')
    
    if [ -z "$ANA_AUTH_ID" ] || [ "$ANA_AUTH_ID" = "null" ]; then
        print_error "Falha ao criar usuário Ana"
        exit 1
    fi
    
    echo "  Criando usuário Carlos..."
    CARLOS_AUTH_ID=$(curl -s -X POST "$BACKEND_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"username":"carlos_educador","email":"teste.carlos@fitlife.com","password":"senha123","user_type":"Physical_educator"}' \
        | jq -r '.id')
    
    if [ -z "$CARLOS_AUTH_ID" ] || [ "$CARLOS_AUTH_ID" = "null" ]; then
        print_error "Falha ao criar usuário Carlos"
        exit 1
    fi
    
    # Criar perfis e associações via SQL (usando os IDs gerados)
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Criar perfis de pacientes
INSERT INTO patient (id, name, birthdate, sex, contact, auth_id) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'João da Silva', '1990-01-15', 'M', '11999999999', '$JOAO_AUTH_ID'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Maria Santos', '1995-06-20', 'F', '11888888888', '$MARIA_AUTH_ID');

-- Criar nutricionista
INSERT INTO nutricionist (id, name, birthdate, sex, contact, crn, auth_id) VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Ana Nutricionista', '1985-03-10', 'F', '11777777777', 'CRN12345', '$ANA_AUTH_ID');

-- Criar educador físico
INSERT INTO physical_educator (id, name, birthdate, sex, contact, cref, auth_id) VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Carlos Educador', '1988-08-25', 'M', '11666666666', 'CREF67890', '$CARLOS_AUTH_ID');

-- Criar associação única com ambos os profissionais
INSERT INTO patient_professional_association (id, patient_id, nutricionist_id, physical_educator_id, created_at) VALUES
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW());
EOF
    
    if [ $? -eq 0 ]; then
        print_success "Usuários de teste criados com sucesso"
        print_success "  • João (Paciente): teste.joao@fitlife.com / senha123"
        print_success "  • Maria (Paciente): teste.maria@fitlife.com / senha123"
        print_success "  • Ana (Nutricionista): teste.ana@fitlife.com / senha123"
        print_success "  • Carlos (Educador): teste.carlos@fitlife.com / senha123"
    else
        print_error "Falha ao criar perfis e associações"
        exit 1
    fi
    echo ""
}

# ============================================
# ETAPA 4: FAZER LOGIN E OBTER TOKENS
# ============================================

do_login() {
    print_step "4/6" "Fazendo login dos usuários..."
    
    # Login João
    JOAO_TOKEN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"teste.joao@fitlife.com","password":"senha123"}' \
        | jq -r '.accessToken')
    
    if [ -z "$JOAO_TOKEN" ] || [ "$JOAO_TOKEN" = "null" ]; then
        print_error "Falha no login de João"
        exit 1
    fi
    print_success "Login João: OK"
    
    # Login Maria
    MARIA_TOKEN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"teste.maria@fitlife.com","password":"senha123"}' \
        | jq -r '.accessToken')
    
    if [ -z "$MARIA_TOKEN" ] || [ "$MARIA_TOKEN" = "null" ]; then
        print_error "Falha no login de Maria"
        exit 1
    fi
    print_success "Login Maria: OK"
    
    # Login Ana
    ANA_TOKEN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"teste.ana@fitlife.com","password":"senha123"}' \
        | jq -r '.accessToken')
    
    if [ -z "$ANA_TOKEN" ] || [ "$ANA_TOKEN" = "null" ]; then
        print_error "Falha no login de Ana"
        exit 1
    fi
    print_success "Login Ana: OK"
    
    # Login Carlos
    CARLOS_TOKEN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"teste.carlos@fitlife.com","password":"senha123"}' \
        | jq -r '.accessToken')
    
    if [ -z "$CARLOS_TOKEN" ] || [ "$CARLOS_TOKEN" = "null" ]; then
        print_error "Falha no login de Carlos"
        exit 1
    fi
    print_success "Login Carlos: OK"
    echo ""
}

# ============================================
# ETAPA 5: EXECUTAR TESTES DE SEGURANÇA
# ============================================

run_security_tests() {
    print_step "5/6" "Executando testes de segurança..."
    echo ""
    
    # Teste 1: João acessa seus próprios dados de refeições (DEVE FUNCIONAR)
    echo -e "${YELLOW}Teste 1:${NC} João acessa seus próprios dados de refeições"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X GET "$BACKEND_URL/meal-calendar/monthly/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/2025/11" \
        -H "Authorization: Bearer $JOAO_TOKEN")
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Passou (200 OK)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Falhou (HTTP $HTTP_CODE, esperado 200)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
    
    # Teste 2: João tenta acessar dados da Maria (DEVE BLOQUEAR)
    echo -e "${YELLOW}Teste 2:${NC} João tenta acessar dados da Maria"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X GET "$BACKEND_URL/meal-calendar/monthly/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/2025/11" \
        -H "Authorization: Bearer $JOAO_TOKEN")
    
    if [ "$HTTP_CODE" = "403" ]; then
        print_success "Passou (403 Forbidden - acesso bloqueado corretamente)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Falhou (HTTP $HTTP_CODE, esperado 403)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
    
    # Teste 3: Ana acessa refeições do João (DEVE FUNCIONAR - tem associação)
    echo -e "${YELLOW}Teste 3:${NC} Ana (nutricionista) acessa refeições do João"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X GET "$BACKEND_URL/meal-calendar/monthly/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/2025/11" \
        -H "Authorization: Bearer $ANA_TOKEN")
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Passou (200 OK - acesso autorizado)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Falhou (HTTP $HTTP_CODE, esperado 200)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
    
    # Teste 4: Ana tenta acessar treinos do João (DEVE BLOQUEAR - tipo incompatível)
    echo -e "${YELLOW}Teste 4:${NC} Ana (nutricionista) tenta acessar treinos"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X GET "$BACKEND_URL/workout-calendar/monthly/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/2025/11" \
        -H "Authorization: Bearer $ANA_TOKEN")
    
    if [ "$HTTP_CODE" = "403" ]; then
        print_success "Passou (403 Forbidden - tipo de dado incompatível)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Falhou (HTTP $HTTP_CODE, esperado 403)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
    
    # Teste 5: Carlos acessa treinos do João (DEVE FUNCIONAR - tem associação)
    echo -e "${YELLOW}Teste 5:${NC} Carlos (educador) acessa treinos do João"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X GET "$BACKEND_URL/workout-calendar/monthly/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/2025/11" \
        -H "Authorization: Bearer $CARLOS_TOKEN")
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Passou (200 OK - acesso autorizado)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Falhou (HTTP $HTTP_CODE, esperado 200)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
    
    # Teste 6: Carlos tenta acessar refeições do João (DEVE BLOQUEAR - tipo incompatível)
    echo -e "${YELLOW}Teste 6:${NC} Carlos (educador) tenta acessar refeições"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X GET "$BACKEND_URL/meal-calendar/monthly/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/2025/11" \
        -H "Authorization: Bearer $CARLOS_TOKEN")
    
    if [ "$HTTP_CODE" = "403" ]; then
        print_success "Passou (403 Forbidden - tipo de dado incompatível)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Falhou (HTTP $HTTP_CODE, esperado 403)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
    
    # Teste 7: Ana tenta acessar dados da Maria (DEVE BLOQUEAR - sem associação)
    echo -e "${YELLOW}Teste 7:${NC} Ana tenta acessar dados da Maria (sem associação)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X GET "$BACKEND_URL/meal-calendar/monthly/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/2025/11" \
        -H "Authorization: Bearer $ANA_TOKEN")
    
    if [ "$HTTP_CODE" = "403" ]; then
        print_success "Passou (403 Forbidden - sem associação)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Falhou (HTTP $HTTP_CODE, esperado 403)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# ============================================
# ETAPA 6: VERIFICAR LOGS DE AUDITORIA
# ============================================

check_audit_logs() {
    print_step "6/6" "Verificando logs de auditoria..."
    
    # Verificar se a tabela log existe
    TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'log'
        );
    " 2>/dev/null | tr -d ' ')
    
    if [ "$TABLE_EXISTS" = "t" ]; then
        LOG_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
            SELECT COUNT(*) FROM log WHERE log_type = 'SECURITY';
        " 2>/dev/null | tr -d ' ')
        
        if [ ! -z "$LOG_COUNT" ] && [ "$LOG_COUNT" -gt 0 ]; then
            print_success "Foram criados $LOG_COUNT logs de segurança"
            echo ""
            echo -e "${BLUE}Últimos 5 logs de segurança:${NC}"
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
                SELECT 
                    created_at::timestamp(0) as hora,
                    description
                FROM log
                WHERE log_type = 'SECURITY'
                ORDER BY created_at DESC
                LIMIT 5;
            "
        else
            print_warning "Nenhum log de segurança foi criado (tabela 'log' existe mas está vazia)"
        fi
    else
        print_warning "Tabela 'log' não existe no banco de dados"
        print_warning "Os logs de auditoria não estão sendo armazenados"
    fi
    echo ""
}

# ============================================
# RELATÓRIO FINAL
# ============================================

print_report() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  RELATÓRIO FINAL${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "Total de testes:  $TOTAL_TESTS"
    echo -e "${GREEN}Testes passaram:  $PASSED_TESTS${NC}"
    echo -e "${RED}Testes falharam:  $FAILED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  ✓ TODOS OS TESTES PASSARAM!${NC}"
        echo -e "${GREEN}  Sistema de segurança funcionando corretamente${NC}"
        echo -e "${GREEN}========================================${NC}"
        exit 0
    else
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}  ✗ ALGUNS TESTES FALHARAM${NC}"
        echo -e "${RED}  Verifique os erros acima${NC}"
        echo -e "${RED}========================================${NC}"
        exit 1
    fi
}

# ============================================
# EXECUÇÃO PRINCIPAL
# ============================================

reset_environment
check_backend
check_database
create_test_users
do_login
run_security_tests
check_audit_logs
print_report
