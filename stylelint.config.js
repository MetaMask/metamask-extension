module.exports = {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    // style-config-recommended overrides
    // See current list: <https://github.com/stylelint/stylelint-config-recommended/blob/main/index.js>
    'no-descending-specificity': null,

    // style-config-standard overrides
    // See current list: <https://github.com/stylelint/stylelint-config-standard/blob/main/index.js>
    'alpha-value-notation': null,
    'at-rule-no-vendor-prefix': null,
    'color-function-notation': null,
    'comment-whitespace-inside': null,
    'custom-media-pattern': null,
    'custom-property-pattern': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'font-family-name-quotes': null,
    'function-url-quotes': null,
    'hue-degree-notation': null,
    'keyframes-name-pattern': null,
    'max-empty-lines': null,
    'max-line-length': null,
    'media-feature-name-no-vendor-prefix': null,
    'no-empty-first-line': null,
    'no-irregular-whitespace': null,
    'number-max-precision': null,
    'property-no-vendor-prefix': null,
    'selector-attribute-quotes': null,
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'selector-no-vendor-prefix': null,
    'shorthand-property-no-redundant-values': true,
    'string-quotes': null,
    'value-keyword-case': null,

    // stylelint-config-standard-scss overrides
    // See current list: <https://github.com/stylelint-scss/stylelint-config-standard-scss/blob/main/index.js>
    'scss/at-mixin-pattern': [
      '^(-?[A-Za-z][a-z0-9]*)(-[a-z0-9]+)*(__[a-z][a-z0-9]*(-[a-z0-9]+)*)?$',
      {
        message:
          'Expected mixin to follow BEM naming conventions (see https://en.bem.info/methodology/naming-convention/)',
      },
    ],
    'scss/percent-placeholder-pattern': [
      '^(-?[a-z][a-z0-9]*)(-[a-z0-9]+)*(__[a-z][a-z0-9]*(-[a-z0-9]+)*)?$',
      {
        message:
          'Expected placeholder to follow BEM naming conventions (see https://en.bem.info/methodology/naming-convention/)',
      },
    ],

    // Other rules
    'no-unknown-animations': true,
    'value-list-comma-newline-before': 'never-multi-line',
  },
};
