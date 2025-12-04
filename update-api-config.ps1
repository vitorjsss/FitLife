param(
    [string]$IpAddress,
    [string]$ApiFilePath
)

# Ler o conteúdo do arquivo
$content = Get-Content -Path $ApiFilePath -Raw

# Substituir o IP na BASE_URL
$pattern = '(BASE_URL:\s*")http://[^":]+(:\d+")' 
$replacement = "`${1}http://$IpAddress`${2}"
$newContent = $content -replace $pattern, $replacement

# Salvar o arquivo
Set-Content -Path $ApiFilePath -Value $newContent -NoNewline

Write-Host "api.ts atualizado com IP: $IpAddress"
