FROM node:20-alpine

# Instalar dependências do sistema necessárias para bcrypt e pg
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src

COPY package.json ./
COPY package-lock.json ./

# Instalar todas as dependências (produção + desenvolvimento)
RUN npm ci --include=dev

COPY . .

EXPOSE 5001

CMD ["npm", "start"]