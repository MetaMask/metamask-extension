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
    'node_modules/**',
    'dist/**',
    'builds/**',
    'test-*/**',
    'docs/**',
    'coverage/',
    'development/chromereload.js',
    'app/vendor/**',
    'test/e2e/send-eth-with-private-key-test/**',
    'nyc_output/**',
    '.vscode/**',
    'lavamoat/*/policy.json',
  ],

  extends: [
    '@metamask/eslint-config',
    '@metamask/eslint-config/config/nodejs',
    '@metamask/eslint-config/config/mocha',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],

  plugins: ['@babel', 'react', 'import', 'prettier'],

  globals: {
    document: 'readonly',
    window: 'readonly',
  },

  rules: {
    // Prettier changes and reasoning

    'prettier/prettier': 'error',
    'import/no-unassigned-import': 'off',
    'prefer-object-spread': 'error',
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
    'default-param-last': 'off',
    'require-atomic-updates': 'off',

    'no-invalid-this': 'off',
    '@babel/no-invalid-this': 'error',

    // prettier handles these
    semi: 'off',
    '@babel/semi': 'off',

    'mocha/no-setup-in-describe': 'off',
    'node/no-process-env': 'off',

    // TODO: re-enable these rules
    'node/no-sync': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unpublished-require': 'off',
  },
  overrides: [
    {
      files: ['test/e2e/**/*.js'],
      rules: {
        'mocha/no-hooks-for-single-case': 'off',
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
      files: ['test/**/*-test.js', 'test/**/*.spec.js'],
      rules: {
        // Mocha will re-assign `this` in a test context
        '@babel/no-invalid-this': 'off',
      },
    },
    {
      files: ['**/!(*.test).js'],
      rules: {
        'mocha/max-top-level-suites': 'off',
        'mocha/no-identical-tests': 'off',
        'mocha/no-nested-tests': 'off',
        'mocha/no-identical-title': 'off',
        'mocha/no-skipped-tests': 'off',
        'mocha/no-exclusive-tests': 'off',
        'mocha/no-hooks-for-single-case': 'off',
        'mocha/no-async-describe': 'off',
        'mocha/no-sibling-hooks': 'off',
        'mocha/no-global-tests': 'off',
        'mocha/no-pending-tests': 'off',
        'mocha/no-mocha-arrows': 'off',
        'mocha/no-top-level-hooks': 'off',
        'mocha/handle-done-callback': 'off',
        'mocha/no-return-and-callback': 'off',
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
        'babel.config.js',
        'nyc.config.js',
        'stylelint.config.js',
        'app/scripts/runLockdown.js',
        'development/**/*.js',
        'test/e2e/**/*.js',
        'test/lib/wait-until-called.js',
        'test/env.js',
        'test/setup.js',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],

  settings: {
    react: {
      version: 'detect',
    },
  },
};
