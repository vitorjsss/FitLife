# FitLife

## Pré-requisitos
- Docker e Docker Compose instalados
- Node.js (opcional, para rodar frontend localmente)

## Passos para rodar o projeto pela primeira vez

### 1. Clonar o repositório
```sh
git clone <>
cd FitLife
```

### 2. Subir os containers (backend e banco de dados)
```sh
docker-compose up --build
```
Isso irá:
- Criar o banco de dados Postgres com usuário, senha e banco `fitlife`
- Rodar o backend na porta 5001 (acessível em http://localhost:5001)

### 3. Rodar o frontend

#### Usando Docker (recomendado)
*Adicione instruções se houver Docker para o frontend*

#### Localmente (Node.js instalado)
```sh
cd frontend
npm install
npm start
```
O frontend será iniciado conforme configuração do Expo/React Native.

### 4. Configurar variáveis de ambiente
- O backend já está configurado via Docker Compose.
- Se rodar localmente, crie um arquivo `.env` em `backend/` com:
```
DB_USER=fitlife
DB_PASSWORD=fitlife
DB_NAME=fitlife
DB_PORT=5433
DB_HOST=localhost
JWT_SECRET=umaChaveSuperSecreta123
JWT_REFRESH_SECRET=outraChaveSuperSecreta456
```

### 5. Acessar o banco de dados
- Use DBeaver ou outro cliente Postgres:
  - Host: localhost
  - Porta: 5433
  - Database: fitlife
  - Usuário: fitlife
  - Senha: fitlife

### 6. Resetar o banco de dados
Para apagar e recriar tudo do zero:
```sh
docker-compose down -v
```
Depois:
```sh
docker-compose up --build
```

---

## Estrutura do projeto
- `backend/` - API Node.js/Express
- `frontend/` - App React Native/Expo
- `docker-compose.yml` - Orquestração dos serviços

---

## Dúvidas
Abra uma issue ou consulte este README.