const path = require('path');

module.exports = {
  extends: [
    '@metamask/eslint-config',
    path.resolve(__dirname, '.eslintrc.jsdoc.js'),
  ],

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
    'import/no-unassigned-import': 'off',

    // import/no-named-as-default-member checks if default imports also have
    // named exports matching properties used on the default import. Example:
    // in confirm-seed-phrase-component.test.js we import sinon from 'sinon'
    // and later access sinon.spy. spy is also exported from sinon directly and
    // thus triggers the error. Turning this rule off to prevent churn when
    // upgrading eslint and dependencies. This rule should be evaluated and
    // if agreeable turned on upstream in @metamask/eslint-config
    'import/no-named-as-default-member': 'off',

    // This is necessary to run eslint on Windows and not get a thousand CRLF errors
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
  },
};
