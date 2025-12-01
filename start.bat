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
echo Detectando IP da rede WiFi...

REM Tenta pegar o IP da rede WiFi (excluindo loopback)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "127.0.0.1"') do (
    set "NETWORK_IP=%%a"
    goto :ip_found
)

:ip_found
REM Remove espaços em branco antes e depois
for /f "tokens=* delims= " %%A in ("%NETWORK_IP%") do set "NETWORK_IP=%%A"

if "%NETWORK_IP%"=="" (
    echo Erro: Nao foi possivel detectar o IP da rede
    echo Verifique se voce esta conectado ao WiFi
    pause
    exit /b 1
)

echo IP detectado: %NETWORK_IP%

REM ======================================================================
REM PASSO 2: Atualizar arquivo api.ts
REM ======================================================================
echo Atualizando configuracao do frontend...

set "API_FILE=%~dp0frontend\src\config\api.ts"

if not exist "!API_FILE!" (
    echo Erro: Arquivo api.ts nao encontrado em: !API_FILE!
    pause
    exit /b 1
)

REM Backup do arquivo original
copy /Y "!API_FILE!" "!API_FILE!.backup" >nul 2>&1

REM Atualiza o BASE_URL com o IP detectado
powershell -NoProfile -Command ^
    "$content = Get-Content '!API_FILE!' -Raw; " ^
    "$content = $content -replace '(BASE_URL:\s*\")[^\"]*\"', '$1http://%NETWORK_IP%:5001\"'; " ^
    "Set-Content '!API_FILE!' $content"

if %errorlevel% neq 0 (
    echo Aviso: Erro ao atualizar api.ts via PowerShell
    echo Tentando metodo alternativo...
    for /f "delims=" %%i in ('powershell -NoProfile -Command "Write-Host 'http://%NETWORK_IP%:5001'"') do (
        set "NEW_URL=%%i"
    )
)

echo Arquivo api.ts atualizado com IP: %NETWORK_IP%
echo Backup salvo em: api.ts.backup

REM ======================================================================
REM PASSO 2.5: Criar/Atualizar arquivo .env
REM ======================================================================
echo Configurando variaveis de ambiente...

set "ENV_FILE=%~dp0.env"

REM Gera JWT secrets aleatórios se não existirem
if not exist "!ENV_FILE!" (
    set "NEED_JWT_SECRETS=1"
) else (
    findstr /C:"JWT_SECRET=" "!ENV_FILE!" >nul 2>&1
    if !errorlevel! neq 0 (
        set "NEED_JWT_SECRETS=1"
    )
)

if defined NEED_JWT_SECRETS (
    REM Gera strings aleatórias para JWT secrets
    for /f "delims=" %%i in ('powershell -NoProfile -Command "[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))"') do set "JWT_SECRET=%%i"
    for /f "delims=" %%i in ('powershell -NoProfile -Command "[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))"') do set "JWT_REFRESH_SECRET=%%i"
) else (
    REM Preserva os secrets existentes
    for /f "tokens=2 delims==" %%a in ('findstr /C:"JWT_SECRET=" "!ENV_FILE!"') do set "JWT_SECRET=%%a"
    for /f "tokens=2 delims==" %%a in ('findstr /C:"JWT_REFRESH_SECRET=" "!ENV_FILE!"') do set "JWT_REFRESH_SECRET=%%a"
)

REM Cria ou atualiza o arquivo .env
(
    echo # FitLife Environment Variables
    echo # Gerado automaticamente por start.bat
    echo.
    echo # Network IP - usado pelo Expo para exibir o endereco correto do Metro bundler
    echo REACT_NATIVE_PACKAGER_HOSTNAME=%NETWORK_IP%
    echo.
    echo # JWT Secrets - usados para geracao e validacao de tokens
    echo # IMPORTANTE: Nao compartilhe estes valores!
    echo JWT_SECRET=!JWT_SECRET!
    echo JWT_REFRESH_SECRET=!JWT_REFRESH_SECRET!
    echo.
    echo # SendGrid Configuration ^(opcional - para notificacoes por email^)
    echo # Descomente e configure se necessario:
    echo # SENDGRID_API_KEY=your_sendgrid_api_key_here
    echo # SENDGRID_FROM_EMAIL=noreply@fitlife.com
    echo # SENDGRID_FROM_NAME=FitLife
) > "!ENV_FILE!"

