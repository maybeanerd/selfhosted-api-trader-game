FROM node:20.12.2
WORKDIR /app

COPY ["package.json", ".npmrc", "./"]
# Install pnpm
RUN corepack enable pnpm
# Intall dependencies
RUN pnpm i

# Build
COPY . .
RUN pnpm run build

# Start service
CMD ["pnpm", "run", "start"]