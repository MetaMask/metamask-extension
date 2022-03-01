module.exports = {
  extends: ['@metamask/eslint-config-nodejs'],
  rules: {
    'node/no-process-env': 'off',
    // TODO: re-enable these rules
    'node/no-sync': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unpublished-require': 'off',
  },
};
