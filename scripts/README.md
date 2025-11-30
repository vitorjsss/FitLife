# FitLife - Quick Start Scripts

## Arquivos de Inicialização

Este diretório contém os scripts necessários para iniciar o projeto FitLife.

### Scripts Disponíveis

#### `start.sh` (macOS/Linux)
Script principal para iniciar o projeto em sistemas Unix.

**Uso:**
```bash
./start.sh
```

#### `start.bat` (Windows)
Script principal para iniciar o projeto no Windows.

**Uso:**
```bash
start.bat
```

#### `scripts/get-network-ip.sh`
Script auxiliar para detectar o IP da rede WiFi.

**Uso direto:**
```bash
./scripts/get-network-ip.sh
```

## O que os scripts fazem

1. ✅ Detectam automaticamente o IP da rede WiFi
2. ✅ Atualizam o arquivo `frontend/src/config/api.ts` com o IP correto
3. ✅ Param containers Docker existentes
4. ✅ Oferecem opção de limpar volumes do banco de dados
5. ✅ Iniciam todos os serviços (DB, Backend, Frontend)
6. ✅ Aguardam os serviços estarem prontos
7. ✅ Exibem informações de acesso e QR Code

## Estrutura de Arquivos

```
FitLife/
├── start.sh              # Script principal (macOS/Linux)
├── start.bat             # Script principal (Windows)
├── scripts/
│   └── get-network-ip.sh # Detecção de IP da rede
├── docker-compose.yml    # Configuração do Docker
└── QUICK_START.md        # Documentação completa
```

## Primeira Execução

Na primeira vez que você executar:

1. Os scripts irão baixar as imagens Docker
2. Instalar todas as dependências
3. Configurar o banco de dados
4. Isso pode levar alguns minutos

## Permissões (macOS/Linux)

Os scripts precisam de permissão de execução:

```bash
chmod +x start.sh
chmod +x scripts/get-network-ip.sh
```

Isso já foi feito automaticamente se você clonou o repositório.

## Troubleshooting

### Erro de permissão (macOS/Linux)
```bash
chmod +x start.sh scripts/get-network-ip.sh
./start.sh
```

### IP não detectado
Verifique se você está conectado ao WiFi e execute:
```bash
./scripts/get-network-ip.sh
```

### Containers não iniciam
```bash
docker-compose down -v
./start.sh
```

## Mais Informações

Consulte o arquivo `QUICK_START.md` para documentação completa.
