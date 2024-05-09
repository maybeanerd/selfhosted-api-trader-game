FROM node:20.13.1
WORKDIR /app

COPY ["package.json", ".npmrc", "./"]
# Install pnpm
RUN corepack enable pnpm
# Intall dependencies
RUN pnpm i

# Build
COPY . .
RUN pnpm build

# Start service
CMD ["node", ".output/server/index.mjs"]