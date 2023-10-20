FROM mcr.microsoft.com/playwright:v1.39.0-focal AS build

WORKDIR '/usr/src/app'

RUN npm install -g npm@10.2.0
RUN yarn add dotenv-cli

COPY ./test/e2e/mmi/package.json .
RUN yarn
# Copy test files
COPY playwright.config.ts .
COPY ./test/e2e/mmi/ ./test/e2e/mmi/
# Copy extension for test
COPY ./dist/chrome ./dist/chrome

ENTRYPOINT ["yarn", "test:visual:docker"]