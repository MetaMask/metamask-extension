# Local Development Quickstart

This document summarizes the minimum steps required to get the MetaMask extension running from source on your local machine. It does not replace the main README, but gives you a shorter checklist to follow.

## Prerequisites

Before you start, make sure that you have:

- Node.js 24.x (matching the version in `.nvmrc`)
- Corepack enabled, so Yarn is managed per project
- Git installed
- A valid Infura API key, which will be used as `INFURA_PROJECT_ID`

If you use `nvm`, you can run:

    nvm use

to select the Node.js version defined by the project.

To enable Corepack (if you have not already):

    corepack enable

## 1. Clone the repository and install dependencies

If you are working directly from the main repository:

    git clone https://github.com/MetaMask/metamask-extension.git
    cd metamask-extension
    corepack enable
    yarn install

If you are working on your own fork, replace the clone URL with your fork URL.

## 2. Create your `.metamaskrc` file

The project ships with a template configuration file named `.metamaskrc.dist`. Copy it and edit the copy:

    cp .metamaskrc{.dist,}

Then open `.metamaskrc` and update at least:

- `INFURA_PROJECT_ID` – set this to your own Infura API key.

Optionally, you can also set:

- `PASSWORD` – a development wallet password, so you do not need to type it each time.
- `SEGMENT_WRITE_KEY` – if you need to debug MetaMetrics.
- `SENTRY_DSN` – if you need to debug unhandled exceptions.
- `MANIFEST_OVERRIDES` – if you want to use a custom `.manifest-overrides.json` file.

## 3. Build or start a development build

For a development build on Chromium-based browsers:

    yarn start

This will watch your changes and rebuild the extension.

For a development build targeting Firefox (Manifest V2):

    yarn start:mv2

If you want a one-time build instead of watch mode, you can use:

    yarn dist        # Chromium-based browsers
    yarn dist:mv2    # Firefox

The built artifacts will be placed in the `dist` and `builds` folders.

## 4. Load the extension in your browser

After building:

- For Chromium-based browsers, load the unpacked extension from the `dist/chrome` folder.
- For Firefox, load the extension from the `dist/firefox` folder.

For detailed instructions, see the sections:

- “How to add custom build to Chrome”
- “How to add custom build to Firefox”

linked from the main README.

## 5. Running tests and linting

To run tests and the linter together:

    yarn test

Only unit tests:

    yarn test:unit

Only linting:

    yarn lint

You can also run linting only on changed files:

    yarn lint:changed
    yarn lint:changed:fix

## 6. Troubleshooting tips

### Node.js version errors

If you see unexpected ESM/TypeScript errors or issues during install/build:

- ensure that you are using the Node.js version specified in `.nvmrc`,
- if needed, remove `node_modules` and reinstall dependencies with `yarn install`.

### Missing or invalid `INFURA_PROJECT_ID`

If the build cannot communicate with the network or some features do not work:

- verify that `INFURA_PROJECT_ID` in `.metamaskrc` is set to a valid value,
- restart your development build after changing `.metamaskrc`.

### Yarn issues

If you run into Yarn-related errors:

- make sure Corepack is enabled,
- avoid installing Yarn globally with npm,
- let Corepack manage the Yarn version specified by the project configuration.

---

This document is meant as a compact companion to the main README for new contributors who want a quick local development checklist.
