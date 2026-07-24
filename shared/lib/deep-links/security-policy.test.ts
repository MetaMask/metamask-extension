import { INVALID, MISSING, VALID } from './verify';
import { shouldShowDeepLinkInterstitial } from './security-policy';

describe('shouldShowDeepLinkInterstitial', () => {
  describe('when the deep link is intercepted', () => {
    for (const requestOrigin of [
      'https://metamask.io',
      'https://app.metamask.io',
    ]) {
      it(`allows the explicitly trusted web origin ${requestOrigin} to bypass the interstitial`, () => {
        const result = shouldShowDeepLinkInterstitial({
          source: 'intercepted',
          requestOrigin,
          signatureStatus: MISSING,
          skipDeepLinkInterstitial: false,
        });

        expect(result).toBe(false);
      });
    }

    it('does not trust a subdomain of an explicitly trusted web origin', () => {
      const result = shouldShowDeepLinkInterstitial({
        source: 'intercepted',
        requestOrigin: 'https://portfolio.metamask.io',
        signatureStatus: MISSING,
        skipDeepLinkInterstitial: false,
      });

      expect(result).toBe(true);
    });

    it('allows a valid signature when the user opted out of warnings', () => {
      const result = shouldShowDeepLinkInterstitial({
        source: 'intercepted',
        signatureStatus: VALID,
        skipDeepLinkInterstitial: true,
      });

      expect(result).toBe(false);
    });

    it('shows the interstitial for a valid signature when the user did not opt out', () => {
      const result = shouldShowDeepLinkInterstitial({
        source: 'intercepted',
        signatureStatus: VALID,
        skipDeepLinkInterstitial: false,
      });

      expect(result).toBe(true);
    });

    for (const signatureStatus of [MISSING, INVALID]) {
      it(`shows the interstitial for a ${signatureStatus} signature even when the user opted out`, () => {
        const result = shouldShowDeepLinkInterstitial({
          source: 'intercepted',
          signatureStatus,
          skipDeepLinkInterstitial: true,
        });

        expect(result).toBe(true);
      });
    }
  });

  describe('when the deep link is deferred', () => {
    it('allows a valid signature to bypass the interstitial', () => {
      const result = shouldShowDeepLinkInterstitial({
        source: 'deferred',
        signatureStatus: VALID,
      });

      expect(result).toBe(false);
    });

    for (const signatureStatus of [MISSING, INVALID]) {
      it(`shows the interstitial for a ${signatureStatus} signature`, () => {
        const result = shouldShowDeepLinkInterstitial({
          source: 'deferred',
          signatureStatus,
        });

        expect(result).toBe(true);
      });
    }
  });
});
