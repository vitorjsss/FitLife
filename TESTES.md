# Como Rodar os Testes

## Opção 1: Localmente (sem Docker)

### Pré-requisitos
- Node.js 18+ instalado
- PostgreSQL rodando na porta 5433
- Dependências instaladas

### Passos
```bash
cd backend
npm install
npm test
```

## Opção 2: Com Docker (Recomendado)

### Pré-requisitos
- Docker e Docker Compose instalados

### Opção 2.1: Script Automatizado

**Linux/Mac:**
```bash
./run-tests.sh
```

**Windows (PowerShell):**
```powershell
.\run-tests.ps1
```

### Opção 2.2: Manual

```bash
# 1. Subir o banco de dados
docker-compose up -d db

# 2. Aguardar o banco estar pronto (5-10 segundos)

# 3. Rodar os testes
docker-compose run --rm backend npm test
```

## Outros Comandos Úteis

### Rodar testes com coverage
```bash
docker-compose run --rm backend npm run test:coverage
```

### Rodar apenas testes de integração
```bash
docker-compose run --rm backend npm run test:integration
```

### Rodar apenas testes unitários
```bash
docker-compose run --rm backend npm run test:unit
```

### Rodar testes em modo verbose
```bash
docker-compose run --rm backend npm run test:verbose
```

### Rodar testes em modo watch (desenvolvimento)
```bash
docker-compose run --rm backend npm run test:watch
```

## Solução de Problemas

### Erro: "cross-env: command not found"
```bash
cd backend
npm install cross-env --save-dev
```

### Erro: "Cannot connect to database"
```bash
# Verificar se o banco está rodando
docker-compose ps

# Reiniciar o banco
docker-compose restart db

# Ver logs do banco
docker-compose logs db
```

### Limpar tudo e começar do zero
```bash
docker-compose down -v
docker-compose up -d db
docker-compose run --rm backend npm test
```

## Estrutura dos Testes

```
backend/tests/
├── setup.js                      # Configuração global
├── integration/                  # Testes de integração (API)
│   ├── auth.test.js
│   ├── PatientConnectionCode.test.js
│   └── PatientAccessMiddleware.test.js
├── unit/                        # Testes unitários
│   └── ...
└── validation/                  # Testes de validação (RNFs)
    ├── checklist-reliability.test.js
    ├── data-encryption.test.js
    └── report-consistency.test.js
```

## Métricas de Qualidade

Os testes validam:
- ✅ RNF 2.1: Confiabilidade do checklist (≥ 98%)
- ✅ RNF 3.1: Criptografia de dados sensíveis (100%)
- ✅ RNF 2.1: Consistência de relatórios (≥ 95%)
- ✅ Integração de APIs
- ✅ Controle de acesso e permissões
