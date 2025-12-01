# FitLife - Guia de Inicialização Rápida

Este documento apresenta os procedimentos para inicialização automatizada do ambiente de desenvolvimento através de scripts dedicados.

## Inicialização do Ambiente

### Sistemas macOS / Linux

```bash
./start.sh
```

### Sistema Windows

```bash
.\start.bat
```

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

```bash
# Executar testes do backend
docker exec fitlife-backend-1 npm test
```

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

## Requisitos do Sistema

- Docker
- Docker Compose
- Aplicativo Expo Go (iOS/Android)

## Primeira Execução

Durante a primeira execução, o script realizará:
- Download das imagens Docker necessárias
- Instalação das dependências do Node.js
- Criação e configuração do banco de dados
- Tempo estimado: alguns minutos

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