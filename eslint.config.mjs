import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ts = require('typescript');
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const { version: reactVersion } = require('react/package.json');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const tsconfigPath = ts.findConfigFile('./', ts.sys.fileExists);
const { config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
const tsconfig = ts.parseJsonConfigFileContent(config, ts.sys, './');

const ignorePatterns = readFileSync('.prettierignore', 'utf8')
  .trim()
  .split('\n')
  .filter((line) => line && !line.startsWith('#'))
  .map((pattern) => {
    if (pattern.startsWith('/')) {
      return pattern.slice(1);
    }
    return pattern;
  });

const tsFiles = tsconfig.fileNames.filter((f) => /\.tsx?$/u.test(f));

const baseRules = require('./.eslintrc.base.js').rules;
const nodeRules = require('./.eslintrc.node.js').rules;

const reactSettings = {
  react: {
    version: reactVersion,
  },
};

const typescriptCompatSettings = {
  'import/extensions': ['.js', '.ts', '.tsx'],
  'import/parsers': {
    '@typescript-eslint/parser': ['.ts', '.tsx'],
  },
};

const importResolverNodeAndTs = {
  'import/resolver': {
    node: {},
    typescript: { alwaysTryTypes: true },
  },
};

const importResolverTsOnly = {
  'import/resolver': {
    typescript: { alwaysTryTypes: true },
  },
};

// ============================================================================
// File pattern constants
// ============================================================================

const commonjsFiles = [
  '.eslintrc.js',
  '.eslintrc.*.js',
  '.mocharc.js',
  '*.config.js',
  '*.config.mjs',
  'app/scripts/lockdown-run.js',
  'app/scripts/lockdown-more.js',
  'development/**/*.js',
  'test/e2e/**/*.js',
  'test/helpers/*.js',
  'test/run-unit-tests.js',
];

const esmFiles = [
  'app/**/*.js',
  'shared/**/*.js',
  'ui/**/*.js',
  '**/*.test.js',
  'test/lib/**/*.js',
  'test/mocks/**/*.js',
  'test/jest/**/*.js',
  'test/stub/**/*.js',
  'test/unit-global/**/*.js',
];

const esmExcludedFiles = [
  'app/scripts/lockdown-run.js',
  'app/scripts/lockdown-more.js',
];

const reactJsFiles = [
  'test/lib/render-helpers.js',
  'test/jest/rendering.js',
  'ui/**/*.js',
];

const reactTsFiles = ['ui/**/*.ts', 'ui/**/*.tsx'];

const tailwindFiles = ['ui/pages/design-system/**/*.{ts,tsx}'];

const mochaFiles = ['test/e2e/**/*.spec.{js,ts}'];

const jestFiles = [
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
  'test/mocks/**/*.js',
  'shared/lib/error-utils.test.js',
];

// ============================================================================
// Flat config array
// ============================================================================
export default [
  // Global ignores
  { ignores: [...ignorePatterns, 'eslint.config.mjs', '.storybook/**/*.js'] },

  // ---------------------------------------------------------------------------
  // Global plugin registration and browser globals
  //
  // Registers plugins used across multiple overrides so that rule references
  // (including "off" overrides) resolve correctly in every config object.
  // ---------------------------------------------------------------------------
  {
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
        AggregateError: 'readonly',
      },
    },
    settings: {
      jsdoc: {
        mode: 'typescript',
      },
    },
    plugins: {
      '@metamask/design-tokens': require('@metamask/eslint-plugin-design-tokens'),
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      import: require('eslint-plugin-import'),
      jest: require('eslint-plugin-jest'),
      n: require('eslint-plugin-n'),
      '@babel': require('@babel/eslint-plugin'),
    },
  },

  // ---------------------------------------------------------------------------
  // Fallback TypeScript parser for .ts/.tsx files not in tsconfig
  // (e.g. .stories.tsx). Applied before the tsconfig-aware override so that
  // files in the tsconfig get the full type-aware parser configuration.
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // CommonJS modules
  // ---------------------------------------------------------------------------
  ...compat
    .extends('@metamask/eslint-config', '@metamask/eslint-config-nodejs')
    .map((entry) => ({ ...entry, files: commonjsFiles })),
  {
    files: commonjsFiles,
    languageOptions: {
      parser: require('@babel/eslint-parser'),
      parserOptions: { sourceType: 'script' },
    },
    plugins: {
      '@babel': require('@babel/eslint-plugin'),
    },
    settings: { ...typescriptCompatSettings, ...importResolverNodeAndTs },
    rules: {
      ...baseRules,
      ...nodeRules,
      '@babel/no-invalid-this': 'error',
      '@babel/semi': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // ES modules
  // ---------------------------------------------------------------------------
  ...compat
    .extends('@metamask/eslint-config', '@metamask/eslint-config-nodejs')
    .map((entry) => ({ ...entry, files: esmFiles, ignores: esmExcludedFiles })),
  {
    files: esmFiles,
    ignores: esmExcludedFiles,
    languageOptions: {
      parser: require('@babel/eslint-parser'),
      parserOptions: { sourceType: 'module' },
    },
    plugins: {
      '@babel': require('@babel/eslint-plugin'),
    },
    settings: { ...typescriptCompatSettings, ...importResolverNodeAndTs },
    rules: {
      ...baseRules,
      ...nodeRules,
      '@babel/no-invalid-this': 'error',
      '@babel/semi': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // TypeScript files
  // ---------------------------------------------------------------------------
  ...compat
    .extends('@metamask/eslint-config', '@metamask/eslint-config-typescript')
    .map((entry) => ({ ...entry, files: tsFiles })),
  {
    files: tsFiles,
    languageOptions: {
      parserOptions: {
        project: tsconfigPath,
        tsconfigRootDir: path.dirname(tsconfigPath),
      },
    },
    settings: { ...typescriptCompatSettings, ...importResolverTsOnly },
    rules: {
      ...baseRules,
      '@typescript-eslint/no-explicit-any': 'error',
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
      '@typescript-eslint/no-parameter-properties': 'off',
      '@typescript-eslint/parameter-properties': 'error',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
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
        { allowBoolean: true, allowNumber: true },
      ],
      'consistent-return': 'off',

      // Temporarily disabled for ESLint v9 migration
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
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
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // React (JS)
  // ---------------------------------------------------------------------------
  ...compat
    .extends('plugin:react/recommended', 'plugin:react-hooks/recommended')
    .map((entry) => ({ ...entry, files: reactJsFiles })),
  {
    files: reactJsFiles,
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'react-compiler': require('eslint-plugin-react-compiler'),
    },
    settings: reactSettings,
    rules: {
      'react-compiler/react-compiler': 'error',
      'react/no-unused-prop-types': 'error',
      'react/no-unused-state': 'error',
      'react/jsx-boolean-value': 'error',
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'never' },
      ],
      'react/no-deprecated': 'error',
      'react/default-props-match-prop-types': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react-hooks/exhaustive-deps': [
        'warn',
        { additionalHooks: 'useAsync(Callback|Result|ResultOrThrow)' },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // React (TS/TSX)
  // ---------------------------------------------------------------------------
  ...compat
    .extends('plugin:react/recommended', 'plugin:react-hooks/recommended')
    .map((entry) => ({ ...entry, files: reactTsFiles })),
  {
    files: reactTsFiles,
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'react-compiler': require('eslint-plugin-react-compiler'),
    },
    settings: reactSettings,
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
      'react/jsx-key': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': [
        'warn',
        { additionalHooks: 'useAsync(Callback|Result|ResultOrThrow)' },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Tailwind CSS
  // ---------------------------------------------------------------------------
  {
    files: tailwindFiles,
    plugins: {
      tailwindcss: require('eslint-plugin-tailwindcss'),
    },
    settings: {
      tailwindcss: {
        callees: ['twMerge'],
        config: 'tailwind.config.js',
        classRegex: ['^(class(Name)?)$'],
      },
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
  },

  // ---------------------------------------------------------------------------
  // Mocha tests (E2E)
  // ---------------------------------------------------------------------------
  ...compat
    .extends('@metamask/eslint-config-mocha')
    .map((entry) => {
      if (entry.languageOptions?.ecmaVersion) {
        entry.languageOptions.ecmaVersion = Number(
          entry.languageOptions.ecmaVersion,
        );
      }
      return { ...entry, files: mochaFiles };
    }),
  {
    files: mochaFiles,
    rules: {
      '@babel/no-invalid-this': 'off',
      'mocha/no-setup-in-describe': 'off',
      '@metamask/design-tokens/color-no-hex': 'off',
      'mocha/consistent-spacing-between-blocks': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // Jest tests
  // ---------------------------------------------------------------------------
  ...compat
    .extends('@metamask/eslint-config-jest')
    .map((entry) => ({ ...entry, files: jestFiles })),
  {
    files: jestFiles,
    languageOptions: {
      parserOptions: { sourceType: 'module' },
    },
    rules: {
      'import/unambiguous': 'off',
      'import/named': 'off',
      '@metamask/design-tokens/color-no-hex': 'off',
      'jest/no-large-snapshots': 'off',
      'jest/no-restricted-matchers': 'off',
      'jest/prefer-to-be': 'off',
      'jest/lowercase-name': 'off',
      'jest/prefer-lowercase-title': ['error', { ignore: ['describe'] }],
    },
  },

  // ---------------------------------------------------------------------------
  // All test files (design-tokens override)
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.test.{js,ts,tsx}'],
    rules: {
      '@metamask/design-tokens/color-no-hex': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // Legacy migrations
  // ---------------------------------------------------------------------------
  {
    files: ['app/scripts/migrations/*.js'],
    rules: {
      'import/no-anonymous-default-export': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // Executables
  // ---------------------------------------------------------------------------
  {
    files: ['development/**/*.js', 'test/helpers/setup-helper.js'],
    rules: {
      'n/no-process-exit': 'off',
      'n/hashbang': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // Lockdown files
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Storybook
  // ---------------------------------------------------------------------------
  ...compat
    .extends('plugin:storybook/recommended')
    .map((entry) => ({
      ...entry,
      files: ['**/*.stories.js', '**/*.stories.ts', '**/*.stories.tsx'],
    })),
  {
    files: ['**/*.stories.js', '**/*.stories.ts', '**/*.stories.tsx'],
    rules: {
      'import/no-anonymous-default-export': ['error', { allowObject: true }],
      '@metamask/design-tokens/color-no-hex': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // Settings: sorted keys
  // ---------------------------------------------------------------------------
  {
    files: ['ui/pages/settings/*.js'],
    rules: {
      'sort-keys': ['error', 'asc', { natural: true }],
    },
  },

  // ---------------------------------------------------------------------------
  // Multichain: sorted imports
  // ---------------------------------------------------------------------------
  {
    files: ['ui/components/multichain/**/*.js'],
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

  // ---------------------------------------------------------------------------
  // Webpack config files (development/webpack/)
  // ---------------------------------------------------------------------------
  {
    files: ['development/webpack/**/*.{js,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-shadow': [
        'error',
        { allow: ['describe', 'it', 'test', 'afterEach', 'beforeEach'] },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'import/extensions': 'off',
      'no-multi-assign': ['error', { ignoreNonDeclaration: true }],
      'no-bitwise': 'off',
      'no-void': 'off',
      curly: ['error', 'multi-line'],
      'import/no-dynamic-require': 'off',
      'jsdoc/no-multi-asterisks': ['error', { allowWhitespace: true }],
      'no-plusplus': 'off',
      'no-loop-func': 'off',
      '@typescript-eslint/naming-convention': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // TypeScript declaration files
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.d.ts'],
    rules: {
      'import/unambiguous': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // Confirmations: no global network selectors
  // ---------------------------------------------------------------------------
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
];
