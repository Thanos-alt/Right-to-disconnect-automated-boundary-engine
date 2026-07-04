FROM node:20-alpine
WORKDIR /usr/src/app

# Install build deps
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source
COPY . ./

# Seed demo data (optional; will create data.db inside container)
RUN node scripts/demo_data.js --users=10 --days=14 || true

EXPOSE 4000
ENV PORT=4000
CMD ["node", "server.js"]