echo Arquivo .env criado/atualizado com sucesso
echo JWT secrets configurados

REM ======================================================================
REM PASSO 2.6: Atualizar docker-compose.yml com o IP
REM ======================================================================
echo Atualizando docker-compose.yml...

set "COMPOSE_FILE=%~dp0docker-compose.yml"

if exist "!COMPOSE_FILE!" (
    powershell -NoProfile -Command ^
        "$content = Get-Content '!COMPOSE_FILE!' -Raw; " ^
        "$content = $content -replace '(REACT_NATIVE_PACKAGER_HOSTNAME=)[0-9.]+', '$1%NETWORK_IP%'; " ^
        "Set-Content '!COMPOSE_FILE!' $content"
    echo docker-compose.yml atualizado
)

REM ======================================================================
REM PASSO 3: Parar containers existentes (se houver)
REM ======================================================================
echo Parando containers existentes...

docker-compose ps >nul 2>&1
if %errorlevel% equ 0 (
    docker-compose down
    echo Containers anteriores removidos
) else (
    echo Nenhum container em execucao
)

REM ======================================================================
REM PASSO 4: Limpar volumes antigos (opcional)
REM ======================================================================
set /p CLEAN_VOLUMES="Deseja limpar volumes antigos do banco de dados? [s/N]: "
if /i "%CLEAN_VOLUMES%"=="s" (
    echo Removendo volumes...
    docker-compose down -v
    echo Volumes removidos
)

REM ======================================================================
REM PASSO 5: Iniciar serviços com Docker Compose
REM ======================================================================
echo.
echo ================================================================
echo   Iniciando Servicos
echo ================================================================
echo.

echo Construindo e iniciando containers...
echo.

docker-compose up -d --build

if %errorlevel% neq 0 (
    echo Erro ao iniciar os containers
    pause
    exit /b 1
)

echo Containers iniciados com sucesso!

REM ======================================================================
REM PASSO 6: Aguardar inicialização dos serviços
REM ======================================================================
echo Aguardando inicializacao dos servicos...
echo Aguardando PostgreSQL inicializar...
timeout /t 10 /nobreak >nul

REM Aguarda o backend
echo.
echo Aguardando Backend inicializar...
timeout /t 5 /nobreak >nul

for /L %%i in (1,1,60) do (
    curl -s http://localhost:5001/health/ping >nul 2>&1
    if !errorlevel! equ 0 (
        echo Backend: Pronto!
        goto :backend_ready
    )
    timeout /t 2 /nobreak >nul
)

echo Backend: Timeout (pode estar inicializando ainda)
:backend_ready

echo.
echo Aguardando Frontend inicializar...
timeout /t 15 /nobreak >nul

REM ======================================================================
REM PASSO 7: Exibir informações de acesso
REM ======================================================================
echo.
echo ================================================================
echo   Projeto Iniciado com Sucesso!
echo ================================================================
echo.
echo ACESSO AO APLICATIVO:
echo    * Escaneie o QR Code que aparecera no terminal do frontend
echo    * Ou acesse: exp://%NETWORK_IP%:19000
echo.
echo API BACKEND:
echo    * Local: http://localhost:5001
echo    * Rede: http://%NETWORK_IP%:5001
echo    * Health Check: http://localhost:5001/health/ping
echo.
echo BANCO DE DADOS:
echo    * Host: localhost
echo    * Porta: 5433
echo    * Usuario: fitlife
echo    * Senha: fitlife
echo    * Database: fitlife
echo.
echo COMANDOS UTEIS:
echo    * Ver logs de todos os servicos:
echo      docker-compose logs -f
echo    * Ver logs do backend:
echo      docker-compose logs -f backend
echo    * Ver logs do frontend:
echo      docker-compose logs -f frontend
echo    * Parar todos os servicos:
echo      docker-compose down
echo.
echo Para ver o QR Code do Expo, execute:
echo    docker-compose logs -f frontend
echo.
echo ================================================================
echo   Pronto para usar!
echo ================================================================
echo.

REM ======================================================================
REM PASSO 8: Mostrar logs do frontend (QR Code)
REM ======================================================================
set /p SHOW_LOGS="Deseja ver os logs do frontend agora? [S/n]: "
if /i not "%SHOW_LOGS%"=="n" (
    echo.
    echo Pressione Ctrl+C para sair dos logs
    echo.
    timeout /t 2 /nobreak >nul
    docker-compose logs -f frontend
)

pause