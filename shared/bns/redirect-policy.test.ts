import { decideBnsTabRedirect, extractBnesHostFromNavigationUrl } from './redirect-policy';
import type { BnsResolveDisplay } from './display';

const CID = 'QmYwAPJzv5CZsnAzt8auVZRnGxQK1dH5vzyMGrJMAbXKMF';
const GATEWAY = 'ipfs.bearnetwork.net';
const TRUSTED_URL = `https://${GATEWAY}/ipfs/${CID}`;

function okDisplay(
  overrides: Partial<Extract<BnsResolveDisplay, { ok: true }>> = {},
): BnsResolveDisplay {
  return {
    ok: true,
    host: 'bear.bnes',
    cid: CID,
    gatewayUrl: TRUSTED_URL,
    resolver: '0x3333333333333333333333333333333333333333',
    renderInExtension: false,
    ...overrides,
  };
}

describe('shared/bns redirect-policy (H1.5)', () => {
  describe('extractBnesHostFromNavigationUrl', () => {
    it('accepts http(s) .bnes main-frame style URLs', () => {
      expect(extractBnesHostFromNavigationUrl('https://bear.bnes/')).toBe(
        'bear.bnes',
      );
      expect(
        extractBnesHostFromNavigationUrl('http://docs.bear.bnes/path'),
      ).toBe('docs.bear.bnes');
    });

    it('rejects malicious or non-BNS hosts', () => {
      expect(extractBnesHostFromNavigationUrl('https://evil.eth/')).toBeNull();
      expect(
        extractBnesHostFromNavigationUrl('https://-bad.bnes/'),
      ).toBeNull();
      expect(
        extractBnesHostFromNavigationUrl('https://bear..bnes/'),
      ).toBeNull();
      expect(
        extractBnesHostFromNavigationUrl('chrome-extension://id/page.html'),
      ).toBeNull();
      expect(
        extractBnesHostFromNavigationUrl('https://user:pass@bear.bnes/'),
      ).toBeNull();
    });
  });

  describe('decideBnsTabRedirect', () => {
    it('allows redirect only to a pinned HTTPS gateway URL', () => {
      const decision = decideBnsTabRedirect(okDisplay(), GATEWAY);
      expect(decision).toStrictEqual({
        action: 'redirect',
        url: TRUSTED_URL,
        host: 'bear.bnes',
        cid: CID,
        renderInExtension: false,
      });
    });

    it('aborts when resolve display is an error', () => {
      const decision = decideBnsTabRedirect(
        {
          ok: false,
          error: 'not configured',
          host: 'bear.bnes',
          renderInExtension: false,
        },
        GATEWAY,
      );
      expect(decision.action).toBe('abort');
      if (decision.action === 'abort') {
        expect(decision.reason).toMatch(/not configured/u);
        expect(decision.renderInExtension).toBe(false);
      }
    });

    it('rejects gateway URLs that escape the trusted host', () => {
      const decision = decideBnsTabRedirect(
        okDisplay({
          gatewayUrl: `https://evil.test/ipfs/${CID}`,
        }),
        GATEWAY,
      );
      expect(decision.action).toBe('abort');
      if (decision.action === 'abort') {
        expect(decision.reason).toMatch(/origin pin/u);
      }
    });

    it('rejects invalid CIDs even if the DTO claims success', () => {
      const decision = decideBnsTabRedirect(
        okDisplay({
          cid: 'not-a-cid!!!',
          gatewayUrl: `https://${GATEWAY}/ipfs/not-a-cid!!!`,
        }),
        GATEWAY,
      );
      expect(decision.action).toBe('abort');
      if (decision.action === 'abort') {
        expect(decision.reason).toMatch(/CID/u);
      }
    });

    it('forbids chrome-extension destinations', () => {
      const decision = decideBnsTabRedirect(
        okDisplay({
          // Force an extension URL past the usual pin helper by using a host
          // that would not pass isAllowedGatewayUrl — still must abort.
          gatewayUrl: 'chrome-extension://abc/loading.html',
        }),
        GATEWAY,
      );
      expect(decision.action).toBe('abort');
      expect(decision.renderInExtension).toBe(false);
    });

    it('forbids data: and blob: destinations', () => {
      for (const gatewayUrl of [
        'data:text/html,<h1>x</h1>',
        'blob:https://example/uuid',
      ]) {
        const decision = decideBnsTabRedirect(
          okDisplay({ gatewayUrl }),
          GATEWAY,
        );
        expect(decision.action).toBe('abort');
      }
    });
  });
});
