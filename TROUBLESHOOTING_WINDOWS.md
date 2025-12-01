# Solução de Problemas - Windows

## Problema: Demora Excessiva e Request Timeout no Expo

Este é um problema comum no Windows devido à performance do Docker Desktop e configurações de rede.

## Soluções Rápidas

### Solução 1: Aumentar Recursos do Docker Desktop

1. Abra o **Docker Desktop**
2. Vá em **Settings** (ícone de engrenagem)
3. Vá em **Resources**
4. Ajuste:
   - **CPUs**: Mínimo 4 (recomendado 6)
   - **Memory**: Mínimo 6GB (recomendado 8GB)
   - **Swap**: 2GB
   - **Disk Image Size**: Mínimo 60GB
5. Clique em **Apply & Restart**

### Solução 2: Configurar Firewall/Antivírus

O Windows Defender ou antivírus podem bloquear conexões do Expo.

**Windows Defender:**
1. Abra **Windows Security**
2. Vá em **Firewall & network protection**
3. Clique em **Allow an app through firewall**
4. Adicione:
   - Docker Desktop
   - Node.js
   - Expo

### Solução 3: Usar WSL2 (Recomendado)

WSL2 é MUITO mais rápido que Hyper-V no Windows:

1. Abra PowerShell como Administrador
2. Execute:
```powershell
wsl --install
wsl --set-default-version 2
```
3. Reinicie o computador
4. No Docker Desktop, vá em **Settings > General**
5. Marque **Use the WSL 2 based engine**
6. Apply & Restart

### Solução 4: Desabilitar Antivírus Temporariamente

Durante o desenvolvimento:
1. Adicione a pasta do projeto às exceções do antivírus
2. Adicione Docker Desktop às exceções
3. Se possível, desabilite o scan em tempo real para a pasta do projeto

### Solução 5: Limpar Cache do Docker

```powershell
# Parar tudo
docker-compose down

# Limpar cache
docker system prune -a --volumes

# Reiniciar Docker Desktop

# Iniciar novamente
.\start.bat
```

## Otimizações Específicas para Windows

### Aumentar Timeout do Expo

Crie/edite o arquivo `frontend/metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Aumentar timeout para Windows
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Aumentar timeout para 5 minutos
      res.setTimeout(300000);
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
```

### Configurar .npmrc para Performance

Crie o arquivo `frontend/.npmrc`:

```
registry=https://registry.npmjs.org/
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
prefer-offline=true
audit=false
```

E `backend/.npmrc`:

```
registry=https://registry.npmjs.org/
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
prefer-offline=true
audit=false
```

## Alternativa: Rodar Localmente (Sem Docker)

Se o Docker for muito lento, você pode rodar localmente:

### 1. Instalar PostgreSQL no Windows

Baixe e instale: https://www.postgresql.org/download/windows/

Configure:
- Porta: 5433
- Usuário: fitlife
- Senha: fitlife
- Database: fitlife

### 2. Rodar Backend Localmente

```powershell
cd backend
npm install
npm start
```

### 3. Rodar Frontend Localmente

```powershell
cd frontend
npm install
npx expo start --lan
```

### 4. Criar arquivo .env na raiz

```
REACT_NATIVE_PACKAGER_HOSTNAME=SEU_IP
JWT_SECRET=fitlife_secret_key_change_in_production
JWT_REFRESH_SECRET=fitlife_refresh_secret_key_change_in_production
```

## Script Otimizado para Windows

Crie `start-fast.bat`:

```batch
@echo off
echo Iniciando FitLife (Modo Rapido - Windows)...

REM Parar containers
docker-compose down

REM Iniciar apenas o banco de dados
echo Iniciando banco de dados...
docker-compose up -d db
timeout /t 15 /nobreak

REM Iniciar backend
echo Iniciando backend...
docker-compose up -d backend
timeout /t 20 /nobreak

REM Iniciar frontend
echo Iniciando frontend...
docker-compose up -d frontend
timeout /t 15 /nobreak

echo.
echo Servicos iniciados!
echo.
echo Para ver o QR Code:
echo docker-compose logs -f frontend
echo.
pause
```

Execute: `.\start-fast.bat`

## Verificar Performance

```powershell
# Ver uso de recursos
docker stats

# Ver logs em tempo real
docker-compose logs -f

# Testar conexão
curl http://localhost:5001/health/ping
```

## Configurações Adicionais do Windows

### Desabilitar Windows Defender para Pasta do Projeto

1. Abra **Windows Security**
2. **Virus & threat protection**
3. **Manage settings**
4. **Exclusions**
5. **Add or remove exclusions**
6. Adicione a pasta: `C:\Users\SeuUsuario\Desktop\FitLife`

### Aumentar Performance de Rede

Execute no PowerShell como Administrador:

```powershell
# Desabilitar IPv6 (pode causar lentidão)
netsh interface ipv6 set global randomizeidentifiers=disabled

# Otimizar TCP
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=enabled
netsh int tcp set global dca=enabled
netsh int tcp set global netdma=enabled
```

## Checklist de Performance

- [ ] Docker Desktop com 6+ CPUs e 8GB RAM
- [ ] WSL2 habilitado e configurado
- [ ] Docker usando WSL2 backend
- [ ] Pasta do projeto nas exceções do antivírus
- [ ] Firewall configurado para Docker e Node.js
- [ ] Cache do Docker limpo
- [ ] .npmrc configurado em frontend e backend
- [ ] Verificar se não há outros containers rodando: `docker ps`

## Última Opção: Dual Boot ou VM Linux

Se nada funcionar bem:
- Considere instalar Linux em dual boot
- Ou use uma VM Linux (VirtualBox/VMware)
- Docker funciona nativamente no Linux e é MUITO mais rápido

## Suporte

Se o problema persistir:

1. Execute: `docker-compose logs > logs.txt`
2. Verifique o arquivo `logs.txt`
3. Procure por "timeout", "error", ou "failed"
4. Verifique também: `docker stats` para ver uso de recursos
