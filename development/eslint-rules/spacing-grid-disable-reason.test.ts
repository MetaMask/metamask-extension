/** @jest-environment node */

import { RuleTester } from 'eslint';

import designSystemPlugin from './design-system-plugin';
import rule from './spacing-grid-disable-reason';

// The plugin is registered so directives naming `design-system/spacing-grid`
// resolve instead of reporting "Definition for rule ... was not found".
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: { 'design-system': designSystemPlugin },
});

ruleTester.run('spacing-grid-disable-reason', rule, {
  valid: [
    {
      name: 'a disable with a reason is allowed',
      code: '// eslint-disable-next-line design-system/spacing-grid -- 2px optical offset for the border',
    },
    {
      name: 'a block disable with a reason is allowed',
      code: '/* eslint-disable design-system/spacing-grid -- file uses a non-grid layout */',
    },
    {
      name: 'a line disable with a reason is allowed',
      code: 'doSomething(); // eslint-disable-line design-system/spacing-grid -- legacy offset',
    },
    {
      name: 'a disable for another rule needs no reason',
      code: '// eslint-disable-next-line no-console',
    },
    {
      name: 'a disable whose other rules need no reason is still fine with a reason',
      code: '// eslint-disable-next-line no-console, design-system/spacing-grid -- half-step',
    },
    {
      name: 'a regular comment naming the rule is not a directive',
      code: '// design-system/spacing-grid flags off-grid spacing',
    },
    {
      name: 'an eslint-enable for the rule needs no reason',
      code: '/* eslint-enable design-system/spacing-grid */',
    },
    {
      name: 'a blanket disable is not covered',
      code: '/* eslint-disable */',
    },
  ],
  invalid: [
    {
      name: 'a disable-next-line without a reason is flagged',
      code: '// eslint-disable-next-line design-system/spacing-grid',
      errors: [{ messageId: 'missingReason' }],
    },
    {
      name: 'a block disable without a reason is flagged',
      code: '/* eslint-disable design-system/spacing-grid */',
      errors: [{ messageId: 'missingReason' }],
    },
    {
      name: 'a bare separator with trailing whitespace is not a reason',
      code: '/* eslint-disable design-system/spacing-grid -- */',
      errors: [{ messageId: 'missingReason' }],
    },
    {
      name: 'a line disable without a reason is flagged',
      code: 'doSomething(); // eslint-disable-line design-system/spacing-grid',
      errors: [{ messageId: 'missingReason' }],
    },
    {
      name: 'a mixed disable is flagged when the spacing-grid entry has no reason',
      code: '// eslint-disable-next-line no-console, design-system/spacing-grid',
      errors: [{ messageId: 'missingReason' }],
    },
  ],
});
