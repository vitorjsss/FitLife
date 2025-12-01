#!/bin/bash

# Script para rodar testes no Docker
echo "Executando testes do FitLife..."

# Garantir que os containers estão rodando
docker-compose up -d db

# Aguardar o banco de dados estar pronto
echo "Aguardando banco de dados..."
sleep 5

# Executar os testes no container do backend
echo "Rodando testes..."
docker-compose run --rm backend npm test

# Capturar código de saída
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "Todos os testes passaram!"
else
    echo "Alguns testes falharam. Código de saída: $EXIT_CODE"
fi

exit $EXIT_CODE
