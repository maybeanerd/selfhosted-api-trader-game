FROM node:22.14.0
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
CMD ["pnpm", "start:prod"]