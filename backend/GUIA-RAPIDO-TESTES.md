# 🚀 Guia Rápido - Como Rodar os Testes

## ✅ Tudo Está Configurado!

A configuração dos testes já está completa. Agora você só precisa:

### 1️⃣ Garantir que o PostgreSQL está rodando

```bash
# Verificar se PostgreSQL está rodando
pg_isready

# Se não estiver, inicie:
# macOS (Homebrew):
brew services start postgresql

# ou
# Se instalou via app:
# Abra o PostgreSQL.app
```

### 2️⃣ Executar os testes

```bash
cd backend

# Rodar todos os testes
npm test

# Rodar apenas testes unitários
npm run test:unit

# Rodar apenas testes de integração
npm run test:integration

# Rodar com cobertura de código
npm run test:coverage
```

---

## 📊 O que os Testes Fazem

### Testes Unitários (`npm run test:unit`)
- ✅ Testam funções isoladas (Repository, Service)
- ✅ Mais rápidos (não dependem de servidor HTTP)
- ✅ Validam lógica de negócio

**Localização:** `/tests/unit/`

### Testes de Integração (`npm run test:integration`)
- ✅ Testam APIs completas (endpoints HTTP)
- ✅ Simulam requisições reais
- ✅ Validam fluxo completo

**Localização:** `/tests/integration/`

---

## 🎯 Comandos Úteis

```bash
# Ver todos os comandos disponíveis
npm run

# Executar testes em modo watch (monitora mudanças)
npm run test:watch

# Executar com saída detalhada
npm run test:verbose

# Testar apenas um arquivo específico
npx jest tests/unit/PatientConnectionCodeRepository.test.js
```

---

## 🔧 Se Tiver Erro de Conexão com Banco

Se aparecer erro como:
```
Error: connect ECONNREFUSED 127.0.0.1:5433
```

**Soluções:**

### Opção 1: Verificar se PostgreSQL está rodando
```bash
# Verificar status
brew services list | grep postgresql

# Iniciar
brew services start postgresql
```

### Opção 2: Criar banco de dados de teste (opcional)
```bash
# Conectar ao PostgreSQL
psql postgres

# Criar banco de teste
CREATE DATABASE fitlife_test;

# Executar o script de inicialização
\i /Users/vitor/Downloads/FitLife/backend/db-init/init.sql
```

### Opção 3: Usar o mesmo banco de desenvolvimento
Os testes criam dados temporários e limpam depois, então é seguro usar o mesmo banco.

---

## 📝 Estrutura Atual dos Testes

```
backend/
├── tests/
│   ├── setup.js                                    ✅ Configuração global
│   ├── unit/
│   │   └── PatientConnectionCodeRepository.test.js ✅ 20 testes unitários
│   └── integration/
│       └── PatientConnectionCode.test.js           ✅ Testes de API
├── jest.config.js                                  ✅ Configuração do Jest
└── package.json                                    ✅ Scripts configurados
```

---

## ✨ Exemplo de Saída Esperada

Quando funcionar, você verá algo assim:

```
> npm run test:unit

PASS tests/unit/PatientConnectionCodeRepository.test.js
  PatientConnectionCodeRepository - Unit Tests
    generateCode
      ✓ deve gerar um código de 6 dígitos (3 ms)
      ✓ deve gerar códigos diferentes em chamadas sucessivas (5 ms)
    createOrUpdate
      ✓ deve criar um novo código para o paciente (150 ms)
      ✓ deve criar código com expiração de aproximadamente 5 minutos (145 ms)
      ✓ deve remover código anterior ao criar novo (1520 ms)
    findValidByCode
      ✓ deve encontrar código válido e não expirado (120 ms)
      ✓ não deve encontrar código inexistente (5 ms)
      ✓ não deve encontrar código expirado (130 ms)
      ✓ não deve encontrar código já utilizado (125 ms)
    findActiveByPatientId
      ✓ deve encontrar código ativo do paciente (110 ms)
    markAsUsed
      ✓ deve marcar código como usado (95 ms)
    deleteExpired
      ✓ deve deletar apenas códigos expirados (180 ms)
    deleteByPatientId
      ✓ deve deletar código do paciente (90 ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        3.5 s
```

---

## 🎨 Dicas Pro

### 1. Modo Watch (Desenvolvimento)
```bash
npm run test:watch
```
Deixa rodando em um terminal separado. Testes executam automaticamente quando você salvar alterações.

### 2. Testar Enquanto Desenvolve
```bash
# Terminal 1: Servidor
npm run dev

# Terminal 2: Testes em watch mode
npm run test:watch
```

### 3. Pular Testes Temporariamente
Se um teste estiver falhando e você quiser focar em outros:

```javascript
// Pular este teste
it.skip('este teste será pulado', () => {
    // ...
});

// Rodar APENAS este teste
it.only('apenas este teste roda', () => {
    // ...
});
```

---

## 📚 Próximos Passos

1. ✅ Garantir PostgreSQL rodando
2. ✅ Executar `npm run test:unit`
3. 📝 Adicionar mais testes conforme necessário
4. 📊 Manter cobertura acima de 70%

---

## 🆘 Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "Port already in use"
```bash
# Matar processo na porta 5001
lsof -ti:5001 | xargs kill -9
```

### Testes muito lentos
```bash
# Rodar apenas testes unitários (mais rápidos)
npm run test:unit
```

### Ver mais detalhes de erros
```bash
npm run test:verbose
```

---

## 📖 Documentação Completa

Para mais detalhes, veja: [`COMO-RODAR-TESTES.md`](./COMO-RODAR-TESTES.md)

---

**Tudo pronto! 🎉 Basta rodar:** `npm run test:unit`
