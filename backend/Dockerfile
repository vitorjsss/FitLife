FROM node:20-alpine
WORKDIR /usr/src
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]