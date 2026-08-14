// this file is named .eslintrc.js because eslint checks for that file first

module.exports = {
  rules: {
    // These modules are imported by `recalibrate-thresholds.mts`, which runs on
    // Node's type stripping rather than `tsx`. Node ESM resolves no extensions
    // implicitly, so every relative specifier in the chain must carry one.
    // `tsconfig` already sets `allowImportingTsExtensions`, and the same
    // exemption exists in `development/webpack/.eslintrc.js` for the same
    // reason.
    'import-x/extensions': 'off',
  },
};
