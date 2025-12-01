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

REM Detectar IP
echo Detectando IP da rede...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "127.0.0.1"') do (
    set "NETWORK_IP=%%a"
    goto :ip_found
)

:ip_found
for /f "tokens=* delims= " %%A in ("%NETWORK_IP%") do set "NETWORK_IP=%%A"

if "%NETWORK_IP%"=="" (
    echo ERRO: Nao foi possivel detectar o IP
    pause
    exit /b 1
)

echo IP detectado: %NETWORK_IP%

REM Criar .env
echo Criando arquivo .env...
(
    echo # FitLife Environment Variables
    echo REACT_NATIVE_PACKAGER_HOSTNAME=%NETWORK_IP%
    echo JWT_SECRET=fitlife_secret_key_change_in_production_32chars
    echo JWT_REFRESH_SECRET=fitlife_refresh_secret_change_in_production_32chars
) > .env

echo Arquivo .env criado

REM Atualizar api.ts
set "API_FILE=%~dp0frontend\src\config\api.ts"
if exist "!API_FILE!" (
    powershell -NoProfile -Command ^
        "$content = Get-Content '!API_FILE!' -Raw; " ^
        "$content = $content -replace '(BASE_URL:\s*\")[^\"]*\"', '$1http://%NETWORK_IP%:5001\"'; " ^
        "Set-Content '!API_FILE!' $content"
    echo api.ts atualizado
)

REM Atualizar docker-compose.yml com o IP
echo Atualizando docker-compose.yml...
set "COMPOSE_FILE=%~dp0docker-compose.yml"
if exist "!COMPOSE_FILE!" (
    powershell -NoProfile -Command ^
        "$content = Get-Content '!COMPOSE_FILE!' -Raw; " ^
        "$content = $content -replace '(REACT_NATIVE_PACKAGER_HOSTNAME=)[0-9.]+', '$1%NETWORK_IP%'; " ^
        "Set-Content '!COMPOSE_FILE!' $content"
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
