# Script PowerShell para rodar testes no Docker
Write-Host "Executando testes do FitLife..." -ForegroundColor Cyan

# Garantir que os containers estão rodando
Write-Host "Iniciando banco de dados..." -ForegroundColor Yellow
docker-compose up -d db

# Aguardar o banco de dados estar pronto
Start-Sleep -Seconds 5

# Executar os testes no container do backend
Write-Host "Rodando testes..." -ForegroundColor Yellow
docker-compose run --rm backend npm test

# Verificar resultado
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nTodos os testes passaram!" -ForegroundColor Green
} else {
    Write-Host "`nAlguns testes falharam. Código de saída: $LASTEXITCODE" -ForegroundColor Red
}

exit $LASTEXITCODE
