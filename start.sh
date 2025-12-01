#!/bin/bash

# ======================================================================
# FitLife - Script de Inicialização Completa
# ======================================================================
# Este script:
# 1. Detecta o IP da rede WiFi atual
# 2. Atualiza o arquivo api.ts do frontend com o IP correto
# 3. Inicia todos os serviços com Docker Compose
# ======================================================================

set -e  # Sai se qualquer comando falhar

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para printar mensagens coloridas
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_message "$BLUE" "════════════════════════════════════════════════════════════════"
    print_message "$BLUE" "  $1"
    print_message "$BLUE" "════════════════════════════════════════════════════════════════"
    echo ""
}

# Diretório do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

print_header "FitLife - Inicialização do Projeto"

# ======================================================================
# PASSO 1: Detectar IP da rede
# ======================================================================
print_message "$YELLOW" "Detectando IP da rede WiFi..."

# Torna o script de detecção de IP executável
chmod +x "$PROJECT_DIR/scripts/get-network-ip.sh"

# Executa o script e captura o IP
NETWORK_IP=$("$PROJECT_DIR/scripts/get-network-ip.sh")

if [ $? -ne 0 ] || [ -z "$NETWORK_IP" ]; then
    print_message "$RED" "ERRO: Não foi possível detectar o IP da rede"
    print_message "$YELLOW" "Verifique se você está conectado ao WiFi"
    exit 1
fi

print_message "$GREEN" "IP detectado: $NETWORK_IP"

# ======================================================================
# PASSO 2: Atualizar arquivo api.ts
# ======================================================================
print_message "$YELLOW" "Atualizando configuração do frontend..."

API_FILE="$PROJECT_DIR/frontend/src/config/api.ts"

if [ ! -f "$API_FILE" ]; then
    print_message "$RED" "ERRO: Arquivo api.ts não encontrado em $API_FILE"
    exit 1
fi

# Backup do arquivo original
cp "$API_FILE" "$API_FILE.backup"

# Atualiza o BASE_URL com o IP detectado
sed -i.tmp "s|BASE_URL:.*|BASE_URL: \"http://${NETWORK_IP}:5001\",|g" "$API_FILE"
rm -f "$API_FILE.tmp"

print_message "$GREEN" "Arquivo api.ts atualizado com IP: $NETWORK_IP"
print_message "$BLUE" "Backup salvo em: api.ts.backup"

# ======================================================================
# PASSO 2.5: Atualizar docker-compose.yml com o IP
# ======================================================================
print_message "$YELLOW" "Atualizando docker-compose.yml..."

COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
    print_message "$RED" "ERRO: Arquivo docker-compose.yml não encontrado"
    exit 1
fi

# Atualiza a variável REACT_NATIVE_PACKAGER_HOSTNAME
sed -i.tmp "s|REACT_NATIVE_PACKAGER_HOSTNAME=.*|REACT_NATIVE_PACKAGER_HOSTNAME=${NETWORK_IP}|g" "$COMPOSE_FILE"
rm -f "$COMPOSE_FILE.tmp"

print_message "$GREEN" "docker-compose.yml atualizado"

# ======================================================================
# PASSO 2.6: Criar/Atualizar arquivo .env
# ======================================================================
print_message "$YELLOW" "Configurando variáveis de ambiente..."

ENV_FILE="$PROJECT_DIR/.env"

