# Scripts de Testes - FitLife Backend

Este diretório contém scripts organizados para execução de testes de validação de Requisitos Não-Funcionais (RNFs) e análise de riscos.

## Estrutura de Organização

```
scripts/
├── rnf/          # Scripts de testes de RNFs
│   ├── RNF1.0 - Sistema de Monitoramento de Disponibilidade
│   ├── RNF2.0 - Processamento Confiável (Medidas)
│   ├── RNF2.1 - Confiabilidade do Sistema de Checklist
│   ├── RNF3.0 - Segurança e Autenticação
│   └── RNF3.2 - Compartilhamento Seguro de Dados
│
└── riscos/       # Scripts de testes de mitigação de riscos
    └── (a ser organizado)
```

## 📋 Scripts por RNF

### RNF1.0: Sistema de Monitoramento de Disponibilidade

**Objetivo:** Garantir 90% de disponibilidade para funcionalidades críticas (login, dietas, treinos)

**Scripts:**
- `rnf/rnf1.0-test-availability.sh` - Script bash para executar testes de disponibilidade
- `rnf/rnf1.0-test-availability.ps1` - Script PowerShell para Windows

**Testes Associados:**
- `tests/validation/availability.test.js`

**Execução:**
```bash
# Linux/macOS
cd backend
./scripts/rnf/rnf1.0-test-availability.sh

# Windows PowerShell
cd backend
.\scripts\rnf\rnf1.0-test-availability.ps1
```

**Métrica:**
```
X = (Ttotal - Tindisponibilidade) / Ttotal
Requisito: X ≥ 0.90 (90%)
```

**Documentação:** `/docs - riscos e rnfs/rnfs/RNF1.0-Sistema-Monitoramento-Disponibilidade.md`

---

### RNF2.0: Processamento Confiável (Medidas)

**Objetivo:** Garantir que 100% das entradas inválidas sejam corretamente rejeitadas

**Scripts:**
- `rnf/rnf2.0-test-data-validation.sh` - Script bash para validação de dados
- `rnf/rnf2.0-test-data-validation.ps1` - Script PowerShell para Windows

**Testes Associados:**
- `tests/validation/data-validation.test.js`

**Execução:**
```bash
# Linux/macOS
./scripts/rnf/rnf2.0-test-data-validation.sh

# Windows PowerShell
.\scripts\rnf\rnf2.0-test-data-validation.ps1
```

**Métrica:**
```
x = Nvalores_invalidos_detectados / Nvalores_invalidos_inseridos
Requisito: x ≥ 1.0 (100%)
```

**Documentação:** `/docs - riscos e rnfs/rnfs/RNF2.0-Processamento confiável (medidas).md`

---

### RNF2.1: Confiabilidade do Sistema de Checklist

**Objetivo:** Garantir 98% de taxa de atualização correta dos cards de checklist

**Scripts:**
- `rnf/rnf2.1-test-checklist-reliability.sh` - Script automatizado de testes
- `rnf/rnf2.1-test-checklist-reliability.ps1` - Script PowerShell para Windows
- `rnf/rnf2.1-test-checklist-manual.sh` - Script manual para testes exploratórios

**Testes Associados:**
- `tests/validation/checklist-reliability.test.js`

**Execução:**
```bash
# Testes Automatizados
./scripts/rnf/rnf2.1-test-checklist-reliability.sh

# Testes Manuais (exploratório com cURL)
./scripts/rnf/rnf2.1-test-checklist-manual.sh
```

**Métrica:**
```
x = uc / ua
onde:
  uc = atualizações corretas refletidas nos cards
  ua = total de atualizações realizadas
Requisito: x ≥ 0.98 (98%)
```

**Documentação:** `/docs - riscos e rnfs/rnfs/RNF2.1-Confiabilidade do sistema de checklist.md`

---

### RNF3.0: Segurança e Autenticação

**Objetivo:** Registrar 100% das tentativas de login para auditoria

**Scripts:**
- `rnf/rnf3.0-test-login-audit.sh` - Script de testes de auditoria de login
- `rnf/rnf3.0-test-login-audit.ps1` - Script PowerShell para Windows

**Testes Associados:**
- `tests/validation/login-audit.test.js`

**Execução:**
```bash
./scripts/rnf/rnf3.0-test-login-audit.sh
```

**Métrica:**
```
x = Ntentativas_registradas / Ntentativas_totais
Requisito: x ≥ 1.0 (100%)
```

**Documentação:** `/docs - riscos e rnfs/rnfs/RNF3.0-SEGURANCA-AUTENTICACAO.md`

---

### RNF3.2: Compartilhamento Seguro de Dados

