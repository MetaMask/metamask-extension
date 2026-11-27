import type { KnipConfig } from 'knip';

/**
 * Knip configuration for MetaMask Extension.
 *
 * Phase 1 scope: the check fails CI only on unused `files`, unused
 * `dependencies`, and `unlisted` dependencies (imports of packages that are
 * not declared in package.json). Everything else (unused exports, unused
 * types, duplicate exports, enum members, unresolved imports, binaries,
 * cycles, ...) is `off` for now: those reports are far too noisy in a
 * codebase of this size to gate on and can be enabled incrementally later.
 *
 * Findings never fail CI directly. `yarn knip:check` compares the knip report
 * against the committed baseline in `development/knip-baseline.jsonc`
 * (development/knip-baseline.ts). The baseline is the work queue: new findings
 * fail, already-known findings are listed there and get cleaned up by the
 * owning teams over time. See docs/dead-code-check.md.
 *
 * Knip only parses JS/TS (and a few framework) files. The extension's real
 * entry points are referenced from HTML pages and extension manifests, which
 * knip cannot parse, so they are declared explicitly below.
 */
const config: KnipConfig = {
  // The Stylelint plugin would pull every .scss/.css file into the project
  // graph (knip cannot parse @import/@use inside stylesheets), producing a
  // cascade of false "unused file" findings. Stylesheets are verified by
  // `yarn lint:styles` instead and excluded from this check.
  stylelint: false,

  rules: {
    // Blocking (phase 1).
    files: 'error',
    dependencies: 'error',
    unlisted: 'error',
    // Not reported for now. Revisit one by one in later phases.
    devDependencies: 'off',
    optionalPeerDependencies: 'off',
    binaries: 'off',
    unresolved: 'off',
    exports: 'off',
    types: 'off',
    nsExports: 'off',
    nsTypes: 'off',
    duplicates: 'off',
    enumMembers: 'off',
    namespaceMembers: 'off',
    subpaths: 'off',
    catalog: 'off',
    catalogReferences: 'off',
    cycles: 'off',
  },

  entry: [
    // Runtime roots referenced from the HTML pages in app/html (background,
    // popup/notification/sidepanel UI, loading, offscreen, cashtag widget);
    // knip does not parse HTML, so the <script src> targets are declared.
    'app/scripts/load/*.{js,ts,tsx}',
    'app/offscreen/*.ts',
    'app/scripts/cashtag/widget/frame.tsx',
    'app/scripts/use-snow.js',
    // Referenced from the extension manifests (app/manifest/v2, v3); knip
    // does not parse manifests either.
    'app/scripts/contentscript.js',
    'app/scripts/inpage.js',
    'app/service-worker.ts',
    // Standalone dev-only scripts injected at runtime (see
    // app/scripts/development/README.md), and compile-time type-level proofs
    // (type assertions exercised by `yarn lint:tsc` through tsconfig
    // inclusion, never imported).
    'app/scripts/development/**/*.ts',
    '**/*.proof.ts',
    // Storybook: the .storybook config is the entry; stories are picked up
    // from the `stories` globs in .storybook/main.js by the Storybook plugin.
    '.storybook/**/*.{js,mjs,cjs,ts,mts,tsx}',
    // Build/tooling scripts, the ts-migration dashboard app and webpack
    // configs; many are executed by package.json scripts, shell scripts and
    // CI workflows that knip cannot parse.
    'development/**/*.{js,mjs,cjs,ts,mts,tsx}',
    // Devcontainer setup scripts, executed by .devcontainer/devcontainer.json.
    '.devcontainer/**/*.ts',
    // E2E suites are gathered at runtime by runners and globs (Selenium and
    // Playwright), which knip cannot follow.
    'test/e2e/**/*.{js,mjs,cjs,ts,mts,tsx}',
    // Integration tests run under their own jest config
    // (jest.integration.config.js), which the Jest plugin does not read.
    'test/integration/**/*.{js,mjs,cjs,ts,tsx}',
    // Test helpers, mocks and fixtures are wired up through jest/runner
    // configuration strings rather than imports.
    'test/**/*.{js,mjs,cjs,ts,tsx}',
    // GitHub workflow helper scripts; executed by CI, not imported.
    '.github/scripts/**/*.{js,mjs,cjs,ts,mts}',
    // Root-level configuration files (jest.config.js, stylelint.config.js,
    // oxfmt.config.mts, ...).
    '*.{js,mjs,cjs,ts,mts}',
  ],

  // Explicit project globs keep the graph to JS/TS only: stylesheets, HTML
  // pages, manifests and images are aggregated or referenced through
  // mechanisms knip cannot parse and are verified by dedicated tooling.
  project: [
    'app/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
    'shared/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
    'ui/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
    'development/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
    'test/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
    '.storybook/**/*.{js,mjs,cjs,ts,tsx,mts,cts}',
    '.github/scripts/**/*.{js,mjs,cjs,ts,mts}',
    '.devcontainer/**/*.{js,ts}',
    'types/**/*.{js,ts}',
    '*.{js,mjs,cjs,ts,mts}',
  ],

  // Files knip should not analyze at all. These are the only ignore entries
  // with effect: they sit inside the `project` globs above but are not part
  // of the JS import graph (vendored bundles, caches, build outputs).
  ignore: [
    // Vendored, self-contained browser bundles; referenced directly from the
    // manifests and HTML pages, with nothing for knip to parse inside.
    'app/vendor/**',
    // Yarn Berry plugins are loaded by Yarn itself, not by Node.
    '.yarn/**',
    // Webpack build cache and dashboard build output.
    'development/.webpack/**',
    'development/ts-migration-dashboard/build/**',
    // Self-contained vendor bundles used for testing.
    'test/e2e/send-eth-with-private-key-test/**',
  ],

  // Dependencies referenced only through mechanisms knip cannot see. Every
  // entry documents why the dependency is real — do not delete an entry
  // without re-verifying. Mirrors .depcheckrc.yml, which tracks the same
  // class of blind spots for depcheck.
  ignoreDependencies: [
    // Loaded via `<script src="@lavamoat/snow/snow.prod.js">` from the HTML
    // pages in app/html; never imported from JS.
    '@lavamoat/snow',
    // Font files (woff2/svg) and icons are referenced from SCSS/CSS url()
    // rules (see .depcheckrc.yml); no direct JS import.
    '@fortawesome/fontawesome-free',
    // Babel transform string (`transform: { '^.+\\.(js|jsx|ts|tsx)$':
    // 'babel-jest' }`) in jest.config.js / jest.integration.config.js.
    'babel-jest',
    // Type-only import in development/eslint-rules/page-object-member-order.js;
    // shipped with the ESLint toolchain.
    'estree',
    // Loaded by the React Compiler Babel plugin when compiling components
    // (`react-compiler-runtime`), never imported directly.
    'react-compiler-runtime',
    // jest.mock('ulid') in app/scripts/metamask-controller*.test.js mocks a
    // dependency that only exists transitively (hoisted); not declared here.
    'ulid',
    // WebAssembly asset loaded via `new URL('@rive-app/canvas/rive.wasm',
    // import.meta.url)` in ui/contexts/rive-wasm/index.tsx; ships as a
    // transitive dependency of @rive-app/react-canvas.
    '@rive-app/canvas',
    // Used by the Ledger (Trezor connect-web) integration through ts-mixer
    // mixins; imported only from @ledgerhq/* packages (see .depcheckrc.yml).
    'ts-mixer',
  ],
};

export default config;
