module.exports = {
  // stylelint 15 deprecated and 16 removed the stylistic rules this config used
  // to carry (indentation, brace/colon/comma spacing, casing, etc.). Formatting
  // is owned by oxfmt + prettier here, so those rules are dropped rather than
  // migrated. What remains is the set that still expresses a real constraint.
  customSyntax: 'postcss-scss',

  ignoreFiles: [
    '/app',
    '/development',
    '/dist',
    '/docs',
    '/fonts',
    '/images',
    '/node_modules',
    '/notices',
    '/test',
    '/public',
  ],

  rules: {
    // stylelint-config-standard

    'at-rule-empty-line-before': [
      'always',
      {
        except: ['blockless-after-same-name-blockless', 'first-nested'],
        ignore: ['after-comment'],
      },
    ],
    'color-hex-length': 'short',
    'comment-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['stylelint-commands'],
      },
    ],
    // 'comment-whitespace-inside': 'always',
    'custom-property-empty-line-before': [
      'always',
      {
        except: ['after-custom-property', 'first-nested'],
        ignore: ['after-comment', 'inside-single-line-block'],
      },
    ],
    'declaration-block-single-line-max-declarations': 1,
    'declaration-empty-line-before': [
      'always',
      {
        except: ['after-declaration', 'first-nested'],
        ignore: ['after-comment', 'inside-single-line-block'],
      },
    ],
    'function-name-case': 'lower',
    'length-zero-no-unit': true,
    'rule-empty-line-before': [
      'always-multi-line',
      {
        except: ['first-nested'],
        ignore: ['after-comment'],
      },
    ],
    'selector-pseudo-element-colon-notation': 'double',
    'selector-type-case': 'lower',

    // custom rules

    // 'color-named': 'never',
    // This rule checks for the usage of hexadecimal color values and warns about it to encourage the use of Design Tokens https://github.com/MetaMask/design-tokens/
    'color-no-hex': [true, { severity: 'error' }],
    // 'font-family-name-quotes': 'always-where-recommended',
    // 'font-weight-notation': 'numeric',
    // 'function-url-quotes': 'always',
    'value-no-vendor-prefix': true,
    // 'selector-attribute-quotes': 'always',
    // 'selector-max-specificity': '0,5,2',
    // 'max-nesting-depth': 3,
    'no-unknown-animations': true,
  },
};
