# FitLife - Guia de Inicialização Rápida

Este documento apresenta os procedimentos para inicialização automatizada do ambiente de desenvolvimento através de scripts dedicados.

## Inicialização do Ambiente

### Sistemas macOS / Linux

```bash
./start.sh
```

### Sistema Windows

```batch
.\start-optimized.bat
```

**Nota:** O script `start-optimized.bat` foi otimizado para resolver problemas de lentidão e timeout do Expo no Windows.

## Funcionalidades dos Scripts de Inicialização

Os scripts de inicialização executam automaticamente as seguintes operações:

1. Detecção do endereço IP da rede WiFi local
2. Atualização do arquivo de configuração `api.ts` do frontend com o endereço IP detectado
3. Encerramento de containers Docker existentes
4. Opção de limpeza de volumes do banco de dados
5. Inicialização dos serviços através do Docker Compose:
   - PostgreSQL (sistema gerenciador de banco de dados)
   - Backend (API desenvolvida em Node.js)
   - Frontend (aplicação Expo React Native)
6. Verificação da disponibilidade dos serviços
7. Apresentação das informações de acesso e comandos auxiliares

## Acesso à Aplicação Móvel

Após a execução do script de inicialização:

1. O sistema apresentará os logs do frontend no terminal
2. Leitura do QR Code apresentado:
   - iOS: Utilizar o aplicativo Camera nativo
   - Android: Utilizar o aplicativo Expo Go

3. Acesso manual através do Expo Go:
   - URL: `exp://SEU_IP:19000`

## Endpoints Disponíveis

### API Backend
- Local: http://localhost:5001
- Rede: http://SEU_IP:5001
- Health Check: http://localhost:5001/health/ping
- Status: http://localhost:5001/health/status

### Banco de Dados PostgreSQL
- Host: localhost
- Porta: 5433
- Usuário: fitlife
- Senha: fitlife
- Database: fitlife

## Comandos do Sistema

### Visualização de Logs

```bash
# Logs de todos os serviços
docker-compose logs -f

# Logs do backend
docker-compose logs -f backend

# Logs do frontend
docker-compose logs -f frontend

# Logs do banco de dados
docker-compose logs -f db
```

### Gerenciamento de Serviços

```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Reiniciar serviço específico
docker-compose restart backend
docker-compose restart frontend

# Verificar status dos containers
docker-compose ps
```

### Acesso ao Banco de Dados

```bash
# Conexão via psql
docker-compose exec db psql -U fitlife -d fitlife
```

### Execução de Testes

**IMPORTANTE:** Os testes devem ser executados **dentro do container Docker**, não localmente.

```bash
# Executar testes do backend (dentro do container)
docker exec fitlife-backend-1 npm test

# OU usar o script de testes automatizado
./run-tests.sh  # macOS/Linux
.\run-tests.ps1  # Windows PowerShell
```

**Erros comuns:**
- Se você executar `npm test` sem instalar dependências, receberá erro `cross-env: command not found`. Execute `npm install` primeiro.
- Para evitar problemas de dependências, sempre use o container Docker para executar testes: `docker exec fitlife-backend-1 npm test`

## Configuração Manual

Caso seja necessário configurar manualmente sem utilizar o script:

### Etapa 1: Identificação do Endereço IP

```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'

# Windows
ipconfig
```

### Etapa 2: Configuração do Frontend

Editar o arquivo `frontend/src/config/api.ts`:

```typescript
BASE_URL: "http://SEU_IP_AQUI:5001",
```

### Etapa 3: Inicialização dos Serviços

```bash
docker-compose up -d
```

## Diagnóstico e Resolução de Problemas

### Falha de Conexão do Dispositivo Móvel com a API

1. Verificar a correção do endereço IP no arquivo `api.ts`
2. Confirmar que o dispositivo móvel e o computador estão conectados à mesma rede WiFi
3. Executar novamente o script de inicialização: `./start.sh`

### Falha na Inicialização dos Containers

```bash
# Limpeza completa do ambiente
docker-compose down -v
./start.sh
```

### QR Code Não Exibido

```bash
# Verificação dos logs do frontend
docker-compose logs -f frontend
```

### Falha na Inicialização do Backend

```bash
# Verificação dos logs do backend
docker-compose logs -f backend

# Verificação de disponibilidade da porta 5001
lsof -i :5001  # macOS/Linux
netstat -ano | findstr :5001  # Windows
```

### Falha de Conexão com o Banco de Dados

```bash
# Verificação dos logs do banco de dados
docker-compose logs -f db

# Verificação do status do container
docker-compose ps
```

