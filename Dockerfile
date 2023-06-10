FROM node:20.3.0
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Intall dependencies
COPY ["package.json", "pnpm-lock.yaml", "./"]
RUN pnpm i

# Build
COPY . .
RUN pnpm run build

# Start service
CMD ["pnpm", "run", "start:prod"]