# ============================================================================
# SCRIPT DE EXECUÇÃO - TESTES DE VALIDAÇÃO DE DADOS PLAUSÍVEIS (RNF2.0)
# ============================================================================
# Métrica: x = Nvalores_invalidos_detectados / Nvalores_invalidos_inseridos
# Requisito: x ≥ 1.0 (100%)
# ============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "`n╔════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                        ║" -ForegroundColor Cyan
Write-Host "║      TESTES DE VALIDAÇÃO DE DADOS PLAUSÍVEIS (RNF2.0)                 ║" -ForegroundColor Cyan
Write-Host "║                                                                        ║" -ForegroundColor Cyan
Write-Host "║      Métrica: x = Ndetectados / Ntotal                                ║" -ForegroundColor Cyan
Write-Host "║      Requisito: x ≥ 1.0 (100%)                                        ║" -ForegroundColor Cyan
Write-Host "║                                                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PRÉ-CHECAGENS
# ============================================================================

Write-Host "🔍 Realizando pré-checagens..." -ForegroundColor Yellow
Write-Host ""

# 1. Verificar Node.js
Write-Host "  [1/5] Verificando Node.js..." -ForegroundColor White
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "  Por favor, instale o Node.js: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✓ Node.js instalado: $nodeVersion" -ForegroundColor Green

# 2. Verificar npm
Write-Host "  [2/5] Verificando npm..." -ForegroundColor White
$npmVersion = npm --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ npm não encontrado!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ npm instalado: v$npmVersion" -ForegroundColor Green

# 3. Verificar node_modules
Write-Host "  [3/5] Verificando dependências..." -ForegroundColor White
if (-not (Test-Path "node_modules")) {
    Write-Host "  ⚠️  node_modules não encontrado. Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Falha ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  ✓ Dependências verificadas" -ForegroundColor Green

# 4. Verificar .env
Write-Host "  [4/5] Verificando arquivo .env..." -ForegroundColor White
if (-not (Test-Path ".env")) {
    Write-Host "  ⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "  Certifique-se de configurar as variáveis de ambiente." -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Arquivo .env encontrado" -ForegroundColor Green
}

# 5. Verificar PostgreSQL
Write-Host "  [5/5] Verificando PostgreSQL..." -ForegroundColor White
Write-Host "  ⚠️  Certifique-se de que o PostgreSQL está rodando (porta 5433)" -ForegroundColor Yellow
Write-Host "  💡 Execute: docker-compose up -d db" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# EXECUTAR TESTES
# ============================================================================

Write-Host "🧪 Iniciando testes de validação de dados..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Executar testes com variáveis de ambiente
$env:NODE_ENV = "test"
npm test -- tests/validation/data-validation.test.js --verbose --colors

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# ============================================================================
# RESULTADO
# ============================================================================

if ($exitCode -eq 0) {
    Write-Host "╔════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                                        ║" -ForegroundColor Green
    Write-Host "║                    ✅ Testes concluídos com sucesso!                   ║" -ForegroundColor Green
    Write-Host "║                                                                        ║" -ForegroundColor Green
    Write-Host "║  ✓ Sistema rejeita entradas inválidas corretamente                    ║" -ForegroundColor Green
    Write-Host "║  ✓ Validações de peso, altura e medidas funcionando                   ║" -ForegroundColor Green
    Write-Host "║  ✓ RNF2.0 ATENDIDO                                                    ║" -ForegroundColor Green
    Write-Host "║                                                                        ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "╔════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                                                                        ║" -ForegroundColor Red
    Write-Host "║                      ❌ Testes falharam!                               ║" -ForegroundColor Red
    Write-Host "║                                                                        ║" -ForegroundColor Red
    Write-Host "║  Possíveis causas:                                                     ║" -ForegroundColor Red
    Write-Host "║  1. PostgreSQL não está rodando (porta 5433)                          ║" -ForegroundColor Yellow
    Write-Host "║  2. Validações não implementadas nas rotas                            ║" -ForegroundColor Yellow
    Write-Host "║  3. Rota /body-measurement não existe ou está incorreta               ║" -ForegroundColor Yellow
    Write-Host "║  4. Tabela BodyMeasurement não existe no banco                        ║" -ForegroundColor Yellow
    Write-Host "║  5. Autenticação JWT falhou                                           ║" -ForegroundColor Yellow
    Write-Host "║                                                                        ║" -ForegroundColor Red
    Write-Host "║  🔧 Solução:                                                           ║" -ForegroundColor Cyan
    Write-Host "║  - Verificar logs acima para detalhes do erro                         ║" -ForegroundColor White
    Write-Host "║  - Executar: docker-compose up -d db                                  ║" -ForegroundColor White
    Write-Host "║  - Verificar rotas em src/routes/index.js                             ║" -ForegroundColor White
    Write-Host "║  - Verificar middleware de validação                                  ║" -ForegroundColor White
    Write-Host "║                                                                        ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
}

exit $exitCode
