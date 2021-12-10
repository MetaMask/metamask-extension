const { version: reactVersion } = require('react/package.json');

module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2017,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      impliedStrict: true,
      modules: true,
      blockBindings: true,
      arrowFunctions: true,
      objectLiteralShorthandMethods: true,
      objectLiteralShorthandProperties: true,
      templateStrings: true,
      classes: true,
      jsx: true,
    },
  },

  ignorePatterns: [
    '!.eslintrc.js',
    '!.mocharc.js',
    'node_modules/**',
    'dist/**',
    'builds/**',
    'test-*/**',
    'docs/**',
    'coverage/',
    'jest-coverage/',
    'development/chromereload.js',
    'app/vendor/**',
    'test/e2e/send-eth-with-private-key-test/**',
    'nyc_output/**',
    '.vscode/**',
    'lavamoat/*/policy.json',
    'storybook-build/**',
  ],

  extends: [
    '@metamask/eslint-config',
    '@metamask/eslint-config-nodejs',
    'prettier',
  ],

  plugins: ['@babel', 'import', 'prettier'],

  globals: {
    document: 'readonly',
    window: 'readonly',
  },

  rules: {
    'default-param-last': 'off',
    'prefer-object-spread': 'error',
    'require-atomic-updates': 'off',

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

    'import/no-unassigned-import': 'off',

    'no-invalid-this': 'off',
    '@babel/no-invalid-this': 'error',

    // Prettier handles this
    '@babel/semi': 'off',

    'node/no-process-env': 'off',

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

    // TODO: re-enable these rules
    'node/no-sync': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unpublished-require': 'off',
  },
  overrides: [
    {
      files: ['ui/**/*.js', 'test/lib/render-helpers.js', 'test/jest/*.js'],
      plugins: ['react'],
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
      rules: {
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
      },
    },
    {
      files: ['test/e2e/**/*.spec.js'],
      extends: ['@metamask/eslint-config-mocha'],
      rules: {
        'mocha/no-hooks-for-single-case': 'off',
        'mocha/no-setup-in-describe': 'off',
      },
    },
    {
      files: ['app/scripts/migrations/*.js', '*.stories.js'],
      rules: {
        'import/no-anonymous-default-export': ['error', { allowObject: true }],
      },
    },
    {
      files: ['app/scripts/migrations/*.js'],
      rules: {
        'node/global-require': 'off',
      },
    },
    {
      files: ['**/*.test.js'],
      excludedFiles: [
        'ui/**/*.test.js',
        'ui/__mocks__/*.js',
        'shared/**/*.test.js',
        'development/**/*.test.js',
        'app/scripts/lib/**/*.test.js',
        'app/scripts/migrations/*.test.js',
        'app/scripts/platforms/*.test.js',
        'app/scripts/controllers/network/**/*.test.js',
        'app/scripts/controllers/permissions/*.test.js',
      ],
      extends: ['@metamask/eslint-config-mocha'],
      rules: {
        'mocha/no-setup-in-describe': 'off',
      },
    },
    {
      files: ['**/__snapshots__/*.snap'],
      plugins: ['jest'],
      rules: {
        'jest/no-large-snapshots': [
          'error',
          { maxSize: 50, inlineMaxSize: 50 },
        ],
      },
    },
    {
      files: [
        'ui/**/*.test.js',
        'ui/__mocks__/*.js',
        'shared/**/*.test.js',
        'development/**/*.test.js',
        'app/scripts/lib/**/*.test.js',
        'app/scripts/migrations/*.test.js',
        'app/scripts/platforms/*.test.js',
        'app/scripts/controllers/network/**/*.test.js',
        'app/scripts/controllers/permissions/*.test.js',
      ],
      extends: ['@metamask/eslint-config-jest'],
      rules: {
        'jest/no-restricted-matchers': 'off',
        'import/unambiguous': 'off',
        'import/named': 'off',
      },
    },
    {
      files: [
        'development/**/*.js',
        'test/e2e/benchmark.js',
        'test/helpers/setup-helper.js',
      ],
      rules: {
        'node/no-process-exit': 'off',
        'node/shebang': 'off',
      },
    },
    {
      files: [
        '.eslintrc.js',
        '.mocharc.js',
        'babel.config.js',
        'jest.config.js',
        'nyc.config.js',
        'stylelint.config.js',
        'app/scripts/lockdown-run.js',
        'app/scripts/lockdown-more.js',
        'development/**/*.js',
        'test/e2e/**/*.js',
        'test/env.js',
        'test/setup.js',
        'test/helpers/protect-intrinsics-helpers.js',
        'test/lib/wait-until-called.js',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
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
  ],

  settings: {
    react: {
      // If this is set to 'detect', ESLint will import React in order to find
      // its version. Because we run ESLint in the build system under LavaMoat,
      // this means that detecting the React version requires a LavaMoat policy
      // for all of React, in the build system. That's a no-go, so we grab it
      // from React's package.json.
      version: reactVersion,
    },
  },
};
