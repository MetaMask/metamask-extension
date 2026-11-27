/**
 * Spacing grid checks for ui/ and shared/ source. `spacing-grid` is core
 * `no-restricted-syntax` under this plugin's name, so its selectors in
 * .eslintrc.js do not replace the `no-restricted-syntax` configs that other
 * blocks set on the same files (the TypeScript block and the confirmations
 * override both set it).
 *
 * This uses ESLint's unsupported `use-at-your-own-risk` export, as other local
 * plugins do. If an ESLint upgrade changes it, the spacing-grid tests in this
 * directory fail and point at this file.
 */
'use strict';

const { builtinRules } = require('eslint/use-at-your-own-risk');
const spacingGridDisableReason = require('./spacing-grid-disable-reason');

// `use-at-your-own-risk` is an unsupported ESLint export; fail fast if an
// ESLint upgrade removes the rule from it.
const noRestrictedSyntax = builtinRules.get('no-restricted-syntax');
if (!noRestrictedSyntax) {
  throw new Error(
    'no-restricted-syntax was not found in eslint/use-at-your-own-risk; update development/eslint-rules/design-system-plugin.js for this ESLint version.',
  );
}

module.exports = {
  meta: {
    name: 'design-system',
    version: '1.0.0',
  },
  rules: {
    'spacing-grid': noRestrictedSyntax,
    'spacing-grid-disable-reason': spacingGridDisableReason,
  },
};
