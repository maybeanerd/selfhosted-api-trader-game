FROM node:18
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Intall dependencies
COPY ["package.json", "package-lock.json*", "./"]
RUN pnpm i

# Build
COPY . .
RUN pnpm run build

# Start service
CMD ["pnpm", "run", "start"]