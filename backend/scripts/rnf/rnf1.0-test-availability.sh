#!/bin/bash
# ============================================================================
# Script de Execução - Testes de Disponibilidade de Funcionalidades Críticas
# ============================================================================
# Este script executa os testes de qualidade para a métrica RNF1.0:
# X = (Ttotal - Tindisponibilidade) / Ttotal
# Requisito: X ≥ 0.90 (90%)
# ============================================================================

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
RESET='\033[0m'

# Banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║   TESTES DE DISPONIBILIDADE DE FUNCIONALIDADES CRÍTICAS (RNF1.0)          ║${RESET}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Verificar Node.js
echo -e "${YELLOW}🔍 Verificando Node.js...${RESET}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}   ✓ Node.js encontrado: $NODE_VERSION${RESET}"
else
    echo -e "${RED}   ✗ Node.js não encontrado!${RESET}"
    echo -e "${YELLOW}   Instale Node.js: https://nodejs.org/${RESET}"
    exit 1
fi

# Verificar dependências
echo -e "${YELLOW}🔍 Verificando dependências...${RESET}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}   ⚠ node_modules não encontrado. Executando npm install...${RESET}"
    npm install
else
    echo -e "${GREEN}   ✓ Dependências encontradas${RESET}"
fi

# Verificar banco de dados
echo -e "${YELLOW}🔍 Verificando conexão com banco de dados...${RESET}"
echo -e "${CYAN}   ℹ Certifique-se de que o PostgreSQL está rodando${RESET}"
echo -e "${CYAN}   ℹ Funcionalidades testadas: Login, Dietas, Treinos${RESET}"
echo ""

# Executar testes
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║                           EXECUTANDO TESTES                                ║${RESET}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${RESET}"
echo ""

npm test -- tests/validation/availability.test.js

EXIT_CODE=$?

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${RESET}"

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}║                    ✅ Testes concluídos com sucesso!                       ║${RESET}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
    echo -e "${GREEN}   ✓ Todos os testes passaram!${RESET}"
    echo -e "${CYAN}   ℹ Métrica: X = (Ttotal - Tindisponibilidade) / Ttotal${RESET}"
    echo -e "${GREEN}   ✓ Disponibilidade ≥ 90% - RNF1.0 ATENDIDO${RESET}"
    echo -e "${CYAN}   ℹ Funcionalidades críticas estão disponíveis${RESET}"
else
    echo -e "${RED}║                     ❌ Testes falharam!                                    ║${RESET}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
    echo -e "${RED}   ✗ Alguns testes não passaram${RESET}"
    echo -e "${YELLOW}   ⚠ Verifique o relatório acima para detalhes${RESET}"
    echo -e "${CYAN}   ℹ Possíveis causas:${RESET}"
    echo -e "${YELLOW}      - Banco de dados não conectado${RESET}"
    echo -e "${YELLOW}      - Rotas de API não implementadas${RESET}"
    echo -e "${YELLOW}      - Tempo de resposta > 2s${RESET}"
    echo -e "${YELLOW}      - Serviços instáveis${RESET}"
fi

echo ""
exit $EXIT_CODE
