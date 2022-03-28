module.exports = {
  // Note that jsdoc is already in the `plugins` array thanks to
  // @metamask/eslint-config — this just extends the config there
  rules: {
    // Allow tag `jest-environment` to work around Jest bug
    // See: https://github.com/facebook/jest/issues/7780
    'jsdoc/check-tag-names': ['error', { definedTags: ['jest-environment'] }],
    'jsdoc/match-description': 'off',
    'jsdoc/require-description': 'off',
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns-description': 'off',
    'jsdoc/require-returns-type': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/valid-types': 'off',
    // jsdoc/check-types now checks for mismatched casing of 'Object' types
    // which has a larger impact on typescript projects than javascript ones
    // due to the typescript Object type. To prevent large amounts of churn
    // these temporary overrides are added which will be removed and casing
    // normalized in a future PR.
    'jsdoc/check-types': [
      'error',
      {
        exemptTagContexts: [
          { tag: 'property', types: ['Object', 'Object[]', 'Array<Object>'] },
          { tag: 'param', types: ['Object', 'Object[]', 'Array<Object>'] },
          { tag: 'typedef', types: ['Object', 'Object[]', 'Array<Object>'] },
          { tag: 'returns', types: ['Object', 'Object[]', 'Array<Object>'] },
          { tag: 'type', types: ['Object', 'Object[]', 'Array<Object>'] },
        ],
      },
    ],
  },
  settings: {
    jsdoc: {
      mode: 'typescript',
    },
  },
};
