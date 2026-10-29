const babelPlugin = require('@babel/eslint-plugin');
const babelParser = require('@babel/eslint-parser');

module.exports = {
  languageOptions: {
    parser: babelParser,
  },
  plugins: {
    '@babel': babelPlugin,
  },
  rules: {
    '@babel/no-invalid-this': 'error',
    // Prettier handles this
    '@babel/semi': 'off',
  },
};
