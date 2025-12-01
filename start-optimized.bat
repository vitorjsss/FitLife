@echo off
REM ======================================================================
REM FitLife - Script de Inicializacao Otimizado para Windows
REM ======================================================================
REM Este script e otimizado para resolver problemas de timeout no Windows

setlocal enabledelayedexpansion

echo.
echo ================================================================
echo   FitLife - Modo Otimizado (Windows)
echo ================================================================
echo.

REM Detectar IP da rede WiFi (interface com Gateway configurado)
echo Detectando IP da rede...
set "NETWORK_IP="
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "$adapters = Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up'}; if ($adapters) { ($adapters | Select-Object -First 1).IPv4Address.IPAddress } else { (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -notlike '172.*' -and $_.PrefixOrigin -eq 'Dhcp'} | Select-Object -First 1).IPAddress }"') do (
    set "NETWORK_IP=%%a"
)

REM Fallback para metodo antigo se PowerShell falhar
if "%NETWORK_IP%"=="" (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "127.0.0.1"') do (
        set "NETWORK_IP=%%a"
        goto :ip_found
    )
)

:ip_found
for /f "tokens=* delims= " %%A in ("%NETWORK_IP%") do set "NETWORK_IP=%%A"

if "%NETWORK_IP%"=="" (
    echo ERRO: Nao foi possivel detectar o IP
    pause
    exit /b 1
)

echo IP detectado: %NETWORK_IP%

REM Criar/Atualizar .env preservando SendGrid se existir
echo Atualizando arquivo .env...

REM Verifica se .env existe e tem SendGrid configurado
set "SENDGRID_KEY="
set "SENDGRID_EMAIL="
set "SENDGRID_NAME="

if exist .env (
    for /f "tokens=1,* delims==" %%a in ('findstr "SENDGRID_API_KEY=" .env 2^>nul') do set "SENDGRID_KEY=%%b"
    for /f "tokens=1,* delims==" %%a in ('findstr "SENDGRID_FROM_EMAIL=" .env 2^>nul') do set "SENDGRID_EMAIL=%%b"
    for /f "tokens=1,* delims==" %%a in ('findstr "SENDGRID_FROM_NAME=" .env 2^>nul') do set "SENDGRID_NAME=%%b"
)

(
    echo # FitLife Environment Variables
    echo REACT_NATIVE_PACKAGER_HOSTNAME=%NETWORK_IP%
    echo JWT_SECRET=fitlife_secret_key_change_in_production_32chars
    echo JWT_REFRESH_SECRET=fitlife_refresh_secret_change_in_production_32chars
    echo.
    echo # SendGrid Configuration
    if not "%SENDGRID_KEY%"=="" (
        echo SENDGRID_API_KEY=%SENDGRID_KEY%
        echo SENDGRID_FROM_EMAIL=%SENDGRID_EMAIL%
        echo SENDGRID_FROM_NAME=%SENDGRID_NAME%
    ) else (
        echo # SENDGRID_API_KEY=sua_api_key_aqui
        echo # SENDGRID_FROM_EMAIL=seu_email@exemplo.com
        echo # SENDGRID_FROM_NAME=FitLife
    )
) > .env

echo Arquivo .env atualizado

REM Atualizar api.ts
set "API_FILE=%~dp0frontend\src\config\api.ts"
if exist "!API_FILE!" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip='%NETWORK_IP%'; $file='!API_FILE!'; $content = Get-Content $file -Raw; $content = $content -replace '(BASE_URL:\s*\u0022)[^\u0022]*\u0022', ('$1http://' + $ip + ':5001\u0022'); Set-Content $file $content"
    echo api.ts atualizado
)

REM Atualizar docker-compose.yml com o IP
echo Atualizando docker-compose.yml...
set "COMPOSE_FILE=%~dp0docker-compose.yml"
if exist "!COMPOSE_FILE!" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip='%NETWORK_IP%'; $file='!COMPOSE_FILE!'; $content = Get-Content $file -Raw; $content = $content -replace '(REACT_NATIVE_PACKAGER_HOSTNAME=)[0-9.]+', ('$1' + $ip); Set-Content $file $content"
    echo docker-compose.yml atualizado
)

REM Parar containers
echo.
echo Parando containers existentes...
docker-compose down >nul 2>&1

REM Limpar volumes (opcional)
set /p CLEAN="Deseja limpar volumes do banco? [s/N]: "
if /i "%CLEAN%"=="s" (
    docker-compose down -v
)

echo.
echo ================================================================
echo   Iniciando Servicos (pode demorar 2-3 minutos)
echo ================================================================
echo.

REM Iniciar banco de dados
echo [1/3] Iniciando PostgreSQL...
docker-compose up -d db
timeout /t 15 /nobreak >nul
echo PostgreSQL: OK

REM Iniciar backend
echo [2/3] Iniciando Backend...
docker-compose up -d backend
timeout /t 25 /nobreak >nul
echo Backend: OK

REM Verificar backend
curl -s http://localhost:5001/health/ping >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend: Funcionando!
) else (
    echo Backend: Inicializando... (pode levar mais tempo)
)

REM Iniciar frontend
echo [3/3] Iniciando Frontend (Expo)...
docker-compose up -d frontend
echo Frontend: Iniciando...

echo.
echo ================================================================
echo   Aguardando Expo inicializar...
echo   Isso pode demorar 1-2 minutos no Windows
echo ================================================================
echo.

timeout /t 30 /nobreak

echo.
echo ================================================================
echo   Projeto Iniciado!
echo ================================================================
echo.
echo ACESSO:
echo   - API: http://%NETWORK_IP%:5001
echo   - Expo: exp://%NETWORK_IP%:19000
echo.
echo COMANDOS UTEIS:
echo   - Ver QR Code: docker-compose logs -f frontend
echo   - Ver logs: docker-compose logs -f
echo   - Parar tudo: docker-compose down
echo.
echo ================================================================
echo.

set /p SHOW_LOGS="Ver logs do frontend agora? [S/n]: "
if /i not "%SHOW_LOGS%"=="n" (
    echo.
    echo Pressione Ctrl+C para sair
    echo.
    timeout /t 2 /nobreak >nul
    docker-compose logs -f frontend
)

pause
