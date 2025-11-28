# Associação de Profissionais com Pacientes - FitLife

## 📋 Resumo das Mudanças

Foi implementado um sistema completo de associação entre pacientes, nutricionistas e educadores físicos no FitLife.

### Principais Funcionalidades:

1. **Tabela de Associação** (`patient_professional_association`)
   - Cada paciente pode ter 1 nutricionista e 1 educador físico
   - Cada profissional pode ter múltiplos pacientes
   - Sistema de ativação/desativação de associações

2. **Homes Específicas**
   - `NutricionistHome`: Lista de pacientes com acesso a refeições e calendário
   - `PhysicalEducatorHome`: Lista de pacientes com acesso a treinos e checklist
   - Seleção de paciente ativo para gerenciamento

3. **API Backend Completa**
   - CRUD completo de associações
   - Endpoints para listar pacientes por profissional
   - Logs automáticos de todas as operações

## 🗄️ Estrutura do Banco de Dados

### Tabela: `patient_professional_association`

```sql
CREATE TABLE patient_professional_association (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    nutricionist_id UUID REFERENCES nutricionist(id) ON DELETE SET NULL,
    physical_educator_id UUID REFERENCES physical_educator(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(patient_id)
);
```

### Índices Criados:
- `idx_patient_association_patient`
- `idx_patient_association_nutricionist`
- `idx_patient_association_physical_educator`
- `idx_patient_association_active`

## 🚀 Como Aplicar as Mudanças

### 1. Atualizar o Banco de Dados

#### Opção A: Recriando o banco (⚠️ Apaga todos os dados)
```bash
cd /Users/vitor/Downloads/FitLife
docker compose down -v
docker compose up -d
```

#### Opção B: Aplicando migration manual (Preserva os dados)
```bash
# Conecte ao container do PostgreSQL
docker exec -it fitlife-db-1 psql -U fitlife_user -d fitlife_db

# Execute o SQL:
CREATE TABLE IF NOT EXISTS patient_professional_association (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    nutricionist_id UUID REFERENCES nutricionist(id) ON DELETE SET NULL,
    physical_educator_id UUID REFERENCES physical_educator(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(patient_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_association_patient ON patient_professional_association(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_association_nutricionist ON patient_professional_association(nutricionist_id);
CREATE INDEX IF NOT EXISTS idx_patient_association_physical_educator ON patient_professional_association(physical_educator_id);
CREATE INDEX IF NOT EXISTS idx_patient_association_active ON patient_professional_association(is_active);

\q
```

### 2. Reiniciar o Backend
```bash
docker compose restart backend
```

### 3. Reiniciar o Frontend
```bash
cd frontend
# Pressione Ctrl+C se estiver rodando
npx expo start
```

## 📁 Arquivos Criados

### Backend:
- `backend/src/repositories/PatientProfessionalAssociationRepository.js`
- `backend/src/services/PatientProfessionalAssociationService.js`
- `backend/src/controllers/PatientProfessionalAssociationController.js`
- `backend/src/routes/patientProfessionalAssociationRoutes.js`
- `backend/db-init/init.sql` (atualizado)
- `backend/src/index.js` (atualizado)

### Frontend:
- `frontend/src/services/PatientProfessionalAssociationService.ts`
- `frontend/src/screens/home/NutricionistHome.tsx`
- `frontend/src/screens/home/PhysicalEducatorHome.tsx`
- `frontend/App.tsx` (atualizado)
- `frontend/src/screens/login/login.tsx` (atualizado)

## 🔌 Endpoints da API

Base URL: `http://localhost:5001/patient-professional-association`

### Criar Associação
```http
POST /
Content-Type: application/json
Authorization: Bearer {token}

{
  "patient_id": "uuid-do-paciente",
  "nutricionist_id": "uuid-do-nutricionista",  // opcional
  "physical_educator_id": "uuid-do-educador"    // opcional
}
```

### Listar Pacientes do Nutricionista
```http
GET /nutricionist/{nutricionistId}/patients
Authorization: Bearer {token}
```

### Listar Pacientes do Educador Físico
```http
GET /physical-educator/{physicalEducatorId}/patients
Authorization: Bearer {token}
```

### Buscar Associação do Paciente
```http
GET /patient/{patientId}
Authorization: Bearer {token}
```

### Atualizar Associação
```http
PUT /{associationId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "nutricionist_id": "novo-uuid",
  "physical_educator_id": "novo-uuid"
}
```

