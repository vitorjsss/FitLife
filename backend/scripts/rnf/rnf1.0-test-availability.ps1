#!/usr/bin/env pwsh
# ============================================================================
# Script de Execução - Testes de Disponibilidade de Funcionalidades Críticas
# ============================================================================
# Este script executa os testes de qualidade para a métrica RNF1.0:
# X = (Ttotal - Tindisponibilidade) / Ttotal
# Requisito: X ≥ 0.90 (90%)
# ============================================================================

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Cores
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Cyan = "`e[36m"
$Red = "`e[31m"
$Reset = "`e[0m"

# Banner
Write-Host ""
Write-Host "${Blue}╔════════════════════════════════════════════════════════════════════════════╗${Reset}"
Write-Host "${Cyan}║   TESTES DE DISPONIBILIDADE DE FUNCIONALIDADES CRÍTICAS (RNF1.0)          ║${Reset}"
Write-Host "${Blue}╚════════════════════════════════════════════════════════════════════════════╝${Reset}"
Write-Host ""

# Verificar Node.js
Write-Host "${Yellow}🔍 Verificando Node.js...${Reset}"
try {
    $nodeVersion = node --version
    Write-Host "${Green}   ✓ Node.js encontrado: $nodeVersion${Reset}"
} catch {
    Write-Host "${Red}   ✗ Node.js não encontrado!${Reset}"
    Write-Host "${Yellow}   Instale Node.js: https://nodejs.org/${Reset}"
    exit 1
}

# Verificar dependências
Write-Host "${Yellow}🔍 Verificando dependências...${Reset}"
if (-Not (Test-Path "node_modules")) {
    Write-Host "${Yellow}   ⚠ node_modules não encontrado. Executando npm install...${Reset}"
    npm install
} else {
    Write-Host "${Green}   ✓ Dependências encontradas${Reset}"
}

# Verificar banco de dados
Write-Host "${Yellow}🔍 Verificando conexão com banco de dados...${Reset}"
Write-Host "${Cyan}   ℹ Certifique-se de que o PostgreSQL está rodando${Reset}"
Write-Host "${Cyan}   ℹ Funcionalidades testadas: Login, Dietas, Treinos${Reset}"
Write-Host ""

# Executar testes
Write-Host "${Blue}╔════════════════════════════════════════════════════════════════════════════╗${Reset}"
Write-Host "${Cyan}║                           EXECUTANDO TESTES                                ║${Reset}"
Write-Host "${Blue}╚════════════════════════════════════════════════════════════════════════════╝${Reset}"
Write-Host ""

npm test -- tests/validation/availability.test.js

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "${Blue}╔════════════════════════════════════════════════════════════════════════════╗${Reset}"

if ($exitCode -eq 0) {
    Write-Host "${Green}║                    ✅ Testes concluídos com sucesso!                       ║${Reset}"
    Write-Host "${Blue}╚════════════════════════════════════════════════════════════════════════════╝${Reset}"
    Write-Host ""
    Write-Host "${Green}   ✓ Todos os testes passaram!${Reset}"
    Write-Host "${Cyan}   ℹ Métrica: X = (Ttotal - Tindisponibilidade) / Ttotal${Reset}"
    Write-Host "${Green}   ✓ Disponibilidade ≥ 90% - RNF1.0 ATENDIDO${Reset}"
    Write-Host "${Cyan}   ℹ Funcionalidades críticas estão disponíveis${Reset}"
} else {
    Write-Host "${Red}║                     ❌ Testes falharam!                                    ║${Reset}"
    Write-Host "${Blue}╚════════════════════════════════════════════════════════════════════════════╝${Reset}"
    Write-Host ""
    Write-Host "${Red}   ✗ Alguns testes não passaram${Reset}"
    Write-Host "${Yellow}   ⚠ Verifique o relatório acima para detalhes${Reset}"
    Write-Host "${Cyan}   ℹ Possíveis causas:${Reset}"
    Write-Host "${Yellow}      - Banco de dados não conectado${Reset}"
    Write-Host "${Yellow}      - Rotas de API não implementadas${Reset}"
    Write-Host "${Yellow}      - Tempo de resposta > 2s${Reset}"
    Write-Host "${Yellow}      - Serviços instáveis${Reset}"
}

Write-Host ""
exit $exitCode