### Erro "cross-env: command not found" ao Executar Testes

**Causas:**
1. Você está tentando executar `npm test` sem ter instalado as dependências
2. Você está tentando executar fora do container Docker

**Soluções:**

```bash
# OPÇÃO 1: Instalar dependências localmente (não recomendado)
cd backend
npm install
npm test

# OPÇÃO 2: Usar o container Docker (RECOMENDADO)
docker exec fitlife-backend-1 npm test

# OPÇÃO 3: Usar os scripts automatizados (MELHOR)
./run-tests.sh  # macOS/Linux
.\run-tests.ps1  # Windows
```

**Por que usar o container?**
- Ambiente isolado e consistente
- Não precisa instalar dependências localmente
- Mesmas condições do ambiente de produção

### Erro "secretOrPrivateKey must have a value"

**Causa:** As variáveis JWT_SECRET e JWT_REFRESH_SECRET não estão configuradas.

**Solução:** Este erro NÃO deve acontecer se você usar os scripts de inicialização (`start.sh` ou `start.bat`). Os scripts geram automaticamente os secrets necessários.

Se encontrar este erro:

```bash
# Pare os containers
docker-compose down

# Execute o script de inicialização novamente
./start.sh  # macOS/Linux
.\start.bat  # Windows

# O script criará automaticamente o arquivo .env com os secrets
```

## Requisitos do Sistema

- Docker
- Docker Compose
- Aplicativo Expo Go (iOS/Android)

## Primeira Execução

Durante a primeira execução, o script realizará automaticamente:

1. **Detecção do IP da rede WiFi**
2. **Geração de JWT secrets aleatórios e seguros** (32+ caracteres cada)
3. **Criação do arquivo `.env`** com todas as variáveis necessárias
4. **Download das imagens Docker** necessárias
5. **Instalação das dependências do Node.js**
6. **Criação e configuração do banco de dados**
7. **Inicialização de todos os serviços**

**Tempo estimado:** 3-5 minutos (dependendo da velocidade da internet para download das imagens Docker)

**Não é necessária nenhuma configuração manual!** Tudo é automatizado.

## Verificação do Sistema

Comandos para verificação do funcionamento correto:

```bash
# Verificação de saúde do backend
curl http://localhost:5001/health/ping

# Verificação de status completo
curl http://localhost:5001/health/status

# Verificação de conexão com o banco de dados
docker-compose exec db pg_isready -U fitlife
```

## Testes em Dispositivo Móvel

Procedimento para teste:

1. Confirmar que o dispositivo móvel está conectado à mesma rede WiFi
2. Abrir o aplicativo Expo Go no dispositivo
3. Escanear o QR Code apresentado no terminal
4. Aguardar o carregamento automático da aplicação

## Atualização do Projeto

Procedimento para atualização:

```bash
# Encerramento dos serviços
docker-compose down

# Obtenção de atualizações do repositório
git pull

# Reinicialização via script
./start.sh
```

## Observações Técnicas

- O script gera automaticamente um backup do arquivo `api.ts` antes de modificações
- O arquivo de backup é salvo como `api.ts.backup`
- A detecção de endereço IP é executada automaticamente a cada execução
- Os serviços são reiniciados completamente para garantir consistência
- Os volumes do banco de dados são preservados entre execuções (exceto quando explicitamente removidos)
- **JWT secrets são gerados automaticamente** e salvos no arquivo `.env` na primeira execução
- O arquivo `.env` contém variáveis sensíveis e **nunca deve ser commitado** no Git

## Segurança - Variáveis de Ambiente

### Geração Automática de Secrets

Os scripts `start.sh` e `start.bat` geram automaticamente:

- **JWT_SECRET**: String aleatória de 32+ caracteres para assinatura de tokens
- **JWT_REFRESH_SECRET**: String aleatória de 32+ caracteres para refresh tokens

Estes valores são únicos para cada instalação e garantem que:
- O login funcione corretamente na primeira execução
- Os tokens JWT sejam seguros
- Não haja problemas de "secretOrPrivateKey must have a value"

### Arquivo .env

O arquivo `.env` é criado automaticamente contendo:

```bash
# Network IP (detectado automaticamente)
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.x.x

# JWT Secrets (gerados aleatoriamente)
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# SendGrid (opcional - descomentado se necessário)
# SENDGRID_API_KEY=...
# SENDGRID_FROM_EMAIL=...
```

**IMPORTANTE:** O arquivo `.env` está no `.gitignore` e **nunca deve ser compartilhado ou commitado**.