### Desativar Associação
```http
PUT /{associationId}/deactivate
Authorization: Bearer {token}
```

### Deletar Associação
```http
DELETE /{associationId}
Authorization: Bearer {token}
```

## 🎯 Como Usar

### 1. Criar Associações (Para Administrador/Sistema)

Você pode criar associações via API ou diretamente no banco:

```sql
-- Exemplo: Associar paciente a nutricionista e educador físico
INSERT INTO patient_professional_association (patient_id, nutricionist_id, physical_educator_id)
VALUES (
  'uuid-do-paciente',
  'uuid-do-nutricionista',
  'uuid-do-educador-fisico'
);
```

### 2. Login como Nutricionista

1. Faça login com credenciais de nutricionista
2. Será redirecionado para `NutricionistHome`
3. Verá lista de seus pacientes
4. Selecione um paciente para gerenciar
5. Acesse as refeições e calendário do paciente selecionado

### 3. Login como Educador Físico

1. Faça login com credenciais de educador físico
2. Será redirecionado para `PhysicalEducatorHome`
3. Verá lista de seus alunos
4. Selecione um aluno para gerenciar
5. Acesse os treinos e checklist do aluno selecionado

### 4. Login como Paciente

1. Faça login com credenciais de paciente
2. Será redirecionado para `Home` (paciente)
3. Acessa seus próprios dados normalmente

## 🔍 Fluxo de Navegação

### Nutricionista:
```
Login → NutricionistHome → 
  ├─ Seleciona Paciente → Refeições do Paciente
  └─ Seleciona Paciente → Calendário do Paciente
```

### Educador Físico:
```
Login → PhysicalEducatorHome → 
  ├─ Seleciona Aluno → Treinos do Aluno
  └─ Seleciona Aluno → Checklist do Aluno
```

### Paciente:
```
Login → Home → 
  ├─ Minhas Refeições
  └─ Meus Treinos
```

## 🎨 Diferenças Visuais

### NutricionistHome:
- Lista de pacientes com avatares
- Indicador visual de paciente selecionado (✓ verde)
- Cards de ação: "Refeições" e "Calendário"
- Título: "Nutricionista - Início"

### PhysicalEducatorHome:
- Lista de alunos com avatares
- Indicador visual de aluno selecionado (✓ verde)
- Cards de ação: "Treinos" e "Checklist"
- Título: "Educador Físico - Início"

## 📝 Notas Importantes

1. **Constraint UNIQUE**: Cada paciente pode ter apenas UMA associação ativa
2. **Soft Delete**: Use `deactivate` ao invés de `delete` para manter histórico
3. **Permissões**: 
   - Nutricionistas: Acesso a dados de alimentação
   - Educadores Físicos: Acesso a dados de treino
   - Pacientes: Acesso apenas aos próprios dados

## 🐛 Troubleshooting

### Erro: "Tabela não existe"
```bash
# Recrie o banco de dados
docker compose down -v
docker compose up -d
```

### Erro: "Lista de pacientes vazia"
```sql
-- Verifique se há associações no banco
SELECT * FROM patient_professional_association;

-- Crie uma associação de teste
INSERT INTO patient_professional_association (patient_id, nutricionist_id)
VALUES ('id-paciente', 'id-nutricionista');
```

### Frontend não atualiza após mudanças
```bash
cd frontend
# Limpe o cache do Metro Bundler
npx expo start -c
```

## ✅ Checklist de Implementação

- [x] Tabela `patient_professional_association` criada
- [x] Repository, Service, Controller criados
- [x] Rotas registradas no backend
- [x] Service frontend criado
- [x] Tela `NutricionistHome` criada
- [x] Tela `PhysicalEducatorHome` criada
- [x] Roteamento por tipo de usuário implementado
- [x] Login redirecionando corretamente
- [x] App.tsx verificando tipo de usuário na inicialização
- [x] Logs automáticos implementados

## 🚀 Próximos Passos Sugeridos

1. **Tela de Gerenciamento de Associações**
   - Interface admin para criar/editar associações
   - Busca de pacientes/profissionais
   - Histórico de associações

2. **Notificações**
   - Notificar profissionais quando pacientes completam tarefas
   - Notificar pacientes de novos treinos/refeições

3. **Relatórios**
   - Dashboard com estatísticas de todos os pacientes
   - Gráficos de progresso agregado
   - Exportação de dados

4. **Chat/Mensagens**
   - Comunicação direta entre profissional e paciente
   - Envio de orientações personalizadas
