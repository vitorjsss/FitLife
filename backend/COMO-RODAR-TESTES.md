# 🧪 Como Rodar os Testes - FitLife Backend

## ✅ Pré-requisitos

- [x] Dependências instaladas (`npm install`)
- [x] Banco de dados PostgreSQL rodando
- [x] Variáveis de ambiente configuradas (`.env`)

---

## 🚀 Comandos Disponíveis

### 1. Rodar TODOS os testes
```bash
cd backend
npm test
```

### 2. Rodar apenas testes UNITÁRIOS
```bash
npm run test:unit
```

### 3. Rodar apenas testes de INTEGRAÇÃO
```bash
npm run test:integration
```

### 4. Rodar testes em modo WATCH (monitora mudanças)
```bash
npm run test:watch
```

### 5. Rodar testes com COVERAGE (cobertura de código)
```bash
npm run test:coverage
```

### 6. Rodar testes com saída VERBOSE (detalhada)
```bash
npm run test:verbose
```

---

## 📂 Estrutura de Testes

```
backend/
├── tests/
│   ├── setup.js                          # Configuração global dos testes
│   ├── unit/                             # Testes unitários
│   │   └── PatientConnectionCodeRepository.test.js
│   └── integration/                      # Testes de integração (API)
│       └── PatientConnectionCode.test.js
├── jest.config.js                        # Configuração do Jest
└── package.json                          # Scripts de teste
```

---

## 🎯 Exemplo de Execução

### Rodar testes unitários:
```bash
$ npm run test:unit

 PASS  tests/unit/PatientConnectionCodeRepository.test.js
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

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Time:        3.5 s
```

---

## 🔧 Troubleshooting

### Problema: "Cannot find module"
**Solução:** Verifique se todas as dependências estão instaladas
```bash
npm install
```

### Problema: "Connection refused" ou erro de banco de dados
**Solução:** 
1. Verifique se o PostgreSQL está rodando
2. Verifique suas credenciais no arquivo `.env`
3. Crie um banco de dados de teste separado

### Problema: Testes ficam travados/pendurados
**Solução:** Use o comando com `--forceExit`
```bash
npm test  # Já configurado com --forceExit
```

### Problema: "Port already in use"
**Solução:** Os testes não iniciam servidor HTTP (configuração no `index.js`). Se persistir:
```bash
# Encontrar processo na porta 5001
lsof -ti:5001 | xargs kill -9
```

---

## 📊 Cobertura de Código

Para ver relatório de cobertura:
```bash
npm run test:coverage
```

Saída esperada:
```
--------------------------|---------|----------|---------|---------|-------------------
File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
--------------------------|---------|----------|---------|---------|-------------------
All files                 |   78.34 |    65.21 |   82.45 |   78.89 |                   
 repositories             |   92.15 |    88.45 |   95.23 |   92.67 |                   
  PatientConnectionCode   |   95.45 |    91.30 |   100   |   95.83 | 45-48             
 services                 |   68.23 |    55.12 |   75.34 |   69.45 |                   
--------------------------|---------|----------|---------|---------|-------------------
```

---

## 🎨 Dicas de Uso

### 1. Desenvolvimento (Watch Mode)
Durante o desenvolvimento, use o modo watch para rodar testes automaticamente:
```bash
npm run test:watch
```

Então:
- Pressione `p` para filtrar por nome de arquivo
- Pressione `t` para filtrar por nome de teste
- Pressione `a` para rodar todos os testes
- Pressione `q` para sair

### 2. Testar arquivo específico
```bash
npx jest tests/unit/PatientConnectionCodeRepository.test.js
```

### 3. Testar apenas um teste específico
Use `.only` no teste:
```javascript
it.only('deve gerar um código de 6 dígitos', () => {
    // teste aqui
});
```

Depois rode:
```bash
npm test
```

### 4. Pular um teste
Use `.skip`:
```javascript
it.skip('este teste será pulado', () => {
    // teste aqui
});
```

---

## ✍️ Criando Novos Testes

### Estrutura básica de um teste:

```javascript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Nome do Componente/Função', () => {
    
    beforeEach(() => {
        // Setup antes de cada teste
    });

    afterEach(() => {
        // Cleanup depois de cada teste
    });

    it('deve fazer algo específico', () => {
        // Arrange (preparar)
        const input = 'teste';
        
        // Act (executar)
        const result = minhaFuncao(input);
        
        // Assert (verificar)
        expect(result).toBe('esperado');
    });
});
```

---

## 📝 Convenções de Nomenclatura

- **Arquivos de teste:** `*.test.js`
- **Testes unitários:** `/tests/unit/`
- **Testes de integração:** `/tests/integration/`
- **Descrição do teste:** Deve começar com verbo (deve, deveria, pode, etc.)

### Exemplos:
✅ CORRETO:
```javascript
it('deve gerar código de 6 dígitos', () => {})
it('não deve encontrar código expirado', () => {})
it('deveria lançar erro se código inválido', () => {})
```

❌ INCORRETO:
```javascript
it('código de 6 dígitos', () => {})
it('testando código expirado', () => {})
it('código inválido', () => {})
```

---

## 🔍 Debug de Testes

### Adicionar console.log em testes:
```javascript
it('debug teste', () => {
    console.log('Valor da variável:', minhaVariavel);
    expect(minhaVariavel).toBe(esperado);
});
```

### Rodar com output detalhado:
```bash
npm run test:verbose
```

### Usar debugger do Node:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Então abra `chrome://inspect` no Chrome.

---

## 📚 Documentação Adicional

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## ⚡ Quick Start

```bash
# 1. Instalar dependências
cd backend
npm install

# 2. Configurar banco de dados de teste (opcional)
# Edite .env e adicione DATABASE_URL_TEST

# 3. Rodar testes
npm test

# 4. Ver cobertura
npm run test:coverage
```

---

## 🎯 Próximos Passos

1. ✅ Executar `npm test` para verificar se tudo está funcionando
2. 📝 Adicionar mais testes conforme necessário
3. 📊 Manter cobertura acima de 70%
4. 🔄 Integrar com CI/CD (GitHub Actions, etc.)
