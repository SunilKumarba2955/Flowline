FROM node:24.5.0-alpine AS build
WORKDIR /workspace
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages ./packages
RUN npm ci --workspaces --include-workspace-root
COPY apps/api ./apps/api
COPY modules ./modules
RUN npm run build --workspace @flowline/api
RUN npm prune --omit=dev --workspaces --include-workspace-root

FROM node:24.5.0-alpine AS runtime
ENV NODE_ENV=production API_PORT=4000
USER node
WORKDIR /app
COPY --from=build --chown=node:node /workspace/apps/api/dist ./dist
COPY --from=build --chown=node:node /workspace/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/server.js"]
