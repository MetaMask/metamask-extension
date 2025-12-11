const { readFileSync } = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { version: reactVersion } = require('react/package.json');

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
        'import/resolver': {
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
        'import/resolver': {
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
        tsconfigRootDir: path.dirname(tsconfigPath),
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
            ],
          },
        ],
        // `no-parameter-properties` was removed in favor of `parameter-properties`
        // Yeah, they have opposite names but do the same thing?!
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/parameter-properties': 'error',
        // Turn these off, as it's recommended by typescript-eslint.
        // See: <https://typescript-eslint.io/docs/linting/troubleshooting#eslint-plugin-import>
        'import/named': 'off',
        'import/namespace': 'off',
        'import/default': 'off',
        'import/no-named-as-default-member': 'off',
        // Set to ban interfaces due to their incompatibility with Record<string, unknown>.
        // See: <https://github.com/Microsoft/TypeScript/issues/15300#issuecomment-702872440>
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        // Modified to include the 'ignoreRestSiblings' option.
        // TODO: Migrate this rule change back into `@metamask/eslint-config`
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            vars: 'all',
            args: 'all',
            argsIgnorePattern: '[_]+',
            ignoreRestSiblings: true,
          },
        ],
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
      },
      settings: {
        'import/resolver': {
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
        'react/no-unused-prop-types': 'warn',
        'react/no-unused-state': 'warn',
        'react/jsx-boolean-value': 'off',
        'react/jsx-curly-brace-presence': 'off',
        'react/no-deprecated': 'warn',
        'react/default-props-match-prop-types': 'warn',
        'react/jsx-no-duplicate-props': 'warn',
        'react/display-name': 'off',
        'react/no-unescaped-entities': 'warn',
        'react/prop-types': 'off',
        'react/no-children-prop': 'off',
        'react/jsx-key': 'warn', // TODO - increase this into 'error' level
        'react-hooks/rules-of-hooks': 'error',
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
        '**/__snapshots__/*.snap',
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
        'shared/lib/error-utils.test.js',
      ],
      extends: ['@metamask/eslint-config-jest'],
      parserOptions: {
        sourceType: 'module',
      },
      rules: {
        'import/unambiguous': 'off',
        'import/named': 'off',

        // Static hex values are only discouraged in application code, using them in tests is OK.
        '@metamask/design-tokens/color-no-hex': 'off',

        // *.snap files weren't parsed by previous versions of this eslint
        // config section, but something got fixed somewhere, and now this rule
        // causes failures. We need to turn it off instead of fix them because
        // we aren't even remotely close to being in alignment. If it bothers
        // you open a PR to fix it yourself.
        'jest/no-large-snapshots': 'off',
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
        'import/no-anonymous-default-export': 'off',
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
        'node/no-process-exit': 'off',
        'node/shebang': 'off',
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
        'test/unit-global/protect-intrinsics.test.js',
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
        'import/no-anonymous-default-export': [
          'error',
          {
            allowObject: true,
          },
        ],
        // Static hex values are only discouraged in application code, using them in stories is OK.
        '@metamask/design-tokens/color-no-hex': 'off',
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
     * TypeScript declaration files.
     *
     * TODO: Move this to `@metamask/eslint-config-typescript`
     */
    {
      files: ['**/*.d.ts'],
      rules: {
        'import/unambiguous': 'off',
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
  ],
};
