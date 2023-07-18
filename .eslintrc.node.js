module.exports = {
  extends: ['@metamask/eslint-config-nodejs'],
  rules: {
    'n/no-process-env': 'off',
    // TODO: re-enable these rules
    'n/no-sync': 'off',
    'n/no-unpublished-import': 'off',
    'n/no-unpublished-require': 'off',
  },
};
