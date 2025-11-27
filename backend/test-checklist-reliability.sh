#!/bin/bash

# ========================================================================
# SCRIPT PARA EXECUTAR TESTES DE CONFIABILIDADE DO CHECKLIST (RNF2.1)
# ========================================================================
# 
# Este script executa os testes automatizados que validam:
# - Taxa de Atualização Correta dos Cards (≥ 98%)
# - Atualização em tempo real
# - Reflexão visual do estado
# - Persistência dos dados
# - Histórico de marcações
# - Tratamento de erros
# 
# Uso: ./test-checklist-reliability.sh
# ========================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║       TESTES DE CONFIABILIDADE DO SISTEMA DE CHECKLIST (RNF2.1)           ║"
echo "║                                                                            ║"
echo "║  Métrica: Taxa de Atualização Correta dos Cards                           ║"
echo "║  Requisito: x ≥ 0,98 (98%)                                                ║"
echo "║  Fórmula: x = uc / ua                                                     ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script do diretório raiz do backend"
    exit 1
fi

# Verificar se o banco de dados está acessível
echo "🔍 Verificando conexão com o banco de dados..."
if ! npm run test:db-check 2>/dev/null; then
    echo "⚠️  Aviso: Não foi possível verificar a conexão com o banco"
    echo "   Continuando mesmo assim..."
fi

# Executar os testes
echo ""
echo "🧪 Executando testes de confiabilidade..."
echo ""

npm test -- tests/validation/checklist-reliability.test.js --verbose --colors

# Capturar o código de saída
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Testes concluídos com sucesso!"
else
    echo "❌ Alguns testes falharam. Revise o relatório acima."
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

exit $EXIT_CODE
