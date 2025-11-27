#!/bin/bash

# ============================================================================
# SCRIPT DE EXECUÇÃO - TESTES DE VALIDAÇÃO DE DADOS PLAUSÍVEIS (RNF2.0)
# ============================================================================
# Métrica: x = Nvalores_invalidos_detectados / Nvalores_invalidos_inseridos
# Requisito: x ≥ 1.0 (100%)
# ============================================================================

# Cores
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                                        ║${NC}"
echo -e "${CYAN}║      TESTES DE VALIDAÇÃO DE DADOS PLAUSÍVEIS (RNF2.0)                 ║${NC}"
echo -e "${CYAN}║                                                                        ║${NC}"
echo -e "${CYAN}║      Métrica: x = Ndetectados / Ntotal                                ║${NC}"
echo -e "${CYAN}║      Requisito: x ≥ 1.0 (100%)                                        ║${NC}"
echo -e "${CYAN}║                                                                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# PRÉ-CHECAGENS
# ============================================================================

echo -e "${YELLOW}🔍 Realizando pré-checagens...${NC}"
echo ""

# 1. Verificar Node.js
echo -e "${WHITE}  [1/5] Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}  ❌ Node.js não encontrado!${NC}"
    echo -e "${YELLOW}  Por favor, instale o Node.js: https://nodejs.org/${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}  ✓ Node.js instalado: $NODE_VERSION${NC}"

# 2. Verificar npm
echo -e "${WHITE}  [2/5] Verificando npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}  ❌ npm não encontrado!${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}  ✓ npm instalado: v$NPM_VERSION${NC}"

# 3. Verificar node_modules
echo -e "${WHITE}  [3/5] Verificando dependências...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}  ⚠️  node_modules não encontrado. Instalando dependências...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}  ❌ Falha ao instalar dependências!${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}  ✓ Dependências verificadas${NC}"

# 4. Verificar .env
echo -e "${WHITE}  [4/5] Verificando arquivo .env...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}  ⚠️  Arquivo .env não encontrado!${NC}"
    echo -e "${YELLOW}  Certifique-se de configurar as variáveis de ambiente.${NC}"
else
    echo -e "${GREEN}  ✓ Arquivo .env encontrado${NC}"
fi

# 5. Verificar PostgreSQL
echo -e "${WHITE}  [5/5] Verificando PostgreSQL...${NC}"
echo -e "${YELLOW}  ⚠️  Certifique-se de que o PostgreSQL está rodando (porta 5433)${NC}"
echo -e "${CYAN}  💡 Execute: docker-compose up -d db${NC}"
echo ""

# ============================================================================
# EXECUTAR TESTES
# ============================================================================

echo -e "${YELLOW}🧪 Iniciando testes de validação de dados...${NC}"
echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Executar testes com variáveis de ambiente
export NODE_ENV=test
npm test -- tests/validation/data-validation.test.js --verbose --colors

EXIT_CODE=$?

echo ""
echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================================================
# RESULTADO
# ============================================================================

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                        ║${NC}"
    echo -e "${GREEN}║                    ✅ Testes concluídos com sucesso!                   ║${NC}"
    echo -e "${GREEN}║                                                                        ║${NC}"
    echo -e "${GREEN}║  ✓ Sistema rejeita entradas inválidas corretamente                    ║${NC}"
    echo -e "${GREEN}║  ✓ Validações de peso, altura e medidas funcionando                   ║${NC}"
    echo -e "${GREEN}║  ✓ RNF2.0 ATENDIDO                                                    ║${NC}"
    echo -e "${GREEN}║                                                                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                                        ║${NC}"
    echo -e "${RED}║                      ❌ Testes falharam!                               ║${NC}"
    echo -e "${RED}║                                                                        ║${NC}"
    echo -e "${RED}║  Possíveis causas:                                                     ║${NC}"
    echo -e "${YELLOW}║  1. PostgreSQL não está rodando (porta 5433)                          ║${NC}"
    echo -e "${YELLOW}║  2. Validações não implementadas nas rotas                            ║${NC}"
    echo -e "${YELLOW}║  3. Rota /body-measurement não existe ou está incorreta               ║${NC}"
    echo -e "${YELLOW}║  4. Tabela BodyMeasurement não existe no banco                        ║${NC}"
    echo -e "${YELLOW}║  5. Autenticação JWT falhou                                           ║${NC}"
    echo -e "${RED}║                                                                        ║${NC}"
    echo -e "${CYAN}║  🔧 Solução:                                                           ║${NC}"
    echo -e "${WHITE}║  - Verificar logs acima para detalhes do erro                         ║${NC}"
    echo -e "${WHITE}║  - Executar: docker-compose up -d db                                  ║${NC}"
    echo -e "${WHITE}║  - Verificar rotas em src/routes/index.js                             ║${NC}"
    echo -e "${WHITE}║  - Verificar middleware de validação                                  ║${NC}"
    echo -e "${RED}║                                                                        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
fi

exit $EXIT_CODE
