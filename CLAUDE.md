# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development & Building
- `yarn start` - Start development build with file watching (Chromium-based browsers)
- `yarn start:mv2` - Start development build for Firefox (Manifest V2)
- `yarn start:flask` - Start development build with experimental Flask features
- `yarn dist` - Create production build (Chromium-based browsers)
- `yarn dist:mv2` - Create production build for Firefox

### Testing
- `yarn test` - Run all tests (lint + unit tests)
- `yarn test:unit` - Run unit tests only
- `yarn test:unit:watch` - Run unit tests in watch mode
- `yarn test:e2e:chrome` - Run end-to-end tests on Chrome
- `yarn test:e2e:firefox` - Run end-to-end tests on Firefox
- `yarn test:e2e:single test/e2e/tests/TEST_NAME.spec.js` - Run single e2e test

### Linting & Code Quality
- `yarn lint` - Run all linters (prettier, eslint, tsc, styles, images)
- `yarn lint:fix` - Auto-fix linting issues where possible
- `yarn lint:tsc` - Run TypeScript type checking only
- `yarn lint:changed` - Lint only changed files

### Build System
- `yarn webpack` - Alternative faster build system (development)
- `yarn build:test` - Create test build for e2e testing
- `yarn storybook` - Start Storybook development server

## Architecture Overview

### Directory Structure
- **`app/`** - Background scripts, controllers, and extension core logic
  - `app/scripts/` - Main background scripts and controllers
  - `app/scripts/controllers/` - State management controllers
  - `app/scripts/lib/` - Utility libraries and middleware
  - `app/scripts/migrations/` - State migration scripts
- **`ui/`** - Frontend React components and pages
  - `ui/components/` - Reusable React components
  - `ui/pages/` - Page-level components
  - `ui/hooks/` - Custom React hooks
  - `ui/selectors/` - Redux selectors
  - `ui/store/` - Redux store and actions
- **`shared/`** - Code shared between background and UI
  - `shared/constants/` - Application constants
  - `shared/lib/` - Utility functions
  - `shared/modules/` - Shared business logic
- **`test/`** - Test files and utilities
- **`development/`** - Build tools and development utilities

### Key Architectural Patterns

#### Controller Architecture
MetaMask uses a controller-based architecture where each controller manages a specific piece of application state:
- Controllers are initialized in `app/scripts/controller-init/`
- Controllers communicate via messengers defined in `app/scripts/controller-init/messengers/`
- Main controller orchestration happens in `metamask-controller.js`

#### Background/UI Separation
- **Background scripts** (`app/`) handle business logic, state management, and blockchain interactions
- **UI code** (`ui/`) handles presentation and user interactions
- Communication between background and UI happens via message passing
- **Shared code** (`shared/`) contains utilities used by both contexts

#### Import Rules (Enforced by ESLint)
- Background (`app/`) cannot import from UI (`ui/`)
- UI (`ui/`) cannot import from Background (`app/`)
- Shared (`shared/`) cannot import from either Background or UI
- Use `shared/` for code that needs to be used by both contexts

### Technology Stack
- **Frontend**: React 17, Redux, SCSS
- **Backend**: Node.js background scripts
- **Build System**: Browserify + Gulp (main), Webpack (alternative)
- **Testing**: Jest (unit), Mocha (e2e), Storybook (component)
- **Languages**: JavaScript, TypeScript (mixed codebase in migration)
- **Styling**: SCSS, Design System components, Tailwind CSS (limited areas)

## Development Guidelines

### File Naming and Structure
- Use kebab-case for directories and files
- Component files: `component-name.js`, `component-name.test.js`, `component-name.stories.js`
- Controller files: `controller-name-controller.js`
- Test files should be co-located with source files

### TypeScript Migration
- The codebase is gradually migrating to TypeScript
- New files should be written in TypeScript when possible
- Use `.ts` extension for TypeScript files, `.tsx` for React components
- Type definitions are in the `types/` directory

### Component Development
- Use functional components with hooks
- Follow the existing component structure in `ui/components/`
- Create Storybook stories for new components
- Use the MetaMask Design System components when available

### State Management
- Controllers handle background state
- UI state uses Redux with the existing patterns in `ui/store/`
- Selectors are organized in `ui/selectors/`
- Use React hooks for local component state

### Testing Practices
- Write unit tests for new functionality
- Use Jest for component and utility testing
- E2E tests go in `test/e2e/tests/`
- Mock external dependencies appropriately

### Build Types and Environment Variables
- Configure environment variables in `.metamaskrc` (copy from `.metamaskrc.dist`)
- Main build types: `main` (default), `beta`, `flask` (experimental features)
- Required: Set `INFURA_PROJECT_ID` for blockchain connectivity

### Browser Extension Specifics
- Manifest files are in `app/manifest/` (separate for MV2/MV3)
- Background scripts, content scripts, and popup all have separate entry points
- Be aware of Content Security Policy restrictions

## Common Development Tasks

### Adding a New Controller
1. Create controller file in `app/scripts/controllers/`
2. Add controller initialization in `app/scripts/controller-init/`
3. Set up messenger in `app/scripts/controller-init/messengers/`
4. Register in `metamask-controller.js`

### Adding a New UI Component
1. Create component directory in `ui/components/`
2. Implement component with proper PropTypes or TypeScript types
3. Add Storybook story
4. Write unit tests
5. Add to appropriate page or parent component

### Working with Feature Flags
- Feature flags can be set in `.metamaskrc`
- Test with different build types using `--build-type` flag
- Feature flags affect both build-time and runtime behavior

### Debugging
- Use browser DevTools for UI debugging
- Background script debugging via `chrome://extensions` → "Inspect views: background page"
- Enable React/Redux DevTools via `METAMASK_REACT_REDUX_DEVTOOLS=true` in `.metamaskrc`

### Code Quality Requirements
- All code must pass ESLint, TypeScript checking, and Prettier formatting
- Run `yarn lint` before committing
- Follow the existing code style and patterns
- Ensure imports follow the architectural boundaries enforced by ESLint