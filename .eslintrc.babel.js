module.exports = {
  parser: '@babel/eslint-parser',
  plugins: ['@babel'],
  rules: {
    '@babel/no-invalid-this': 'error',
    // Prettier handles this
    '@babel/semi': 'off',
  },
};
