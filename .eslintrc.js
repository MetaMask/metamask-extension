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
    'json',
    'import',
  ],

  globals: {
    '$': 'readonly',
    document: 'readonly',
    QUnit: 'readonly',
    window: 'readonly',
  },

  rules: {
    /* TODO: Remove these when upgrading to `@metamask/eslint-config@2` */
    'array-callback-return': 'error',
    'callback-return': 'error',
    'consistent-return': 'error',
    'global-require': 'error',
    'guard-for-in': 'error',
    'implicit-arrow-linebreak': 'error',
    'import/extensions': ['error', 'never', { 'json': 'always' }],
    'import/no-extraneous-dependencies': 'error',
    'import/unambiguous': 'error',
    'max-statements-per-line': ['error', { 'max': 1 }],
    'no-case-declarations': 'error',
    'no-constant-condition': 'error',
    'no-dupe-else-if': 'error',
    'no-empty': 'error',
    'no-empty-function': 'error',
    'no-eq-null': 'error',
    'no-global-assign': 'error',
    'no-loop-func': 'error',
    'no-negated-condition': 'error',
    'no-nested-ternary': 'error',
    'no-param-reassign': 'error',
    'no-plusplus': ['error', { 'allowForLoopAfterthoughts': true }],
    'no-process-exit': 'error',
    'no-prototype-builtins': 'error',
    'no-shadow': 'error',
    'no-template-curly-in-string': 'error',
    'no-useless-catch': 'error',
    'no-useless-concat': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'require-unicode-regexp': 'error',
    /* End v2 rules */
    'arrow-parens': 'error',
    'no-tabs': 'error',
    'no-mixed-operators': 'error',
    'import/default': 'error',
    'import/export': 'error',
    'import/named': 'error',
    'import/namespace': 'error',
    'import/newline-after-import': 'error',
    'import/no-absolute-path': 'error',
    'import/no-amd': 'error',
    'import/no-anonymous-default-export': 'error',
    'import/no-duplicates': 'error',
    'import/no-dynamic-require': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-named-as-default': 'error',
    'import/no-named-as-default-member': 'error',
    'import/no-named-default': 'error',
    'import/no-self-import': 'error',
    'import/no-unresolved': ['error', { 'commonjs': true }],
    'import/no-unused-modules': 'error',
    'import/no-useless-path-segments': ['error', { 'commonjs': true }],
    'import/no-webpack-loader-syntax': 'error',
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
    'react/jsx-max-props-per-line': ['error', { 'maximum': 1, 'when': 'multiline' } ],
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
