module.exports = {
  extends: ['@metamask/eslint-config-nodejs'],
  rules: {
    'n/no-process-env': 'off',
    // TODO: re-enable these rules
    'n/no-sync': 'off',
    'n/no-unpublished-import': 'off',
    'n/no-unpublished-require': 'off',

    // These rule modifications are removing changes to our shared ESLint config made after
    // version v9. This is a temporary measure to get us to ESLint v9 compatible versions,
    // at which point we can restore the intended rules and use error suppression instead.
    //
    // TODO: Remove these modifications after the ESLint v9 update
    'no-restricted-globals': 'off',
  },
};
