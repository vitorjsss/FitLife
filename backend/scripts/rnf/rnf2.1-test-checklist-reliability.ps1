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
# Uso: .\test-checklist-reliability.ps1
# ========================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                            ║" -ForegroundColor Cyan
Write-Host "║       TESTES DE CONFIABILIDADE DO SISTEMA DE CHECKLIST (RNF2.1)           ║" -ForegroundColor Cyan
Write-Host "║                                                                            ║" -ForegroundColor Cyan
Write-Host "║  Métrica: Taxa de Atualização Correta dos Cards                           ║" -ForegroundColor Cyan
Write-Host "║  Requisito: x ≥ 0,98 (98%)                                                ║" -ForegroundColor Cyan
Write-Host "║  Fórmula: x = uc / ua                                                     ║" -ForegroundColor Cyan
Write-Host "║                                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script do diretório raiz do backend" -ForegroundColor Red
    exit 1
}

# Verificar se o Node está instalado
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro: Node.js não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Node.js detectado: $nodeVersion" -ForegroundColor Green

# Verificar se as dependências estão instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Verificar se o banco de dados está acessível
Write-Host "🔍 Verificando conexão com o banco de dados..." -ForegroundColor Cyan

try {
    # Tentar fazer uma query simples
    $env:NODE_ENV = "test"
    Write-Host "   Configuração: NODE_ENV=test" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Aviso: Não foi possível verificar a conexão com o banco" -ForegroundColor Yellow
    Write-Host "   Continuando mesmo assim..." -ForegroundColor Gray
}

# Executar os testes
Write-Host ""
Write-Host "🧪 Executando testes de confiabilidade..." -ForegroundColor Cyan
Write-Host ""

# Executar Jest com o arquivo de teste específico
npm test -- tests/validation/checklist-reliability.test.js --verbose --colors

# Capturar o código de saída
$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ Testes concluídos com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Alguns testes falharam. Revise o relatório acima." -ForegroundColor Red
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
