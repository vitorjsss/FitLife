#!/usr/bin/env pwsh
# ============================================================================
# Script de Execução - Testes de Registro de Tentativas de Login
# ============================================================================
# Este script executa os testes de qualidade para a métrica:
# x = Ntentativas_registradas / Ntentativas_totais
# Requisito: x ≥ 1.0 (100%)
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
Write-Host "${Cyan}║     TESTES DE QUALIDADE - REGISTRO DE TENTATIVAS DE LOGIN                 ║${Reset}"
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
Write-Host "${Cyan}   ℹ Certifique-se de que o PostgreSQL está rodando (Docker ou local)${Reset}"
Write-Host ""

# Executar testes
Write-Host "${Blue}╔════════════════════════════════════════════════════════════════════════════╗${Reset}"
Write-Host "${Cyan}║                           EXECUTANDO TESTES                                ║${Reset}"
Write-Host "${Blue}╚════════════════════════════════════════════════════════════════════════════╝${Reset}"
Write-Host ""

npm test -- tests/validation/login-audit.test.js

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "${Blue}╔════════════════════════════════════════════════════════════════════════════╗${Reset}"

if ($exitCode -eq 0) {
    Write-Host "${Green}║                    ✅ Testes concluídos com sucesso!                       ║${Reset}"
    Write-Host "${Blue}╚════════════════════════════════════════════════════════════════════════════╝${Reset}"
    Write-Host ""
    Write-Host "${Green}   ✓ Todos os testes passaram!${Reset}"
    Write-Host "${Cyan}   ℹ Métrica: x = Ntentativas_registradas / Ntentativas_totais${Reset}"
    Write-Host "${Green}   ✓ Sistema confiável para auditoria de acessos${Reset}"
} else {
    Write-Host "${Red}║                     ❌ Testes falharam!                                    ║${Reset}"
    Write-Host "${Blue}╚════════════════════════════════════════════════════════════════════════════╝${Reset}"
    Write-Host ""
    Write-Host "${Red}   ✗ Alguns testes não passaram${Reset}"
    Write-Host "${Yellow}   ⚠ Verifique o relatório acima para detalhes${Reset}"
    Write-Host "${Cyan}   ℹ Consulte: backend/docs/TESTES-LOGIN-AUDIT.md${Reset}"
}

Write-Host ""
exit $exitCode
