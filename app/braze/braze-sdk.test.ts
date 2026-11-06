import { readFileSync } from 'node:fs';
import path from 'node:path';
import { brazeSdk } from './braze-sdk';

/**
 * The only SDK functions the host may use. Everything here is identity or data
 * work; none of it renders Braze-authored content.
 *
 * This list drives tree-shaking: `braze-sdk.ts` must import exactly these
 * names, so the renderers and the Braze-action decoder stay out of the shipped
 * chunk (see "Security" in `braze.md`).
 */
const ALLOWED_SDK_IMPORTS = [
  'changeUser',
  'destroy',
  'getUser',
  'initialize',
  'isInitialized',
  'requestImmediateDataFlush',
  'wipeData',
];

const brazeSdkSource = readFileSync(
  path.join(__dirname, 'braze-sdk.ts'),
  'utf8',
);

describe('brazeSdk', () => {
  it('exposes only the identity API', () => {
    expect(Object.keys(brazeSdk).sort()).toStrictEqual(
      [...ALLOWED_SDK_IMPORTS].sort(),
    );
  });

  it('references the SDK module exactly once', () => {
    // A namespace, default, side-effect or second import defeats tree-shaking
    // and would pull the renderers and the action decoder into the chunk.
    expect([...brazeSdkSource.matchAll(/'@braze\/web-sdk'/gu)]).toHaveLength(1);
  });

  it('imports exactly the allowed symbols', () => {
    const namedImport = brazeSdkSource.match(
      /import\s*\{([^}]+)\}\s*from\s*'@braze\/web-sdk'/u,
    );

    expect(namedImport).not.toBeNull();

    const importedSymbols = (namedImport?.[1] ?? '')
      .split(',')
      .map((symbol) => symbol.trim())
      .filter(Boolean);

    expect(importedSymbols.sort()).toStrictEqual(
      [...ALLOWED_SDK_IMPORTS].sort(),
    );
  });
});
