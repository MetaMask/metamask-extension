module.exports = {
  extends: ['@metamask/eslint-config'],

  plugins: ['@metamask/design-tokens'],

  globals: {
    document: 'readonly',
    window: 'readonly',
    // Our ESLint config is stuck at ES2017 because Browserify doesn't support the spread operator.
    // We can remove this global after we've migrated away from Browserify and updated our ESLint
    // config to at least ES2021.
    AggregateError: 'readonly',
  },

  settings: {
    jsdoc: {
      mode: 'typescript',
    },
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

    '@metamask/design-tokens/color-no-hex': 'error',
    'import/no-restricted-paths': [
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

    // TODO: re-enable once the proposed feature at https://github.com/gajus/eslint-plugin-jsdoc/pull/964#issuecomment-1936470252 is available
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
  },
};
