const { readFileSync } = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { version: reactVersion } = require('react/package.json');

const {
  architecturalZones,
  buildSystemZones,
} = require('./development/eslint-restricted-paths-zones');

const tsconfigPath = ts.findConfigFile('./', ts.sys.fileExists);
const { config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
const tsconfig = ts.parseJsonConfigFileContent(config, ts.sys, './');

/**
 * @type {import('eslint').Linter.Config }
 */
module.exports = {
  root: true,
  // Ignore files which are also in .prettierignore
  ignorePatterns: readFileSync('.prettierignore', 'utf8').trim().split('\n'),
  // eslint's parser, esprima, is not compatible with ESM, so use the babel parser instead
  parser: '@babel/eslint-parser',
  overrides: [
    /**
     * == Modules ==
     *
     * The first three sections here, which cover module syntax, are mutually
     * exclusive: the set of files covered between them may NOT overlap. This is
     * because we do not allow a file to use two different styles for specifying
     * imports and exports (however theoretically possible it may be).
     */
    {
      /**
       * Modules (CommonJS module syntax)
       *
       * This is code that uses `require()` and `module.exports` to import and
       * export other modules.
       */
      files: [
        '.eslintrc.js',
        '.eslintrc.*.js',
        '.mocharc.js',
        '*.config.js',
        'app/scripts/lockdown-run.js',
        'app/scripts/lockdown-more.js',
        'development/**/*.js',
        'test/e2e/**/*.js',
        'test/helpers/*.js',
        'test/run-unit-tests.js',
      ],
      extends: [
        path.resolve(__dirname, '.eslintrc.base.js'),
        path.resolve(__dirname, '.eslintrc.node.js'),
        path.resolve(__dirname, '.eslintrc.babel.js'),
        path.resolve(__dirname, '.eslintrc.typescript-compat.js'),
      ],
      settings: {
        'import-x/resolver': {
          // When determining the location of a `require()` call, use Node's
          // resolution algorithm, then fall back to TypeScript's. This allows
          // TypeScript files (which Node's algorithm doesn't recognize) to be
          // imported from JavaScript files, while also preventing issues when
          // using packages like `prop-types` (where we would otherwise get "No
          // default export found in imported module 'prop-types'" from
          // TypeScript because imports work differently there).
          node: {},
          typescript: {
            // Always try to resolve types under `<root>/@types` directory even
            // it doesn't contain any source code, like `@types/unist`
            alwaysTryTypes: true,
          },
        },
      },
    },
    /**
     * Modules (ES module syntax)
     *
     * This is code that explicitly uses `import`/`export` instead of
     * `require`/`module.exports`.
     */
    {
      files: [
        'app/**/*.js',
        'shared/**/*.js',
        'ui/**/*.js',
        '**/*.test.js',
        'test/lib/**/*.js',
        'test/mocks/**/*.js',
        'test/jest/**/*.js',
        'test/stub/**/*.js',
        'test/unit-global/**/*.js',
      ],
      excludedFiles: [
        'app/scripts/lockdown-run.js',
        'app/scripts/lockdown-more.js',
      ],
      extends: [
        path.resolve(__dirname, '.eslintrc.base.js'),
        path.resolve(__dirname, '.eslintrc.node.js'),
        path.resolve(__dirname, '.eslintrc.babel.js'),
        path.resolve(__dirname, '.eslintrc.typescript-compat.js'),
      ],
      parserOptions: {
        sourceType: 'module',
      },
      settings: {
        'import-x/resolver': {
          // When determining the location of an `import`, use Node's resolution
          // algorithm, then fall back to TypeScript's. This allows TypeScript
          // files (which Node's algorithm doesn't recognize) to be imported
          // from JavaScript files, while also preventing issues when using
          // packages like `prop-types` (where we would otherwise get "No
          // default export found in imported module 'prop-types'" from
          // TypeScript because imports work differently there).
          node: {},
          typescript: {
            // Always try to resolve types under `<root>/@types` directory even
            // it doesn't contain any source code, like `@types/unist`
            alwaysTryTypes: true,
          },
        },
      },
    },
    /**
     * TypeScript files
     */
    {
      files: tsconfig.fileNames.filter((f) => /\.tsx?$/u.test(f)),
      parserOptions: {
        project: tsconfigPath,
        // https://github.com/typescript-eslint/typescript-eslint/issues/251#issuecomment-463943250
        tsconfigRootDir: __dirname,
      },
      extends: [
        path.resolve(__dirname, '.eslintrc.base.js'),
        '@metamask/eslint-config-typescript',
        path.resolve(__dirname, '.eslintrc.typescript-compat.js'),
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        // this rule is new, but we didn't use it before, so it's off now
        '@typescript-eslint/no-duplicate-enum-values': 'off',
        '@typescript-eslint/no-shadow': [
          'error',
          {
            builtinGlobals: true,
            allow: [
              'ErrorOptions',
              'Text',
              'Screen',
              'KeyboardEvent',
              'Lock',
              'Notification',
              'CSS',
              'Props',
            ],
          },
        ],
        // `no-parameter-properties` was removed in favor of `parameter-properties`
        // Yeah, they have opposite names but do the same thing?!
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/parameter-properties': 'error',
        // Turn these off, as it's recommended by typescript-eslint.
        // See: <https://typescript-eslint.io/docs/linting/troubleshooting#eslint-plugin-import>
        'import-x/named': 'off',
        'import-x/namespace': 'off',
        'import-x/default': 'off',
        'import-x/no-named-as-default-member': 'off',
        // Set to ban interfaces due to their incompatibility with Record<string, unknown>.
        // See: <https://github.com/Microsoft/TypeScript/issues/15300#issuecomment-702872440>
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        // This rule temporarily applies the latest `@typescript-eslint/naming-convention` config found in `@metamask/eslint-config`.
        // TODO: Remove once `@metamask/eslint-config` is updated to `^14.0.0`.
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'default',
            format: ['camelCase'],
            leadingUnderscore: 'allow',
            trailingUnderscore: 'forbid',
          },
          { selector: 'enumMember', format: ['PascalCase'] },
          {
            selector: 'function',
            modifiers: ['exported'],
            format: ['camelCase', 'PascalCase'],
          },
          {
            selector: 'import',
            format: ['camelCase', 'PascalCase', 'snake_case', 'UPPER_CASE'],
          },
          {
            selector: 'interface',
            format: ['PascalCase'],
            custom: { regex: '^I[A-Z]', match: false },
          },
          {
            selector: 'objectLiteralMethod',
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          },
          {
            selector: 'objectLiteralProperty',
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          },
          { selector: 'typeLike', format: ['PascalCase'] },
          {
            selector: 'typeParameter',
            format: ['PascalCase'],
            custom: { regex: '^.{3,}', match: true },
          },
          {
            selector: 'variable',
            format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
            leadingUnderscore: 'allow',
          },
          {
            selector: 'parameter',
            format: ['camelCase', 'PascalCase'],
            leadingUnderscore: 'allow',
          },
          {
            selector: [
              'classProperty',
              'objectLiteralProperty',
              'typeProperty',
              'classMethod',
              'objectLiteralMethod',
              'typeMethod',
              'accessor',
              'enumMember',
            ],
            format: null,
            modifiers: ['requiresQuotes'],
          },
        ],
        // This rule temporarily applies the latest `@typescript-eslint/restrict-template-expressions` config found in `@metamask/eslint-config`.
        // TODO: Remove once `@metamask/eslint-config` is updated to `^14.0.0`.
        '@typescript-eslint/restrict-template-expressions': [
          'error',
          {
            allowBoolean: true,
            allowNumber: true,
          },
        ],
        // TODO: Remove once `@metamask/eslint-config-typescript` is updated to a version with this setting.
        'consistent-return': 'off',

        // These rule modifications are removing changes to our shared ESLint config made after
        // version v9. This is a temporary measure to get us to ESLint v9 compatible versions,
        // at which point we can restore the intended rules and use error suppression instead.
        //
        // TODO: Remove these modifications after the ESLint v9 update
        '@typescript-eslint/await-thenable': 'off',
        '@typescript-eslint/consistent-type-exports': 'off',
        '@typescript-eslint/consistent-type-imports': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-base-to-string': 'off',
        '@typescript-eslint/no-duplicate-type-constituents': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/no-redundant-type-constituents': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        '@typescript-eslint/no-unnecessary-type-arguments': 'off',
        '@typescript-eslint/no-unsafe-enum-comparison': 'off',
        '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
        '@typescript-eslint/no-unsafe-function-type': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/only-throw-error': 'off',
        '@typescript-eslint/prefer-enum-initializers': 'off',
        '@typescript-eslint/prefer-includes': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        '@typescript-eslint/prefer-optional-chain': 'off',
        '@typescript-eslint/prefer-promise-reject-errors': 'off',
        '@typescript-eslint/prefer-readonly': 'off',
        '@typescript-eslint/prefer-reduce-type-parameter': 'off',
        '@typescript-eslint/prefer-string-starts-ends-with': 'off',
        '@typescript-eslint/promise-function-async': 'off',
        '@typescript-eslint/restrict-plus-operands': 'off',
        '@typescript-eslint/switch-exhaustiveness-check': 'off',
        '@typescript-eslint/unbound-method': 'off',
        'import-x/no-named-as-default': 'off',
        'no-restricted-syntax': [
          'error',
          {
            selector: 'WithStatement',
            message: 'With statements are not allowed',
          },
          {
            selector: 'SequenceExpression',
            message: 'Sequence expressions are not allowed',
          },
          // {
          //   selector: "BinaryExpression[operator='in']",
          //   message: 'The "in" operator is not allowed',
          // },
          // {
          //   selector:
          //     "PropertyDefinition[accessibility='private'], MethodDefinition[accessibility='private'], TSParameterProperty[accessibility='private']",
          //   message: 'Use a hash name instead.',
          // },
        ],
      },
      settings: {
        'import-x/resolver': {
          // When determining the location of an `import`, prefer TypeScript's
          // resolution algorithm. Note that due to how we've configured
          // TypeScript in `tsconfig.json`, we are able to import JavaScript
          // files from TypeScript files.
          typescript: {
            // Always try to resolve types under `<root>/@types` directory even
            // it doesn't contain any source code, like `@types/unist`
            alwaysTryTypes: true,
          },
        },
      },
    },
    {
      files: ['.agents/**/*.ts'],
      rules: {
        'import-x/no-nodejs-modules': 'off',
      },
    },
    /**
     * == Everything else ==
     *
     * The sections from here on out may overlap with each other in various
     * ways depending on their function.
     */

    /**
     * React-specific code
     *
     * Code in this category contains JSX and hence needs to be run through the
     * React plugin.
     */
    {
      files: [
        'test/lib/render-helpers.js',
        'test/jest/rendering.js',
        'ui/**/*.js',
      ],
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ['react', 'react-compiler'],
      rules: {
        'react-compiler/react-compiler': 'error',
        'react/no-unused-prop-types': 'error',
        'react/no-unused-state': 'error',
        'react/jsx-boolean-value': 'error',
        'react/jsx-curly-brace-presence': [
          'error',
          {
            props: 'never',
            children: 'never',
          },
        ],
        'react/no-deprecated': 'error',
        'react/default-props-match-prop-types': 'error',
        'react/jsx-no-duplicate-props': 'error',
        'react-hooks/exhaustive-deps': [
          'warn',
          {
            additionalHooks: 'useAsync(Callback|Result|ResultOrThrow)',
          },
        ],
      },
      settings: {
        react: {
          // If this is set to 'detect', ESLint will import React in order to
          // find its version. Because we run ESLint in the build system under
          // LavaMoat, this means that detecting the React version requires a
          // LavaMoat policy for all of React, in the build system. That's a
          // no-go, so we grab it from React's package.json.
          version: reactVersion,
        },
      },
    },

    /**
     * TypeScript React-specific code
     *
     * Similar to above, but marks a majority of errors to warnings.
     * TODO - combine rulesets and resolve errors
     */
    {
      files: ['ui/**/*.ts', 'ui/**/*.tsx'],
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ['react', 'react-compiler'],
      rules: {
        'react-compiler/react-compiler': 'error',
        'react/no-unused-prop-types': 'error',
        'react/no-unused-state': 'warn',
        'react/jsx-boolean-value': 'off',
        'react/jsx-curly-brace-presence': 'off',
        'react/no-deprecated': 'warn',
        'react/default-props-match-prop-types': 'warn',
        'react/jsx-no-duplicate-props': 'warn',
        'react/display-name': 'off',
        'react/no-unescaped-entities': 'error',
        'react/prop-types': 'off',
        'react/no-children-prop': 'off',
        'react/jsx-key': 'error',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': [
          'warn',
          {
            additionalHooks: 'useAsync(Callback|Result|ResultOrThrow)',
          },
        ],
      },
      settings: {
        react: {
          // If this is set to 'detect', ESLint will import React in order to
          // find its version. Because we run ESLint in the build system under
          // LavaMoat, this means that detecting the React version requires a
          // LavaMoat policy for all of React, in the build system. That's a
          // no-go, so we grab it from React's package.json.
          version: reactVersion,
        },
      },
    },
    /**
     * Tailwind CSS
     */
    {
      files: [
        'ui/pages/design-system/**/*.{ts,tsx}',
        // Add your workspace if you'd like to start using tailwind css,
        // for example:
        // 'ui/pages/your-page/**/*.{ts,tsx}',
      ],
      plugins: ['tailwindcss'],
      rules: {
        // Tailwind CSS rules - same as design system
        'tailwindcss/classnames-order': 'error',
        'tailwindcss/enforces-negative-arbitrary-values': 'error',
        'tailwindcss/enforces-shorthand': 'error',
        'tailwindcss/no-arbitrary-value': 'off', // There are legitimate reasons to use arbitrary values but we should specifically error on static colors
        'tailwindcss/no-custom-classname': 'error',
        'tailwindcss/no-contradicting-classname': 'error',
        'tailwindcss/no-unnecessary-arbitrary-value': 'error',
      },
      settings: {
        tailwindcss: {
          callees: ['twMerge'],
          config: 'tailwind.config.js',
          classRegex: ['^(class(Name)?)$'],
        },
      },
    },
    /**
     * Mocha tests
     *
     * These are files that make use of globals and syntax introduced by the
     * Mocha library.
     */
    {
      files: ['test/e2e/**/*.spec.{js,ts}'],
      extends: ['@metamask/eslint-config-mocha'],
      rules: {
        // In Mocha tests, it is common to use `this` to store values or do
        // things like force the test to fail.
        '@babel/no-invalid-this': 'off',
        'mocha/no-setup-in-describe': 'off',

        // Static hex values are only discouraged in application code, using them in tests is OK.
        '@metamask/design-tokens/color-no-hex': 'off',

        // These rule modifications are removing changes to our shared ESLint config made after
        // version v9. This is a temporary measure to get us to ESLint v9 compatible versions,
        // at which point we can restore the intended rules and use error suppression instead.
        //
        // TODO: Remove these modifications after the ESLint v9 update
        'mocha/consistent-spacing-between-blocks': 'off',
      },
    },
    /**
     * Jest tests
     *
     * These are files that make use of globals and syntax introduced by the
     * Jest library.
     * TODO: This list of files is incomplete, and should be replaced with globs that match the
     * Jest config.
     */
    {
      files: [
        'app/scripts/controllers/app-state-controller.test.ts',
        'app/scripts/controllers/alert-controller.test.ts',
        'app/scripts/metamask-controller.actions.test.js',
        'app/scripts/detect-multiple-instances.test.js',
        'app/scripts/controllers/swaps/**/*.test.js',
        'app/scripts/controllers/swaps/**/*.test.ts',
        'app/scripts/controllers/metametrics.test.js',
        'app/scripts/controllers/permissions/**/*.test.js',
        'app/scripts/controllers/preferences-controller.test.ts',
        'app/scripts/controllers/account-tracker-controller.test.ts',
        'app/scripts/lib/**/*.test.js',
        'app/scripts/metamask-controller.test.js',
        'app/scripts/migrations/*.test.js',
        'app/scripts/platforms/*.test.js',
        'development/**/*.test.js',
        'development/**/*.test.ts',
        'shared/**/*.test.js',
        'shared/**/*.test.ts',
        'test/helpers/*.js',
        'test/jest/*.js',
        'test/lib/timer-helpers.js',
        'test/e2e/helpers.test.js',
        'test/unit-global/*.test.js',
        'ui/**/*.test.js',
        'ui/__mocks__/*.js',
        'shared/lib/error-utils.test.ts',
      ],
      extends: ['@metamask/eslint-config-jest'],
      parserOptions: {
        sourceType: 'module',
      },
      rules: {
        'import-x/unambiguous': 'off',
        'import-x/named': 'off',

        // Static hex values are only discouraged in application code, using them in tests is OK.
        '@metamask/design-tokens/color-no-hex': 'off',
        'jest/no-restricted-matchers': 'off',

        /**
         * jest/prefer-to-be is a new rule that was disabled to reduce churn
         * when upgrading eslint. It should be considered for use and enabled
         * in a future PR if agreeable.
         */
        'jest/prefer-to-be': 'off',

        /**
         * jest/lowercase-name was renamed to jest/prefer-lowercase-title this
         * change was made to essentially retain the same state as the original
         * eslint-config-jest until it is updated. At which point the following
         * two lines can be deleted.
         */
        'jest/lowercase-name': 'off',
        'jest/prefer-lowercase-title': [
          'error',
          {
            ignore: ['describe'],
          },
        ],
      },
    },
    /**
     * Jest files that aren't currently covered by Jest configuration above
     *
     * TODO: Update the `files` list for the Jest configuration.
     */
    {
      files: ['**/*.test.{js,ts,tsx}'],
      rules: {
        // Static hex values are only discouraged in application code, using them in tests is OK.
        '@metamask/design-tokens/color-no-hex': 'off',
      },
    },
    /**
     * Legacy migrations
     */
    {
      files: ['app/scripts/migrations/*.js'],
      rules: {
        // Disable various rules that our legacy migrations don't follow
        'import-x/no-anonymous-default-export': 'off',
      },
    },
    /**
     * Executables and related files
     *
     * These are files that run in a Node context. They are either designed to
     * run as executables (in which case they will have a shebang at the top) or
     * are dependencies of executables (in which case they may use
     * `process.exit` to exit).
     */
    {
      files: ['development/**/*.js', 'test/helpers/setup-helper.js'],
      rules: {
        'n/no-process-exit': 'off',
        'n/hashbang': 'off',
      },
    },
    /**
     * Lockdown files
     */
    {
      files: [
        'app/scripts/lockdown-run.js',
        'app/scripts/lockdown-more.js',
        'test/helpers/protect-intrinsics-helpers.js',
      ],
      globals: {
        harden: 'readonly',
        Compartment: 'readonly',
      },
    },
    /**
     * Storybook
     */
    {
      files: ['**/*.stories.js', '**/*.stories.ts', '**/*.stories.tsx'],
      // Suggested addition from the storybook 6.5 update
      extends: ['plugin:storybook/recommended'],
      rules: {
        // Anonymous object exports are conventional for Storybook files
        'import-x/no-anonymous-default-export': [
          'error',
          {
            allowObject: true,
          },
        ],
        // Static hex values are only discouraged in application code, using them in stories is OK.
        '@metamask/design-tokens/color-no-hex': 'off',
        'storybook/no-redundant-story-name': 'error',
      },
    },
    /**
     * Modules with sorted keys (to be expanded over time)
     *
     * TODO: Either continue migrating code to this rule, or abandon the effort.
     */
    {
      files: ['ui/pages/settings/*.js'],
      rules: {
        'sort-keys': [
          'error',
          'asc',
          {
            natural: true,
          },
        ],
      },
    },
    /**
     * Modules with sorted imports
     *
     * TODO: Remove in favor of `import-x/order`, which our shared config uses.
     */
    {
      files: ['ui/components/multichain/**/*.{js}'],
      rules: {
        'sort-imports': [
          'error',
          {
            ignoreCase: false,
            ignoreDeclarationSort: true,
            ignoreMemberSort: true,
            memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
            allowSeparatedGroups: false,
          },
        ],
      },
    },
    /**
     * Proof files for type-level testing (compile-time assertions, no runtime code)
     */
    {
      files: ['**/*.proof.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            vars: 'all',
            args: 'after-used',
            ignoreRestSiblings: true,
            varsIgnorePattern: '^Describe_',
          },
        ],
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'typeLike',
            format: ['PascalCase'],
            leadingUnderscore: 'allow',
            filter: { regex: '^Describe_', match: false },
          },
          {
            selector: 'typeLike',
            format: null,
            filter: { regex: '^Describe_', match: true },
          },
          {
            selector: 'typeProperty',
            format: ['camelCase', 'PascalCase'],
          },
        ],
      },
    },
    /**
     * TypeScript declaration files.
     *
     * TODO: Move this to `@metamask/eslint-config-typescript`
     */
    {
      files: ['**/*.d.ts'],
      rules: {
        'import-x/unambiguous': 'off',
      },
    },
    /**
     * Prevent new references to deprecated "globally selected network"
     *
     * This can be removed after all usages have been removed.
     *
     * TODO: Expand coverage to include non-confirmation UI as well.
     */
    {
      files: ['ui/pages/confirmations/**/*.{js,ts,tsx}'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: `ImportSpecifier[imported.name=/${[
              'getConversionRate',
              'getCurrentChainId',
              'getNativeCurrency',
              'getNetworkIdentifier',
              'getNftContracts',
              'getNfts',
              'getProviderConfig',
              'getRpcPrefsForCurrentProvider',
              'getUSDConversionRate',
              'isCurrentProviderCustom',
            ]
              .map((method) => `(${method})`)
              .join('|')}/]`,
            message: 'Avoid using global network selectors in confirmations',
          },
        ],
      },
    },
    /**
     * Route module isolation exemptions (defense-in-depth)
     *
     * The router registry (`ui/pages/routes/`) and the top-level
     * `ui/pages/index.js` must reference every route module by design.
     * In the current setup the route-isolation zones don't actually
     * target these files — `routes` is excluded from `ROUTE_ISOLATION_EXEMPT_DIRS`
     * in `development/eslint-restricted-paths-zones.js`, and `index.js`
     * sits above any route's `target`. Still, this override re-defines
     * `import-x/no-restricted-paths` for these paths with **only** the
     * source-boundary zones so that if the
     * exemption list is ever changed, the registry's sibling-route
     * imports continue to be permitted without silently losing the
     * `ui` <-> `app` and runtime <-> build-system boundaries.
     * See ADR 0021 (modularize-routes).
     */
    {
      files: ['ui/pages/routes/**/*.{js,ts,tsx}', 'ui/pages/index.js'],
      rules: {
        'import-x/no-restricted-paths': [
          'error',
          {
            basePath: './',
            zones: [...architecturalZones, ...buildSystemZones],
          },
        ],
      },
    },
    /**
     * E2E page objects
     *
     * Page objects should declare selectors (fields) alphabetically at the
     * top, followed by the constructor, then methods in alphabetical order.
     *
     * The files listed in `excludedFiles` don't yet comply. They are
     * temporarily exempt and should be removed from this list as each one is
     * reordered. Do NOT add new files here — new page objects must comply.
     *
     * TODO: Reorder the excluded files and delete them from this list.
     */
    {
      files: ['test/e2e/page-objects/**/*.ts'],
      excludedFiles: [
        'test/e2e/page-objects/pages/account-list-page.ts',
        'test/e2e/page-objects/pages/asset-picker.ts',
        'test/e2e/page-objects/pages/basic-functionality-off-page.ts',
        'test/e2e/page-objects/pages/bridge/quote-page.ts',
        'test/e2e/page-objects/pages/confirmations/accountDetailsModal.ts',
        'test/e2e/page-objects/pages/confirmations/add-network-confirmations.ts',
        'test/e2e/page-objects/pages/confirmations/add-token-confirmations.ts',
        'test/e2e/page-objects/pages/confirmations/advanced-permissions-introduction.ts',
        'test/e2e/page-objects/pages/confirmations/alert-modal.ts',
        'test/e2e/page-objects/pages/confirmations/batch-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/connect-account-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/decrypt-message-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/deploy-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/gas-fee-modal.ts',
        'test/e2e/page-objects/pages/confirmations/gas-fee-token-modal.ts',
        'test/e2e/page-objects/pages/confirmations/get-encryption-key-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/permit-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/perps-withdraw-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/personal-sign-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/review-permissions-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/set-approval-for-all-transaction-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/sign-typed-data-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/snap-sign-in-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/snap-sign-message-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/snap-sign-transaction-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/snap-transaction-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/speed-up-and-cancel-modal.ts',
        'test/e2e/page-objects/pages/confirmations/switch-network-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/token-transfer-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/transaction-confirmation.ts',
        'test/e2e/page-objects/pages/confirmations/update-network-confirmation.ts',
        'test/e2e/page-objects/pages/critical-error-page.ts',
        'test/e2e/page-objects/pages/debug-page.ts',
        'test/e2e/page-objects/pages/deep-link-page.ts',
        'test/e2e/page-objects/pages/defi-details-page.ts',
        'test/e2e/page-objects/pages/dialog/account-details-modal.ts',
        'test/e2e/page-objects/pages/dialog/add-edit-network.ts',
        'test/e2e/page-objects/pages/dialog/add-network-rpc-url.ts',
        'test/e2e/page-objects/pages/dialog/add-rpc-provider.ts',
        'test/e2e/page-objects/pages/dialog/add-tokens.ts',
        'test/e2e/page-objects/pages/dialog/confirm-alert.ts',
        'test/e2e/page-objects/pages/dialog/create-contract.ts',
        'test/e2e/page-objects/pages/dialog/dapp-bar-network-selector-popover.ts',
        'test/e2e/page-objects/pages/dialog/dapp-connections-network-modal.ts',
        'test/e2e/page-objects/pages/dialog/edit-connected-accounts-modal.ts',
        'test/e2e/page-objects/pages/dialog/network-permission-select-modal.ts',
        'test/e2e/page-objects/pages/dialog/network-switch-modal-confirmation.ts',
        'test/e2e/page-objects/pages/dialog/select-network.ts',
        'test/e2e/page-objects/pages/dialog/snap-install-warning.ts',
        'test/e2e/page-objects/pages/dialog/snap-install.ts',
        'test/e2e/page-objects/pages/dialog/snap-interactive-dialog.ts',
        'test/e2e/page-objects/pages/dialog/snap-txinsight.ts',
        'test/e2e/page-objects/pages/dialog/terms-of-use-update-modal.ts',
        'test/e2e/page-objects/pages/dialog/update-modal.ts',
        'test/e2e/page-objects/pages/error-page.ts',
        'test/e2e/page-objects/pages/hardware-wallet/connect-hardware-wallet-page.ts',
        'test/e2e/page-objects/pages/hardware-wallet/select-hardware-wallet-account-page.ts',
        'test/e2e/page-objects/pages/header-navbar.ts',
        'test/e2e/page-objects/pages/home/activity-tab.ts',
        'test/e2e/page-objects/pages/home/defi-tab.ts',
        'test/e2e/page-objects/pages/home/homepage.ts',
        'test/e2e/page-objects/pages/home/nfts-tab.ts',
        'test/e2e/page-objects/pages/home/perps-tab.ts',
        'test/e2e/page-objects/pages/home/tokens-tab.ts',
        'test/e2e/page-objects/pages/home/transaction-details.ts',
        'test/e2e/page-objects/pages/login-page.ts',
        'test/e2e/page-objects/pages/multichain/account-address-modal.ts',
        'test/e2e/page-objects/pages/multichain/address-list-modal.ts',
        'test/e2e/page-objects/pages/multichain/multichain-account-details-page.ts',
        'test/e2e/page-objects/pages/multichain/private-key-modal.ts',
        'test/e2e/page-objects/pages/network-manager.ts',
        'test/e2e/page-objects/pages/nft-details-page.ts',
        'test/e2e/page-objects/pages/notification-details-page.ts',
        'test/e2e/page-objects/pages/notifications-list-page.ts',
        'test/e2e/page-objects/pages/onboarding/onboarding-complete-page.ts',
        'test/e2e/page-objects/pages/onboarding/onboarding-metrics-page.ts',
        'test/e2e/page-objects/pages/onboarding/onboarding-password-page.ts',
        'test/e2e/page-objects/pages/onboarding/onboarding-privacy-settings-page.ts',
        'test/e2e/page-objects/pages/onboarding/onboarding-srp-page.ts',
        'test/e2e/page-objects/pages/onboarding/secure-wallet-page.ts',
        'test/e2e/page-objects/pages/onboarding/setup-passkey-page.ts',
        'test/e2e/page-objects/pages/onboarding/start-onboarding-page.ts',
        'test/e2e/page-objects/pages/permission/gator-permissions-page.ts',
        'test/e2e/page-objects/pages/permission/permission-list-page.ts',
        'test/e2e/page-objects/pages/permission/site-permission-page.ts',
        'test/e2e/page-objects/pages/perps/perps-activity-page.ts',
        'test/e2e/page-objects/pages/perps/perps-market-detail-page.ts',
        'test/e2e/page-objects/pages/perps/perps-market-list-page.ts',
        'test/e2e/page-objects/pages/perps/perps-order-entry-page.ts',
        'test/e2e/page-objects/pages/perps/perps-withdraw-page.ts',
        'test/e2e/page-objects/pages/phishing-warning-page.ts',
        'test/e2e/page-objects/pages/reset-password-page.ts',
        'test/e2e/page-objects/pages/send/bitcoin-review-tx-page.ts',
        'test/e2e/page-objects/pages/send/send-page.ts',
        'test/e2e/page-objects/pages/send/solana-confirm-tx-page.ts',
        'test/e2e/page-objects/pages/send/solana-send-page.ts',
        'test/e2e/page-objects/pages/send/solana-tx-result-page.ts',
        'test/e2e/page-objects/pages/settings/about-page.ts',
        'test/e2e/page-objects/pages/settings/advanced-settings.ts',
        'test/e2e/page-objects/pages/settings/backup-and-sync-settings.ts',
        'test/e2e/page-objects/pages/settings/contacts-settings.ts',
        'test/e2e/page-objects/pages/settings/experimental-settings.ts',
        'test/e2e/page-objects/pages/settings/notifications-settings-page.ts',
        'test/e2e/page-objects/pages/settings/preferences-and-display-settings.ts',
        'test/e2e/page-objects/pages/settings/preinstalled-example-settings.ts',
        'test/e2e/page-objects/pages/settings/privacy-settings.ts',
        'test/e2e/page-objects/pages/settings/settings-page.ts',
        'test/e2e/page-objects/pages/settings/shield/shield-claim-page.ts',
        'test/e2e/page-objects/pages/settings/shield/shield-claims-list-page.ts',
        'test/e2e/page-objects/pages/settings/shield/shield-detail-page.ts',
        'test/e2e/page-objects/pages/settings/shield/shield-plan-page.ts',
        'test/e2e/page-objects/pages/settings/shield/shield-subscription-approve-page.ts',
        'test/e2e/page-objects/pages/settings/transactions-settings.ts',
        'test/e2e/page-objects/pages/snap-list-page.ts',
        'test/e2e/page-objects/pages/snap-simple-keyring-page.ts',
        'test/e2e/page-objects/pages/swap/swap-page.ts',
        'test/e2e/page-objects/pages/test-dapp-mm-connect.ts',
        'test/e2e/page-objects/pages/test-dapp-multichain.ts',
        'test/e2e/page-objects/pages/test-dapp-send-eth-with-private-key.ts',
        'test/e2e/page-objects/pages/test-dapp-solana.ts',
        'test/e2e/page-objects/pages/test-dapp-tron.ts',
        'test/e2e/page-objects/pages/test-dapp.ts',
        'test/e2e/page-objects/pages/test-snaps.ts',
        'test/e2e/page-objects/pages/token-overview-page.ts',
        'test/e2e/page-objects/pages/vault-decryptor-page.ts',
        'test/e2e/page-objects/pages/wallet-details-page.ts',
      ],
      rules: {
        '@typescript-eslint/member-ordering': [
          'error',
          {
            classes: {
              memberTypes: ['field', 'constructor', 'method'],
              order: 'alphabetically',
            },
          },
        ],
      },
    },
  ],
};