# Gera um JWT_SECRET aleatório se não existir
if [ ! -f "$ENV_FILE" ] || ! grep -q "JWT_SECRET=" "$ENV_FILE" 2>/dev/null; then
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
else
    # Preserva os secrets existentes
    JWT_SECRET=$(grep "JWT_SECRET=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2)
    JWT_REFRESH_SECRET=$(grep "JWT_REFRESH_SECRET=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2)
fi

# Cria ou atualiza o arquivo .env
cat > "$ENV_FILE" << EOF
# FitLife Environment Variables
# Gerado automaticamente por start.sh

# Network IP - usado pelo Expo para exibir o endereço correto do Metro bundler
REACT_NATIVE_PACKAGER_HOSTNAME=${NETWORK_IP}

# JWT Secrets - usados para geração e validação de tokens
# IMPORTANTE: Não compartilhe estes valores!
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# SendGrid Configuration (descomente e configure se necessário)
# SENDGRID_API_KEY=sua_api_key_aqui
# SENDGRID_FROM_EMAIL=seu_email@exemplo.com
# SENDGRID_FROM_NAME=FitLife
EOF

print_message "$GREEN" "Arquivo .env criado/atualizado com sucesso"
print_message "$BLUE" "JWT secrets configurados"

# ======================================================================
# PASSO 3: Parar containers existentes (se houver)
# ======================================================================
print_message "$YELLOW" "Parando containers existentes..."

if docker-compose ps -q 2>/dev/null | grep -q .; then
    docker-compose down
    print_message "$GREEN" "Containers anteriores removidos"
else
    print_message "$BLUE" "Nenhum container em execução"
fi

# ======================================================================
# PASSO 4: Limpar volumes antigos (opcional)
# ======================================================================
read -p "$(echo -e ${YELLOW}Deseja limpar volumes antigos do banco? [s/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[SsYy]$ ]]; then
    print_message "$YELLOW" "Removendo volumes..."
    docker-compose down -v
    print_message "$GREEN" "Volumes removidos"
fi

# ======================================================================
# PASSO 5: Iniciar serviços com Docker Compose
# ======================================================================
print_header "Iniciando Serviços"

print_message "$YELLOW" "Construindo e iniciando containers..."
echo ""

# Inicia os serviços
docker-compose up -d --build

if [ $? -ne 0 ]; then
    print_message "$RED" "ERRO ao iniciar os containers"
    exit 1
fi

print_message "$GREEN" "Containers iniciados com sucesso!"

# ======================================================================
# PASSO 6: Aguardar inicialização dos serviços
# ======================================================================
print_message "$YELLOW" "Aguardando inicialização dos serviços..."

# Aguarda o backend estar pronto
echo -n "Backend: "
for i in {1..30}; do
    if curl -s http://localhost:5001/health/ping > /dev/null 2>&1; then
        print_message "$GREEN" "Pronto!"
        break
    fi
    echo -n "."
    sleep 2
    
    if [ $i -eq 30 ]; then
        echo ""
        print_message "$RED" "Timeout aguardando backend"
        print_message "$YELLOW" "Execute 'docker-compose logs backend' para ver os logs"
    fi
done

# Aguarda o banco de dados estar pronto
echo -n "Banco de dados: "
for i in {1..30}; do
    if docker-compose exec -T db pg_isready -U fitlife > /dev/null 2>&1; then
        print_message "$GREEN" "Pronto!"
        break
    fi
    echo -n "."
    sleep 2
    
    if [ $i -eq 30 ]; then
        echo ""
        print_message "$RED" "Timeout aguardando banco de dados"
    fi
done

# ======================================================================
# PASSO 7: Exibir informações de acesso
# ======================================================================
print_header "Projeto Iniciado com Sucesso!"

echo ""
print_message "$GREEN" "ACESSO AO APLICATIVO:"
print_message "$BLUE" "- Escaneie o QR Code que aparecerá no terminal do frontend"
print_message "$BLUE" "- Ou acesse: exp://$NETWORK_IP:19000"
echo ""

print_message "$GREEN" "API BACKEND:"
print_message "$BLUE" "- Local: http://localhost:5001"
print_message "$BLUE" "- Rede: http://$NETWORK_IP:5001"
print_message "$BLUE" "- Health Check: http://localhost:5001/health/ping"
echo ""

print_message "$GREEN" "BANCO DE DADOS:"
print_message "$BLUE" "- Host: localhost"
print_message "$BLUE" "- Porta: 5433"
print_message "$BLUE" "- Usuário: fitlife"
print_message "$BLUE" "- Senha: fitlife"
print_message "$BLUE" "- Database: fitlife"
echo ""

print_message "$GREEN" "COMANDOS ÚTEIS:"
print_message "$BLUE" "- Ver logs de todos os serviços:"
print_message "$YELLOW" "  docker-compose logs -f"
print_message "$BLUE" "- Ver logs do backend:"
print_message "$YELLOW" "  docker-compose logs -f backend"
print_message "$BLUE" "- Ver logs do frontend:"
print_message "$YELLOW" "  docker-compose logs -f frontend"
print_message "$BLUE" "- Parar todos os serviços:"
print_message "$YELLOW" "  docker-compose down"
print_message "$BLUE" "- Reiniciar um serviço:"
print_message "$YELLOW" "  docker-compose restart <serviço>"
echo ""

print_message "$YELLOW" "Para ver o QR Code do Expo, execute:"
print_message "$BLUE" "docker-compose logs -f frontend"
echo ""

print_header "Pronto para usar!"

# ======================================================================
# PASSO 8: Mostrar logs do frontend (QR Code)
# ======================================================================
read -p "$(echo -e ${YELLOW}Deseja ver os logs do frontend agora? [S/n]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    print_message "$GREEN" "Pressione Ctrl+C para sair dos logs"
    echo ""
    sleep 2
    docker-compose logs -f frontend
fi
