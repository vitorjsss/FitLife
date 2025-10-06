FROM node:20-alpine
WORKDIR /usr/src
COPY package.json ./
COPY package-lock.json ./
RUN npm install --include=dev
COPY . .
EXPOSE 5000
CMD ["npm", "start"]