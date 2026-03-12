// @ts-check
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import base, { createConfig } from '@metamask/eslint-config';
import jest from '@metamask/eslint-config-jest';
import mocha from '@metamask/eslint-config-mocha';
import nodejs from '@metamask/eslint-config-nodejs';
import typescript from '@metamask/eslint-config-typescript';
import * as designTokensPlugin from '@metamask/eslint-plugin-design-tokens';
import * as typescriptResolver from 'eslint-import-resolver-typescript';
import reactPlugin from 'eslint-plugin-react';
import reactCompilerPlugin from 'eslint-plugin-react-compiler';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import storybookPlugin from 'eslint-plugin-storybook';
import tailwindcssPlugin from 'eslint-plugin-tailwindcss';
import typescriptEslint from 'typescript-eslint';

const require = createRequire(import.meta.url);
const { version: reactVersion } = require('react/package.json');

// Read prettierignore for global ignores
const ignorePatterns = readFileSync('.prettierignore', 'utf8')
  .trim()
  .split('\n');

/**
 * Import resolver settings for JavaScript files. These need the TypeScript
 * resolver to be able to resolve .ts imports from .js files (and vice-versa).
 */
const jsImportResolverSettings = {
  'import-x/resolver': {
    name: 'typescript',
    resolver: typescriptResolver,
    options: {
      alwaysTryTypes: true,
    },
  },
};

/**
 * Shared custom rules that apply globally (from the old .eslintrc.base.js).
 * These override the defaults from @metamask/eslint-config.
 */
const baseCustomRules = {
  'default-param-last': 'off',
  'prefer-object-spread': 'error',
  'require-atomic-updates': 'off',

  // Override the @metamask/eslint-config defaults to only restrict 'event'
  'no-restricted-globals': ['error', 'event'],
  // These rules are too noisy for the existing codebase; re-enable later
  // with error suppression comments.
  'id-denylist': 'off',
  'id-length': 'off',

  // This is the same as our default config, but for the noted exceptions
  'spaced-comment': [
    'error',
    'always',
    {
      markers: [
        'global',
        'globals',
        'eslint',
        'eslint-disable',
        '*package',
        '!',
        ',',
        // Local additions
        '/:', // This is for our code fences
      ],
      exceptions: ['=', '-'],
    },
  ],

  'no-invalid-this': 'off',

  // TODO: remove this override
  'padding-line-between-statements': [
    'error',
    {
      blankLine: 'always',
      prev: 'directive',
      next: '*',
    },
    {
      blankLine: 'any',
      prev: 'directive',
      next: 'directive',
    },
    // Disabled temporarily to reduce conflicts while PR queue is large
    // {
    //   blankLine: 'always',
    //   prev: ['multiline-block-like', 'multiline-expression'],
    //   next: ['multiline-block-like', 'multiline-expression'],
    // },
  ],

  // It is common to import modules without assigning them to variables in
  // a browser context. For instance, we may import polyfills which change
  // global variables, or we may import stylesheets.
  'import-x/no-unassigned-import': 'off',

  // import-x/no-named-as-default-member checks if default imports also have
  // named exports matching properties used on the default import. Turning this
  // rule off to prevent churn when upgrading eslint and dependencies.
  'import-x/no-named-as-default-member': 'off',

  // This is necessary to run eslint on Windows and not get a thousand CRLF errors
  'prettier/prettier': ['error', { endOfLine: 'auto' }],

  '@metamask/design-tokens/color-no-hex': 'error',
  'import-x/no-restricted-paths': [
    'error',
    {
      basePath: './',
      zones: [
        {
          target: './app',
          from: './ui',
          message:
            'Should not import from UI in background, use shared directory instead',
        },
        {
          target: './ui',
          from: './app',
          message:
            'Should not import from background in UI, use shared directory instead',
        },
        {
          target: './shared',
          from: './app',
          message: 'Should not import from background in shared',
        },
        {
          target: './shared',
          from: './ui',
          message: 'Should not import from UI in shared',
        },
      ],
    },
  ],

  /* JSDoc plugin rules */

  // TODO: re-enable once the proposed feature is available
  'jsdoc/check-line-alignment': 'off',

  // Allow tag `jest-environment` to work around Jest bug
  // See: https://github.com/facebook/jest/issues/7780
  'jsdoc/check-tag-names': ['error', { definedTags: ['jest-environment'] }],

  // TODO: Re-enable these
  'jsdoc/match-description': 'off',
  'jsdoc/require-description': 'off',
  'jsdoc/require-jsdoc': 'off',
  'jsdoc/require-param-description': 'off',
  'jsdoc/require-param-type': 'off',
  'jsdoc/require-returns-description': 'off',
  'jsdoc/require-returns-type': 'off',
  'jsdoc/require-returns': 'off',
  'jsdoc/valid-types': 'off',

  'no-restricted-syntax': [
    'error',
    {
      selector: 'WithStatement',
      message: 'With statements are not allowed',
    },
    // {
    //   selector: "BinaryExpression[operator='in']",
    //   message: 'The "in" operator is not allowed',
    // },
    {
      selector: 'SequenceExpression',
      message: 'Sequence expressions are not allowed',
    },
  ],

  'import-x/order': [
    'error',
    {
      groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
      'newlines-between': 'ignore',
      alphabetize: {
        order: 'ignore',
        orderImportKind: 'ignore',
        caseInsensitive: false,
      },
    },
  ],
  'import-x/no-nodejs-modules': 'off',
};

