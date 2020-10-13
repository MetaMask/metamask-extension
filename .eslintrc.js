module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    'sourceType': 'module',
    'ecmaVersion': 2017,
    'ecmaFeatures': {
      'experimentalObjectRestSpread': true,
      'impliedStrict': true,
      'modules': true,
      'blockBindings': true,
      'arrowFunctions': true,
      'objectLiteralShorthandMethods': true,
      'objectLiteralShorthandProperties': true,
      'templateStrings': true,
      'classes': true,
      'jsx': true,
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
    'app/scripts/chromereload.js',
    'app/vendor/**',
  ],

  extends: [
    '@metamask/eslint-config',
    '@metamask/eslint-config/config/nodejs',
    '@metamask/eslint-config/config/mocha',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],

  plugins: [
    'babel',
    'react',
    'import',
  ],

  globals: {
    document: 'readonly',
    window: 'readonly',
  },

  rules: {
    'default-param-last': 'off',
    'require-atomic-updates': 'off',
    'import/no-unassigned-import': 'off',
    'prefer-object-spread': 'error',
    'react/no-unused-prop-types': 'error',
    'react/no-unused-state': 'error',
    'react/jsx-boolean-value': 'error',
    'react/jsx-curly-brace-presence': ['error', { 'props': 'never', 'children': 'never' }],
    'react/jsx-equals-spacing': 'error',
    'react/no-deprecated': 'error',
    'react/default-props-match-prop-types': 'error',
    'react/jsx-closing-tag-location': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-closing-bracket-location': 'error',
    'react/jsx-first-prop-new-line': ['error', 'multiline'],
    'react/jsx-max-props-per-line': ['error', { 'maximum': 1, 'when': 'multiline' }],
    'react/jsx-tag-spacing': ['error', {
      'closingSlash': 'never',
      'beforeSelfClosing': 'always',
      'afterOpening': 'never',
    }],
    'react/jsx-wrap-multilines': ['error', {
      'declaration': 'parens-new-line',
      'assignment': 'parens-new-line',
      'return': 'parens-new-line',
      'arrow': 'parens-new-line',
      'condition': 'parens-new-line',
      'logical': 'parens-new-line',
      'prop': 'parens-new-line',
    }],

    'no-invalid-this': 'off',
    'babel/no-invalid-this': 'error',

    'babel/semi': ['error', 'never'],
    'mocha/no-setup-in-describe': 'off',
  },

  overrides: [{
    files: [
      'test/e2e/**/*.js',
    ],
    rules: {
      'mocha/no-hooks-for-single-case': 'off',
    },
  }, {
    files: [
      'app/scripts/migrations/*.js',
      '*.stories.js',
    ],
    rules: {
      'import/no-anonymous-default-export': ['error', { 'allowObject': true }],
    },
  }, {
    files: [
      'app/scripts/migrations/*.js',
    ],
    rules: {
      'global-require': 'off',
    },
  }, {
    files: [
      'test/**/*-test.js',
      'test/**/*.spec.js',
    ],
    rules: {
      // Mocha will re-assign `this` in a test context
      'babel/no-invalid-this': 'off',
    },
  }, {
    files: [
      'development/**/*.js',
      'test/e2e/benchmark.js',
      'test/helper.js',
    ],
    rules: {
      'no-process-exit': 'off',
    },
  }, {
    files: [
      '.eslintrc.js',
      'babel.config.js',
      'nyc.config.js',
      'stylelint.config.js',
      'development/**/*.js',
      'test/e2e/**/*.js',
      'test/env.js',
      'test/setup.js',
    ],
    parserOptions: {
      sourceType: 'script',
    },
  }],

  settings: {
    'react': {
      'version': 'detect',
    },
  },
}
