FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
ENV PORT=4000
EXPOSE 4000
CMD ["node", "dist/index.js"]
