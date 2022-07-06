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
  },
};
