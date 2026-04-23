FROM mcr.microsoft.com/playwright:v1.59.1-jammy
WORKDIR /app
COPY package.json ./
RUN npm install
COPY playwright.config.js ./
COPY tests ./tests
CMD ["npx", "playwright", "test"]
