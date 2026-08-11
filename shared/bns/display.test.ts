import { toBnsResolveDisplay, toBnsResolveError } from './display';
import type { ResolveBnesContentResult } from './resolve';

const CID = 'QmYwAPJzv5CZsnAzt8auVZRnGxQK1dH5vzyMGrJMAbXKMF';
const GATEWAY = 'ipfs.bearnetwork.net';

function baseResult(
  overrides: Partial<ResolveBnesContentResult> = {},
): ResolveBnesContentResult {
  return {
    host: 'bear.bnes',
    node: '0x01',
    resolver: '0x3333333333333333333333333333333333333333',
    contenthash: '0xe3',
    cid: CID,
    gatewayUrl: `https://${GATEWAY}/ipfs/${CID}`,
    ...overrides,
  };
}

describe('shared/bns display (H1.4)', () => {
  it('accepts a fully pinned resolve result for UI display only', () => {
    const display = toBnsResolveDisplay(baseResult(), GATEWAY);
    expect(display).toStrictEqual({
      ok: true,
      host: 'bear.bnes',
      cid: CID,
      gatewayUrl: `https://${GATEWAY}/ipfs/${CID}`,
      resolver: '0x3333333333333333333333333333333333333333',
      renderInExtension: false,
    });
  });

  it('rejects gateway URLs that escape the trusted host', () => {
    const display = toBnsResolveDisplay(
      baseResult({
        gatewayUrl: `https://evil.test/ipfs/${CID}`,
      }),
      GATEWAY,
    );
    expect(display.ok).toBe(false);
    if (!display.ok) {
      expect(display.error).toMatch(/origin pin/u);
      expect(display.renderInExtension).toBe(false);
    }
  });

  it('rejects invalid CIDs on re-validation', () => {
    const display = toBnsResolveDisplay(
      baseResult({
        cid: 'bafy/evil',
        gatewayUrl: 'https://ipfs.bearnetwork.net/ipfs/bafy/evil',
      }),
      GATEWAY,
    );
    expect(display.ok).toBe(false);
  });

  it('wraps thrown errors without claiming extension render rights', () => {
    const display = toBnsResolveError(new Error('not configured'), 'bear.bnes');
    expect(display).toMatchObject({
      ok: false,
      error: 'not configured',
      host: 'bear.bnes',
      renderInExtension: false,
    });
  });
});
