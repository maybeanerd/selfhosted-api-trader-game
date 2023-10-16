FROM node:20.8.1
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Intall dependencies
COPY ["package.json", ".npmrc", "./"]
RUN pnpm i

# Build
COPY . .
RUN pnpm run build

# Start service
CMD ["pnpm", "run", "start:prod"]