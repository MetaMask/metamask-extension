const path = require('path');
const { transformSync } = require('@babel/core');
const { rewriteAlias } = require('./import-alias');

const ROOT = path.resolve(__dirname, '../../..');

describe('import-alias babel plugin', () => {
  function transform(code, filePath) {
    const result = transformSync(code, {
      filename: path.join(ROOT, filePath),
      plugins: [require.resolve('./import-alias')],
      parserOpts: { plugins: ['typescript'] },
      configFile: false,
      babelrc: false,
    });
    return result.code;
  }

  describe('rewriteAlias', () => {
    it('rewrites ~/shared/ to a relative path', () => {
      const filename = path.join(ROOT, 'app/scripts/migrations/183.ts');
      const result = rewriteAlias('~/shared/constants/network', filename);
      expect(result).toBe('../../../shared/constants/network');
    });

    it('rewrites ~/ui/ to a relative path', () => {
      const filename = path.join(
        ROOT,
        'ui/components/multichain/activity-v2/hooks.ts',
      );
      const result = rewriteAlias('~/ui/hooks/useI18nContext', filename);
      expect(result).toBe('../../../hooks/useI18nContext');
    });

    it('returns null for non-alias imports', () => {
      const filename = path.join(ROOT, 'ui/components/foo.ts');
      expect(rewriteAlias('./helpers', filename)).toBeNull();
      expect(rewriteAlias('react', filename)).toBeNull();
      expect(rewriteAlias('@metamask/utils', filename)).toBeNull();
    });

    it('does not match partial prefix like ~/shared-extra', () => {
      const filename = path.join(ROOT, 'ui/components/foo.ts');
      expect(rewriteAlias('~/shared-extra/foo', filename)).toBeNull();
    });

    it('handles bare alias without subpath', () => {
      const filename = path.join(ROOT, 'app/scripts/background.js');
      const result = rewriteAlias('~/shared', filename);
      expect(result).toBe('../../shared');
    });
  });

  describe('babel transform: import declarations', () => {
    it('rewrites named import from ~/shared/', () => {
      const code = `import { CHAIN_IDS } from '~/shared/constants/network';`;
      const output = transform(
        code,
        'ui/components/multichain/activity-v2/hooks.ts',
      );
      expect(output).toContain(`from "../../../../shared/constants/network"`);
      expect(output).not.toContain('~/');
    });

    it('rewrites default import from ~/ui/', () => {
      const code = `import AssetPage from '~/ui/pages/asset/components/asset-page';`;
      const output = transform(code, 'ui/components/multichain/foo.ts');
      expect(output).toContain(
        `from "../../pages/asset/components/asset-page"`,
      );
      expect(output).not.toContain('~/');
    });

    it('rewrites type import from ~/shared/', () => {
      const code = `import type { Token } from '~/shared/lib/multichain/types';`;
      const output = transform(
        code,
        'ui/components/multichain/activity-v2/hooks.ts',
      );
      expect(output).toContain(`"../../../../shared/lib/multichain/types"`);
    });

    it('does not touch non-alias imports', () => {
      const code = [
        `import React from 'react';`,
        `import { Box } from '@metamask/design-system-react';`,
        `import { foo } from './helpers';`,
        `import { bar } from '../utils';`,
      ].join('\n');
      const output = transform(code, 'ui/components/foo.ts');
      expect(output).toContain(`react`);
      expect(output).toContain(`@metamask/design-system-react`);
      expect(output).toContain(`./helpers`);
      expect(output).toContain(`../utils`);
      expect(output).not.toContain('~/');
    });
  });

  describe('babel transform: export declarations', () => {
    it('rewrites export { X } from ~/shared/', () => {
      const code = `export { CHAIN_IDS } from '~/shared/constants/network';`;
      const output = transform(code, 'app/scripts/lib/util.ts');
      expect(output).toContain(`from "../../../shared/constants/network"`);
    });

    it('rewrites export * from ~/ui/', () => {
      const code = `export * from '~/ui/selectors';`;
      const output = transform(code, 'ui/components/foo.ts');
      expect(output).toContain(`from "../selectors"`);
    });
  });

  describe('babel transform: require calls', () => {
    it('rewrites require(~/shared/)', () => {
      const code = `const { foo } = require('~/shared/lib/sentry');`;
      const output = transform(code, 'app/scripts/migrations/183.ts');
      expect(output).toContain(`require("../../../shared/lib/sentry")`);
    });

    it('does not touch non-alias require calls', () => {
      const code = `const path = require('path');`;
      const output = transform(code, 'app/scripts/lib/util.ts');
      expect(output).toContain(`require('path')`);
    });
  });
});