/**
 * Node-specific custom rules (from the old .eslintrc.node.js).
 */
const nodeCustomRules = {
  'n/no-process-env': 'off',
  // eslint-plugin-n@17 started treating these browser globals as Node builtins
  'n/no-unsupported-features/node-builtins': [
    'error',
    {
      ignores: ['navigator', 'Navigator', 'localStorage'],
    },
  ],
  'n/hashbang': 'off',
  // TODO: re-enable these rules
  'n/no-sync': 'off',
  'n/no-unpublished-import': 'off',
  'n/no-unpublished-require': 'off',
};

/**
 * React plugin configs for JavaScript files.
 */
const reactJsRules = {
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
};

/**
 * React plugin configs for TypeScript files.
 */
const reactTsRules = {
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
  'react-hooks/exhaustive-deps': [
    'warn',
    {
      additionalHooks: 'useAsync(Callback|Result|ResultOrThrow)',
    },
  ],
};

/**
 * React-related settings.
 */
const reactSettings = {
  react: {
    // If this is set to 'detect', ESLint will import React in order to
    // find its version. Because we run ESLint in the build system under
    // LavaMoat, this means that detecting the React version requires a
    // LavaMoat policy for all of React, in the build system. That's a
    // no-go, so we grab it from React's package.json.
    version: reactVersion,
  },
};

