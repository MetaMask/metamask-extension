FROM mcr.microsoft.com/playwright:v1.42.1-focal AS build

WORKDIR '/usr/src/app'

# Copy test files
COPY playwright.config.ts .
COPY . ./test/e2e/mmi/
# Copy extension for test
COPY ./dist/chrome ./dist/chrome

# Install testing dependencies
RUN yarn add dotenv@^16.0.1 @playwright/test@^1.39.0 axios@^1.1.3
ENV HEADLESS=false

ENTRYPOINT ["npx", "xvfb-run", "playwright", "test", "--workers=1", "--project=mmi.visual"]