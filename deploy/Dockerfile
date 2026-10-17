# ponytail: multi-stage, non-root. qr-lab builds in its own stage, dist copied to runtime.
# Site has no runtime deps — just stdlib Node 24.
FROM node:24-alpine AS qrlab
WORKDIR /qr-lab
COPY qr-lab/package.json qr-lab/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY qr-lab/ ./
RUN npm run build

FROM node:24-alpine AS runtime
RUN apk add --no-cache tini curl \
 && addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --chown=app:app . /app
COPY --from=qrlab --chown=app:app /qr-lab/dist /app/qr-lab/dist
RUN rm -rf /app/qr-lab/node_modules /app/node_modules /app/.git /app/deploy
USER app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4185
EXPOSE 4185
ENTRYPOINT ["/sbin/tini","--"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1:4185/ || exit 1
CMD ["node","server.mjs"]
