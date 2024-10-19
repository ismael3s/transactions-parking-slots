FROM node:20-alpine as builder

WORKDIR /usr/src/app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache curl
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json .


EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=6s --start-period=10s --retries=3 CMD curl --fail http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]