**Objetivo:** Garantir controle de acesso baseado em tipo de profissional e associação paciente-profissional

**Scripts:**
- `rnf/rnf3.2-run-security-tests.sh` - Script completo com setup e teardown
- `rnf/rnf3.2-test-security.sh` - Script simplificado de testes

**Testes Associados:**
- `tests/integration/PatientConnectionCode.test.js`
- Validação via middleware `patientAccessMiddleware.js`

**Execução:**
```bash
# Script completo (recomendado - cria e limpa dados de teste)
./scripts/rnf/rnf3.2-run-security-tests.sh

# Script simplificado (requer dados de teste pré-criados)
./scripts/rnf/rnf3.2-test-security.sh
```

**Cenários Testados:**
1. ✅ Paciente acessando próprios dados
2. ❌ Paciente tentando acessar dados de outro
3. ✅ Nutricionista com associação acessando refeições
4. ❌ Nutricionista tentando acessar treinos (tipo incompatível)
5. ✅ Educador com associação acessando treinos
6. ❌ Educador tentando acessar refeições (tipo incompatível)
7. ❌ Profissional sem associação tentando acessar dados
8. ❌ Requisição sem token

**Documentação:** `/docs - riscos e rnfs/rnfs/RNF3.2-COMPARTILHAMENTO-SEGURO-DADOS.md`

---

## 🔧 Pré-requisitos

### Para todos os scripts:

1. **Node.js** instalado (v18+)
2. **PostgreSQL** rodando (porta 5433)
3. **Dependências instaladas:**
   ```bash
   npm install
   ```
4. **Variáveis de ambiente** configuradas (`.env`)
5. **Banco de dados** inicializado com schema

### Ferramentas adicionais:

- **jq** (para parsing JSON em scripts bash)
  ```bash
  # macOS
  brew install jq
  
  # Linux
  apt-get install jq
  ```

- **psql** (cliente PostgreSQL)
  ```bash
  # Normalmente instalado com PostgreSQL
  psql --version
  ```

---

## 📊 Execução de Todos os Testes

Para executar todos os testes de RNF de uma vez:

```bash
# Linux/macOS
cd backend/scripts/rnf
for script in rnf*.sh; do
    echo "Executando $script..."
    ./"$script"
    echo "---"
done
```

---

## 📝 Relatórios de Testes

Cada script gera um relatório colorido no terminal com:

- ✅ Total de testes executados
- ✅ Testes aprovados
- ❌ Testes falhados
- 📊 Taxa de sucesso
- 💡 Dicas de troubleshooting (em caso de falha)

### Exemplo de Output:

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    ✅ Testes concluídos com sucesso!                       ║
╚════════════════════════════════════════════════════════════════════════════╝

   ✓ Todos os testes passaram!
   ℹ Métrica: X = (Ttotal - Tindisponibilidade) / Ttotal
   ✓ Disponibilidade ≥ 90% - RNF1.0 ATENDIDO
   ℹ Funcionalidades críticas estão disponíveis
```

---

## 🐛 Troubleshooting

### "Backend não está respondendo"
```bash
# Verificar se o backend está rodando
curl http://localhost:5001/health

# Iniciar backend
npm start
```

### "Banco de dados não conectado"
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps

# Iniciar PostgreSQL
docker-compose up -d db
```

### "jq não encontrado"
```bash
# Instalar jq
brew install jq  # macOS
apt-get install jq  # Linux
```

### "Permissão negada"
```bash
# Dar permissão de execução aos scripts
chmod +x scripts/rnf/*.sh
```

---

## 📚 Documentação Relacionada

- **RNFs:** `/docs - riscos e rnfs/rnfs/`
- **Riscos:** `/docs - riscos e rnfs/riscos/`
- **Testes:** `/backend/tests/`
- **Guias:**
  - `/backend/docs/GUIA-COMPLETO-TESTES-SEGURANCA.md`
  - `/backend/COMO-RODAR-TESTES.md`

---

## 🔄 Manutenção

### Adicionando Novo Script

1. Criar script em `scripts/rnf/` ou `scripts/riscos/`
2. Nomear seguindo padrão: `rnf{numero}-{nome-descritivo}.sh`
3. Adicionar permissão de execução: `chmod +x script.sh`
4. Documentar neste README
5. Criar arquivo `.ps1` correspondente para Windows (se aplicável)

### Padrão de Nomenclatura

```
rnf{numero}.{subnumero}-{acao}-{tipo}.{extensao}

Exemplos:
- rnf1.0-test-availability.sh
- rnf2.1-test-checklist-reliability.sh
- rnf3.2-run-security-tests.sh
```

---

**Última Atualização:** 29/11/2025
**Versão:** 1.0.0
