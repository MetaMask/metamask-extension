import { getFromChain, getIsBridgeTx, getToChain } from './selectors';

describe('Bridge selectors', () => {
  describe('getFromChain', () => {
    it('returns the fromChain from the state', () => {
      const state = {
        metamask: { providerConfig: { chainId: '0x1' } },
      };

      const result = getFromChain(state);

      expect(result).toEqual({ chainId: '0x1' });
    });
  });

  describe('getToChain', () => {
    it('returns the toChain from the state', () => {
      const state = {
        bridge: {
          toChain: { chainId: '0x1' },
        },
      };

      const result = getToChain(state as any);

      expect(result).toEqual({ chainId: '0x1' });
    });
  });

  describe('getIsBridgeTx', () => {
    it('returns false if bridge is not enabled', () => {
      const state = {
        metamask: {
          providerConfig: { chainId: '0x1' },
          useExternalServices: true,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: false } },
        },
        bridge: { toChain: { chainId: '0x38' } },
      };

      const result = getIsBridgeTx(state as any);

      expect(result).toBe(false);
    });

    it('returns false if toChain is null', () => {
      const state = {
        metamask: {
          providerConfig: { chainId: '0x1' },
          useExternalServices: true,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: true } },
        },
        bridge: { toChain: null },
      };

      const result = getIsBridgeTx(state as any);

      expect(result).toBe(false);
    });

    it('returns false if fromChain and toChain have the same chainId', () => {
      const state = {
        metamask: {
          providerConfig: { chainId: '0x1' },
          useExternalServices: true,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: true } },
        },
        bridge: { toChain: { chainId: '0x1' } },
      };

      const result = getIsBridgeTx(state as any);

      expect(result).toBe(false);
    });

    it('returns false if useExternalServices is not enabled', () => {
      const state = {
        metamask: {
          providerConfig: { chainId: '0x1' },
          useExternalServices: false,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: true } },
        },
        bridge: { toChain: { chainId: '0x38' } },
      };

      const result = getIsBridgeTx(state as any);

      expect(result).toBe(false);
    });

    it('returns true if bridge is enabled and fromChain and toChain have different chainIds', () => {
      const state = {
        metamask: {
          providerConfig: { chainId: '0x1' },
          useExternalServices: true,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: true } },
        },
        bridge: { toChain: { chainId: '0x38' } },
      };

      const result = getIsBridgeTx(state as any);

      expect(result).toBe(true);
    });
  });
});
