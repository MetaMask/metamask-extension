import babelPlugin from '@babel/eslint-plugin';
import babelParser from '@babel/eslint-parser';

export const config = {
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
