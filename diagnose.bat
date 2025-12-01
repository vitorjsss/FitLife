@echo off
REM ======================================================================
REM FitLife - Script de Diagnóstico
REM ======================================================================

setlocal enabledelayedexpansion

echo.
echo ================================================================
echo   FitLife - Diagnostico de Problemas
echo ================================================================
echo.

REM ======================================================================
REM TESTE 1: Verificar Docker
REM ======================================================================
echo Teste 1: Verificando Docker...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Docker instalado
    docker ps >nul 2>&1
    if %errorlevel% equ 0 (
        echo   [OK] Docker daemon rodando
    ) else (
        echo   [ERRO] Docker daemon nao esta rodando
    )
) else (
    echo   [ERRO] Docker nao esta instalado
)

echo.

REM ======================================================================
REM TESTE 2: Verificar containers
REM ======================================================================
echo Teste 2: Verificando containers...
docker-compose ps 2>nul
echo.

REM ======================================================================
REM TESTE 3: Verificar IP da rede
REM ======================================================================
echo Teste 3: Verificando IP da rede...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "127.0.0.1"') do (
    set "NETWORK_IP=%%a"
    goto :ip_found
)

:ip_found
for /f "tokens=* delims= " %%A in ("%NETWORK_IP%") do set "NETWORK_IP=%%A"
echo   IP detectado: %NETWORK_IP%
echo.

REM ======================================================================
REM TESTE 4: Verificar conectividade com Backend
REM ======================================================================
echo Teste 4: Verificando conectividade com Backend...
echo   Testando localhost:5001...
curl -s http://localhost:5001/health/ping >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Backend respondendo em localhost:5001
) else (
    echo   [ERRO] Backend NAO respondendo em localhost:5001
)

echo   Testando %NETWORK_IP%:5001...
curl -s http://%NETWORK_IP%:5001/health/ping >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Backend respondendo em %NETWORK_IP%:5001
) else (
    echo   [ERRO] Backend NAO respondendo em %NETWORK_IP%:5001
)

echo.

REM ======================================================================
REM TESTE 5: Verificar configuracao do api.ts
REM ======================================================================
echo Teste 5: Verificando configuracao do api.ts...
set "API_FILE=%~dp0frontend\src\config\api.ts"
if exist "!API_FILE!" (
    echo   Arquivo encontrado: !API_FILE!
    echo   Conteudo (primeiras 5 linhas):
    for /f "tokens=*" %%A in ('findstr /N "BASE_URL" "!API_FILE!"') do (
        echo   %%A
    )
) else (
    echo   [ERRO] Arquivo nao encontrado: !API_FILE!
)

echo.

REM ======================================================================
REM TESTE 6: Verificar porta 19000 (Expo)
REM ======================================================================
echo Teste 6: Verificando porta 19000 (Expo)...
netstat -ano | findstr :19000 >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Porta 19000 esta em uso
) else (
    echo   [AVISO] Porta 19000 NAO esta em uso
)

echo.

REM ======================================================================
REM TESTE 7: Logs dos containers
REM ======================================================================
echo Teste 7: Ultimos logs dos containers...
echo.
echo === LOGS DO BACKEND ===
docker-compose logs --tail=10 backend 2>nul
echo.
echo === LOGS DO FRONTEND ===
docker-compose logs --tail=10 frontend 2>nul
echo.
echo === LOGS DO BANCO ===
docker-compose logs --tail=10 db 2>nul

echo.
echo ================================================================
echo   Diagnostico Concluido
echo ================================================================
echo.

pause
