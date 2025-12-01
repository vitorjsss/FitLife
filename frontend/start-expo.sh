#!/bin/sh

# Detectar IP da rede
HOST_IP=$(ip route get 1 | awk '{print $7;exit}' 2>/dev/null || hostname -i 2>/dev/null || echo "0.0.0.0")

echo "========================================"
echo "  Iniciando Expo"
echo "========================================"
echo "IP do Host: $HOST_IP"
echo ""

# Usar tunnel para conexão mais estável
export EXPO_TUNNEL=true

# Iniciar Expo
npx expo start --tunnel --clear
