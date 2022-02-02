module.exports = {
  rules: {
    // With this extension, ESLint will look for TypeScript files when it
    // encounters an import. For some reason, this is now introducing
    // `import/no-named-as-default-member` errors. The `typescript-eslint` docs
    // recommend turning this off anyway, as TypeScript already provides this
    // check.
    // TODO: Move this into our shared config
    'import/no-named-as-default-member': 'off',
    // Turn these off as per the `typescript-eslint` docs, as TypeScript already
    // provides this check.
    // TODO: Move these into our shared config
    'import/no-named-as-default': 'off',
    'import/no-cycle': 'off',
    'import/no-unused-modules': 'off',
    'import/no-deprecated': 'off',
  },
  settings: {
    'import/extensions': ['.js', '.ts', '.tsx'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
