#!/bin/bash

# Script para obter o IP da rede WiFi atual
# Funciona em macOS e Linux

get_ip_macos() {
    # Tenta pegar IP da interface WiFi (en0)
    IP=$(ipconfig getifaddr en0 2>/dev/null)
    
    # Se não encontrar em en0, tenta en1
    if [ -z "$IP" ]; then
        IP=$(ipconfig getifaddr en1 2>/dev/null)
    fi
    
    # Se ainda não encontrar, tenta todas as interfaces
    if [ -z "$IP" ]; then
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
    fi
    
    echo "$IP"
}

get_ip_linux() {
    # Tenta pegar IP da interface WiFi
    IP=$(hostname -I | awk '{print $1}')
    
    # Se não encontrar, tenta outro método
    if [ -z "$IP" ]; then
        IP=$(ip route get 8.8.8.8 | awk '{print $7; exit}')
    fi
    
    echo "$IP"
}

# Detecta o sistema operacional
OS="$(uname -s)"
case "${OS}" in
    Linux*)     
        IP=$(get_ip_linux)
        ;;
    Darwin*)    
        IP=$(get_ip_macos)
        ;;
    *)          
        echo "Sistema operacional não suportado: ${OS}"
        exit 1
        ;;
esac

# Valida se encontrou um IP
if [ -z "$IP" ]; then
    echo "Erro: Não foi possível detectar o IP da rede"
    exit 1
fi

# Valida formato do IP
if [[ ! $IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo "Erro: IP inválido detectado: $IP"
    exit 1
fi

echo "$IP"
