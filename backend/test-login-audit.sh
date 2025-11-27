#!/bin/bash
# ============================================================================
# Script de Execução - Testes de Registro de Tentativas de Login
# ============================================================================
# Este script executa os testes de qualidade para a métrica:
# x = Ntentativas_registradas / Ntentativas_totais
# Requisito: x ≥ 1.0 (100%)
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
echo -e "${CYAN}║     TESTES DE QUALIDADE - REGISTRO DE TENTATIVAS DE LOGIN                 ║${RESET}"
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
echo -e "${CYAN}   ℹ Certifique-se de que o PostgreSQL está rodando (Docker ou local)${RESET}"
echo ""

# Executar testes
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║                           EXECUTANDO TESTES                                ║${RESET}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${RESET}"
echo ""

npm test -- tests/validation/login-audit.test.js

EXIT_CODE=$?

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${RESET}"

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}║                    ✅ Testes concluídos com sucesso!                       ║${RESET}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
    echo -e "${GREEN}   ✓ Todos os testes passaram!${RESET}"
    echo -e "${CYAN}   ℹ Métrica: x = Ntentativas_registradas / Ntentativas_totais${RESET}"
    echo -e "${GREEN}   ✓ Sistema confiável para auditoria de acessos${RESET}"
else
    echo -e "${RED}║                     ❌ Testes falharam!                                    ║${RESET}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
    echo -e "${RED}   ✗ Alguns testes não passaram${RESET}"
    echo -e "${YELLOW}   ⚠ Verifique o relatório acima para detalhes${RESET}"
    echo -e "${CYAN}   ℹ Consulte: backend/docs/TESTES-LOGIN-AUDIT.md${RESET}"
fi

echo ""
exit $EXIT_CODE
