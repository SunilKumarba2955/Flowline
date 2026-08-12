FROM node:24.5.0-alpine AS build
WORKDIR /workspace
ARG VITE_API_BASE_URL=http://127.0.0.1:4000
ARG VITE_GRAPHQL_URL=http://127.0.0.1:4000/graphql
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages ./packages
RUN npm ci --workspaces --include-workspace-root
COPY apps/web ./apps/web
RUN npm run build --workspace @flowline/web

FROM nginxinc/nginx-unprivileged:1.27.1-alpine
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
COPY infra/docker/web.nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
