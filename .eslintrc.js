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
  // Suggested addition from the storybook 6.5 update
  extends: ['plugin:storybook/recommended'],
  // Ignore files which are also in .prettierignore
  ignorePatterns: readFileSync('.prettierignore', 'utf8').trim().split('\n'),
  // eslint's parser, esprima, is not compatible with ESM, so use the babel parser instead
  parser: '@babel/eslint-parser',
  overrides: [
    /**
     * == Modules ==
     *
     * The first two sections here, which cover module syntax, are mutually
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
        'development/**/*.js',
        'test/e2e/**/*.js',
        'test/helpers/*.js',
        'test/lib/wait-until-called.js',
        'test/run-unit-tests.js',
        'test/merge-coverage.js',
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
        'shared/**/*.ts',
        'ui/**/*.js',
        'offscreen/**/*.ts',
        '**/*.test.js',
        'test/lib/**/*.js',
        'test/mocks/**/*.js',
        'test/jest/**/*.js',
        'test/stub/**/*.js',
        'test/unit-global/**/*.js',
      ],
      // TODO: Convert these files to modern JS
      excludedFiles: ['test/lib/wait-until-called.js'],
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
    {
      files: ['*.d.ts'],
      parserOptions: {
        sourceType: 'script',
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
      plugins: ['react'],
      rules: {
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
     * Mocha tests
     *
     * These are files that make use of globals and syntax introduced by the
     * Mocha library.
     */
    {
      files: [
        '**/*.test.js',
        'test/lib/wait-until-called.js',
        'test/e2e/**/*.spec.js',
      ],
      excludedFiles: [
        'app/scripts/controllers/app-state.test.js',
        'app/scripts/controllers/mmi-controller.test.js',
        'app/scripts/controllers/permissions/**/*.test.js',
        'app/scripts/controllers/preferences.test.js',
        'app/scripts/lib/**/*.test.js',
        'app/scripts/metamask-controller.test.js',
        'app/scripts/migrations/*.test.js',
        'app/scripts/platforms/*.test.js',
        'development/**/*.test.js',
        'shared/**/*.test.js',
        'ui/**/*.test.js',
        'ui/__mocks__/*.js',
        'test/e2e/helpers.test.js',
      ],
      extends: ['@metamask/eslint-config-mocha'],
      rules: {
        // In Mocha tests, it is common to use `this` to store values or do
        // things like force the test to fail.
        '@babel/no-invalid-this': 'off',
        'mocha/no-setup-in-describe': 'off',
      },
    },
    /**
     * Jest tests
     *
     * These are files that make use of globals and syntax introduced by the
     * Jest library. The files in this section should match the Mocha excludedFiles section.
     */
    {
      files: [
        '**/__snapshots__/*.snap',
        'app/scripts/controllers/app-state.test.js',
        'app/scripts/controllers/mmi-controller.test.ts',
        'app/scripts/controllers/permissions/**/*.test.js',
        'app/scripts/controllers/preferences.test.js',
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
     * Migrations
     */
    {
      files: ['app/scripts/migrations/*.js', '**/*.stories.js'],
      rules: {
        'import/no-anonymous-default-export': [
          'error',
          {
            allowObject: true,
          },
        ],
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
      files: [
        'development/**/*.js',
        'test/e2e/benchmark.js',
        'test/helpers/setup-helper.js',
        'test/run-unit-tests.js',
        'test/merge-coverage.js',
      ],
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
    {
      files: ['app/scripts/lockdown-run.js', 'app/scripts/lockdown-more.js'],
      parserOptions: {
        sourceType: 'script',
      },
    },
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
    {
      files: ['ui/components/multichain/**/*.{js}'],
      extends: [
        path.resolve(__dirname, '.eslintrc.base.js'),
        path.resolve(__dirname, '.eslintrc.node.js'),
        path.resolve(__dirname, '.eslintrc.babel.js'),
      ],
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
  ],
};
