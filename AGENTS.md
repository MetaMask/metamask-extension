## Dev environment tips

- Use `yarn start` to create a Browserify build to be loaded manually as a browser extension.
- Use `yarn webpack` to create a Webpack build to be loaded manually as a browser extension.

## Testing instructions

- Find the CI plan in the .github/workflows folder.
- Fix any test or type errors until the whole suite is green.
- Use `yarn test:unit` to run all tests.
- Use `yarn test:unit <file_name>` to run an individual test.
- Add or update tests for the code you change, even if nobody asked.

## PR instructions

- Use conventional commit format for the PR title
