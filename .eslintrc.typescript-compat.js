const path = require('path');

module.exports = {
  settings: {
    'import/extensions': ['.js', '.ts', '.tsx'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      alias: {
        map: [
          ['@components', path.resolve(__dirname, './ui/components/app')],
          ['@ui', path.resolve(__dirname, 'ui/components/ui')],
          ['@helpers', path.resolve(__dirname, './ui/helpers')],
          ['@hooks', path.resolve(__dirname, 'ui/hooks')],
          ['@store', path.resolve(__dirname, 'ui/store')],
          ['@contexts', path.resolve(__dirname, 'ui/contexts')],
          ['@selectors', path.resolve(__dirname, 'ui/selectors')],
          ['@ducks', path.resolve(__dirname, 'ui/ducks')],
          ['@shared', path.resolve(__dirname, 'shared')],
        ],
      },
    },
  },
};
