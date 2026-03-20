FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

FROM base AS deps
COPY package*.json ./
RUN npm install --only=production

FROM base AS final
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p logs && chown -R node:node /app
USER node
EXPOSE 5000
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "node src/config/migrate.js && node src/server.js"]