export default createConfig([
  /**
   * Global ignores (replaces ignorePatterns in the old .eslintrc.js).
   */
  {
    ignores: ignorePatterns,
  },

  /**
   * Register the design-tokens plugin globally so all config blocks can use
   * its rules without re-declaring the plugin.
   */
  {
    plugins: {
      '@metamask/design-tokens': designTokensPlugin,
    },
  },

  /**
   * == CommonJS Module Files ==
   *
   * Code that uses `require()` and `module.exports`.
   */
  {
    files: [
      '.mocharc.js',
      '*.config.js',
      'app/scripts/lockdown-run.js',
      'app/scripts/lockdown-more.js',
      'development/**/*.js',
      'test/e2e/**/*.js',
      'test/helpers/*.js',
      'test/run-unit-tests.js',
    ],
    extends: [base, nodejs],
    settings: {
      jsdoc: { mode: 'typescript' },
      ...jsImportResolverSettings,
    },
    rules: {
      ...baseCustomRules,
      ...nodeCustomRules,
    },
  },

  /**
   * == ES Module Files ==
   *
   * Code that explicitly uses `import`/`export`.
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
    ignores: ['app/scripts/lockdown-run.js', 'app/scripts/lockdown-more.js'],
    extends: [base, nodejs],
    languageOptions: {
      sourceType: 'module',
    },
    settings: {
      jsdoc: { mode: 'typescript' },
      ...jsImportResolverSettings,
    },
    rules: {
      ...baseCustomRules,
      ...nodeCustomRules,
    },
  },

  /**
   * == TypeScript Files ==
   */
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [base, typescript],
    ignores: ['**/*.stories.ts', '**/*.stories.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      jsdoc: { mode: 'typescript' },
    },
    rules: {
      ...baseCustomRules,
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
      '@typescript-eslint/no-parameter-properties': 'off',
      '@typescript-eslint/parameter-properties': 'error',
      // Turn these off, as it's recommended by typescript-eslint.
      'import-x/named': 'off',
      'import-x/namespace': 'off',
      'import-x/default': 'off',
      'import-x/no-named-as-default-member': 'off',
      // Set to ban interfaces due to their incompatibility with Record<string, unknown>.
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      // Modified to include the 'ignoreRestSiblings' option.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'all',
          argsIgnorePattern: '[_]+',
          ignoreRestSiblings: true,
        },
      ],
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
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowBoolean: true,
          allowNumber: true,
        },
      ],
      'consistent-return': 'off',

      // These rules are from the updated @metamask/eslint-config packages.
      // They are disabled here to avoid introducing thousands of new lint
      // errors in a single PR. Re-enable with inline suppression comments
      // in follow-up work.
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-duplicate-type-constituents': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-throw-literal': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unnecessary-type-arguments': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
      '@typescript-eslint/prefer-enum-initializers': 'off',
      '@typescript-eslint/prefer-includes': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-readonly': 'off',
      '@typescript-eslint/prefer-reduce-type-parameter': 'off',
      '@typescript-eslint/prefer-string-starts-ends-with': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'import-x/consistent-type-specifier-style': 'off',
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
  },

  /**
   * == React (JavaScript) ==
   */
  {
    files: [
      'test/lib/render-helpers.js',
      'test/jest/rendering.js',
      'ui/**/*.js',
    ],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-compiler': reactCompilerPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...reactJsRules,
    },
    settings: reactSettings,
  },

  /**
   * == React (TypeScript) ==
   */
  {
    files: ['ui/**/*.ts', 'ui/**/*.tsx'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-compiler': reactCompilerPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...reactTsRules,
    },
    settings: reactSettings,
  },

  /**
   * == Tailwind CSS ==
   */
  {
    files: [
      'ui/pages/design-system/**/*.{ts,tsx}',
      // Add your workspace if you'd like to start using tailwind css
    ],
    plugins: {
      tailwindcss: tailwindcssPlugin,
    },
    rules: {
      'tailwindcss/classnames-order': 'error',
      'tailwindcss/enforces-negative-arbitrary-values': 'error',
      'tailwindcss/enforces-shorthand': 'error',
      'tailwindcss/no-arbitrary-value': 'off',
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
   * == Mocha Tests ==
   */
  {
    files: ['test/e2e/**/*.spec.{js,ts}'],
    extends: [mocha],
    rules: {
      // In Mocha tests, it is common to use `this` to store values
      'no-invalid-this': 'off',
      'mocha/no-setup-in-describe': 'off',

      // Static hex values are only discouraged in application code
      '@metamask/design-tokens/color-no-hex': 'off',
    },
  },

  /**
   * == Jest Tests ==
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
    extends: [jest],
    languageOptions: {
      sourceType: 'module',
    },
    rules: {
      'import-x/unambiguous': 'off',
      'import-x/named': 'off',

      // Static hex values are only discouraged in application code
      '@metamask/design-tokens/color-no-hex': 'off',

      'jest/no-large-snapshots': 'off',
      'jest/no-restricted-matchers': 'off',

      // jest/unbound-method requires type information which is not available
      // for JavaScript test files. The @metamask/eslint-config-jest config
      // enables this only for .test.ts files, but createConfig's `extends`
      // applies the parent file list, widening it to .test.js files too.
      'jest/unbound-method': 'off',

      /**
       * jest/prefer-to-be is a new rule that was disabled to reduce churn
       */
      'jest/prefer-to-be': 'off',

      /**
       * jest/lowercase-name was renamed to jest/prefer-lowercase-title
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
   * Jest files not currently covered by Jest configuration above.
   */
  {
    files: ['**/*.test.{js,ts,tsx}'],
    rules: {
      // Static hex values are only discouraged in application code
      '@metamask/design-tokens/color-no-hex': 'off',
    },
  },

  /**
   * Legacy migrations
   */
  {
    files: ['app/scripts/migrations/*.js'],
    rules: {
      'import-x/no-anonymous-default-export': 'off',
    },
  },

  /**
   * Executables and related files
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
      'test/unit-global/protect-intrinsics.test.js',
    ],
    languageOptions: {
      globals: {
        harden: 'readonly',
        Compartment: 'readonly',
      },
    },
  },

  /**
   * Storybook (JS files)
   */
  {
    files: ['**/*.stories.js'],
    extends: [storybookPlugin.configs['flat/recommended']],
    rules: {
      // Anonymous object exports are conventional for Storybook files
      'import-x/no-anonymous-default-export': [
        'error',
        {
          allowObject: true,
        },
      ],
      // Static hex values are only discouraged in application code
      '@metamask/design-tokens/color-no-hex': 'off',
    },
  },

  /**
   * Storybook (TypeScript files)
   *
   * These are excluded from tsconfig.json, so they need a lighter TypeScript
   * config without project service / type-aware rules.
   */
  {
    files: ['**/*.stories.ts', '**/*.stories.tsx'],
    extends: [base, storybookPlugin.configs['flat/recommended']],
    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        ecmaFeatures: { jsx: true },
      },
      sourceType: 'module',
    },
    settings: {
      ...jsImportResolverSettings,
    },
    rules: {
      ...baseCustomRules,
      // Anonymous object exports are conventional for Storybook files
      'import-x/no-anonymous-default-export': [
        'error',
        {
          allowObject: true,
        },
      ],
      // Static hex values are only discouraged in application code
      '@metamask/design-tokens/color-no-hex': 'off',
    },
  },

  /**
   * Modules with sorted keys
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
   * Proof files for type-level testing
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
   */
  {
    files: ['**/*.d.ts'],
    rules: {
      'import-x/unambiguous': 'off',
    },
  },

  /**
   * Prevent new references to deprecated "globally selected network"
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
   * == Webpack development config ==
   * (replaces development/webpack/.eslintrc.js)
   */
  {
    files: ['development/webpack/**/*.{js,ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptEslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-shadow': [
        'error',
        {
          allow: ['describe', 'it', 'test', 'afterEach', 'beforeEach'],
        },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'import-x/extensions': 'off',
      'no-multi-assign': ['error', { ignoreNonDeclaration: true }],
      'no-bitwise': 'off',
      'no-void': 'off',
      curly: ['error', 'multi-line'],
      'import-x/no-dynamic-require': 'off',
      'jsdoc/no-multi-asterisks': ['error', { allowWhitespace: true }],
      'no-plusplus': 'off',
      'no-loop-func': 'off',
      '@typescript-eslint/naming-convention': 'off',
    },
  },
]);
