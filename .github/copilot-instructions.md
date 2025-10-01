# Copilot AI Agent Instructions for MetaMask Extension

## Project Overview
- **MetaMask Extension** is a browser extension for Ethereum-based blockchain interactions. It supports Chrome, Firefox, and Chromium browsers.
- The codebase is modular, with clear separation between background logic, UI, build system, and shared libraries.
- Key directories:
  - `app/`: Core extension logic, background scripts, controllers (e.g., `metamask-controller.js`, `TransactionController`).
  - `ui/`: React-based UI, component library, state management (Redux, Context, hooks).
  - `shared/`: Shared constants, utilities, and logic between background and UI.
  - `development/`: Build scripts, dev tools, and workflow automation.
  - `docs/`: Architecture, workflows, and refactoring guides.

## Build & Development Workflows
- **Local build:**
  - Use `yarn start` for a watched development build (fast, no LavaMoat).
  - Use `yarn dist` for a production build (outputs to `builds/`).
  - Use `yarn webpack` for custom dev builds (see `development/webpack/README.md`).
- **Environment setup:**
  - Copy `.metamaskrc.dist` to `.metamaskrc` and set `INFURA_PROJECT_ID` (see root `README.md`).
  - For Segment/Sentry debugging, set `SEGMENT_WRITE_KEY`/`SENTRY_DSN` in `.metamaskrc`.
- **Testing:**
  - E2E and integration tests are in `test/` (see sub-`README.md` files for details).
- **Component development:**
  - Use `ui/components/component-library/` for design-system-aligned components. Prefer `Box`-based layout and design tokens.

## Architecture & Patterns
- **Background logic:**
  - `app/scripts/metamask-controller.js` glues together controllers for transactions, messages, and approvals.
  - Transaction and message handling is migrating to `@metamask/transaction-controller` and `@metamask/message-manager` (see `docs/confirmation-refactoring/confirmation-backend-architecture/README.md`).
- **UI state:**
  - Use Redux state (`state.metamask`) as the single source of truth.
  - Use hooks and React Context for derived/temporary UI state (see `docs/confirmation-refactoring/confirmation-state-management/README.md`).
- **Build transforms:**
  - Custom Browserify transforms (e.g., `remove-fenced-code.js`) enable build-type-specific code inclusion (see `development/build/transforms/README.md`).

## Conventions & Gotchas
- **Feature flags:** Use `.manifest-overrides.json` and `MANIFEST_OVERRIDES` for custom builds.
- **Design tokens:** Use MetaMask design tokens for UI colors/styles; avoid hardcoded hex values.
- **Component patterns:** Use polymorphic `as` prop and style utility props for layout (see `component-library/README.md`).
- **Refactoring:** See `docs/confirmation-refactoring/` for ongoing architectural changes and best practices.

## References
- [Root `README.md`](../README.md)
- [Development workflow](../development/README.md)
- [Build system](../development/build/README.md)
- [Component library](../ui/components/component-library/README.md)
- [Confirmation refactoring docs](../docs/confirmation-refactoring/)

---

**If unsure about a workflow or pattern, check the referenced READMEs or ask for clarification.**
