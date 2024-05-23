FROM cimg/node:20.11.0-browsers AS build

WORKDIR '/usr/src/app'

# # Copy test files
COPY . .

# Install testing dependencies
ENV HEADLESS=false
ENV ENABLE_CHROME_LOGGING=true

#RUN chmod +x /test/e2e/run-e2e-test.js
CMD ["yarn", "test:e2e:single", "/usr/src/app/test/e2e/tests/account-menu/account-details.spec.js", "--browser=chrome"]
