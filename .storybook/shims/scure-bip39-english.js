// Relative path so webpack does not re-apply the package alias (circular)
// and depcheck does not treat a webpack-only specifier as a missing package.
const {
  wordlist,
} = require('../../node_modules/@metamask/scure-bip39/dist/wordlists/english.js');

module.exports = {
  __esModule: true,
  default: { wordlist },
  wordlist,
};
