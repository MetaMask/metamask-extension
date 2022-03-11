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
  },
  settings: {
    jsdoc: {
      mode: 'typescript',
    },
  },
};
