@echo off
REM ======================================================================
REM FitLife - Script de Inicialização Completa (Windows)
REM ======================================================================

setlocal enabledelayedexpansion

echo.
echo ================================================================
echo   FitLife - Inicializacao do Projeto
echo ================================================================
echo.

REM ======================================================================
REM PASSO 1: Detectar IP da rede
REM ======================================================================
echo [93m Detectando IP da rede WiFi...[0m

REM Tenta pegar o IP da rede WiFi
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "127.0.0.1"') do (
    set NETWORK_IP=%%a
    goto :ip_found
)

:ip_found
REM Remove espaços em branco
set NETWORK_IP=%NETWORK_IP: =%

if "%NETWORK_IP%"=="" (
    echo [91m Erro: Nao foi possivel detectar o IP da rede[0m
    echo    Verifique se voce esta conectado ao WiFi
    pause
    exit /b 1
)

echo [92m IP detectado: %NETWORK_IP%[0m

REM ======================================================================
REM PASSO 2: Atualizar arquivo api.ts
REM ======================================================================
echo [93m Atualizando configuracao do frontend...[0m

set API_FILE=%~dp0frontend\src\config\api.ts

if not exist "%API_FILE%" (
    echo [91m Erro: Arquivo api.ts nao encontrado[0m
    pause
    exit /b 1
)

REM Backup do arquivo original
copy /Y "%API_FILE%" "%API_FILE%.backup" >nul

REM Atualiza o BASE_URL com o IP detectado usando PowerShell
powershell -Command "(Get-Content '%API_FILE%') -replace 'BASE_URL:.*', 'BASE_URL: \"http://%NETWORK_IP%:5001\",' | Set-Content '%API_FILE%'"

echo [92m Arquivo api.ts atualizado com IP: %NETWORK_IP%[0m
echo [94m Backup salvo em: api.ts.backup[0m

REM ======================================================================
REM PASSO 3: Parar containers existentes (se houver)
REM ======================================================================
echo [93m Parando containers existentes...[0m

docker-compose ps -q >nul 2>&1
if %errorlevel% equ 0 (
    docker-compose down
    echo [92m Containers anteriores removidos[0m
) else (
    echo [94m Nenhum container em execucao[0m
)

REM ======================================================================
REM PASSO 4: Limpar volumes antigos (opcional)
REM ======================================================================
set /p CLEAN_VOLUMES="[93m Deseja limpar volumes antigos do banco? [s/N]: [0m"
if /i "%CLEAN_VOLUMES%"=="s" (
    echo [93m Removendo volumes...[0m
    docker-compose down -v
    echo [92m Volumes removidos[0m
)

REM ======================================================================
REM PASSO 5: Iniciar serviços com Docker Compose
REM ======================================================================
echo.
echo ================================================================
echo   Iniciando Servicos
echo ================================================================
echo.

echo [93m Construindo e iniciando containers...[0m
echo.

docker-compose up -d --build

if %errorlevel% neq 0 (
    echo [91m Erro ao iniciar os containers[0m
    pause
    exit /b 1
)

echo [92m Containers iniciados com sucesso![0m

REM ======================================================================
REM PASSO 6: Aguardar inicialização dos serviços
REM ======================================================================
echo [93m Aguardando inicializacao dos servicos...[0m

REM Aguarda o backend
echo    Backend: Verificando...
timeout /t 5 /nobreak >nul

for /L %%i in (1,1,30) do (
    curl -s http://localhost:5001/health/ping >nul 2>&1
    if !errorlevel! equ 0 (
        echo [92m    Backend: Pronto![0m
        goto :backend_ready
    )
    timeout /t 2 /nobreak >nul
)

echo [91m    Backend: Timeout[0m
:backend_ready

REM ======================================================================
REM PASSO 7: Exibir informações de acesso
REM ======================================================================
echo.
echo ================================================================
echo   Projeto Iniciado com Sucesso!
echo ================================================================
echo.
echo [92m ACESSO AO APLICATIVO:[0m
echo [94m   * Escaneie o QR Code que aparecera no terminal do frontend[0m
echo [94m   * Ou acesse: exp://%NETWORK_IP%:19000[0m
echo.
echo [92m API BACKEND:[0m
echo [94m   * Local: http://localhost:5001[0m
echo [94m   * Rede: http://%NETWORK_IP%:5001[0m
echo [94m   * Health Check: http://localhost:5001/health/ping[0m
echo.
echo [92m BANCO DE DADOS:[0m
echo [94m   * Host: localhost[0m
echo [94m   * Porta: 5433[0m
echo [94m   * Usuario: fitlife[0m
echo [94m   * Senha: fitlife[0m
echo [94m   * Database: fitlife[0m
echo.
echo [92m COMANDOS UTEIS:[0m
echo [94m   * Ver logs de todos os servicos:[0m
echo [93m     docker-compose logs -f[0m
echo [94m   * Ver logs do backend:[0m
echo [93m     docker-compose logs -f backend[0m
echo [94m   * Ver logs do frontend:[0m
echo [93m     docker-compose logs -f frontend[0m
echo [94m   * Parar todos os servicos:[0m
echo [93m     docker-compose down[0m
echo.
echo [93m Para ver o QR Code do Expo, execute:[0m
echo [94m   docker-compose logs -f frontend[0m
echo.
echo ================================================================
echo   Pronto para usar!
echo ================================================================
echo.

REM ======================================================================
REM PASSO 8: Mostrar logs do frontend (QR Code)
REM ======================================================================
set /p SHOW_LOGS="[93m Deseja ver os logs do frontend agora? [S/n]: [0m"
if /i not "%SHOW_LOGS%"=="n" (
    echo.
    echo [92mPressione Ctrl+C para sair dos logs[0m
    echo.
    timeout /t 2 /nobreak >nul
    docker-compose logs -f frontend
)

pause
