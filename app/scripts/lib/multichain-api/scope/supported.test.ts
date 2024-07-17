import { isSupportedNotification, isSupportedScopeString } from './supported';

describe('Scope Support', () => {
  it('isSupportedNotification', () => {
    expect(isSupportedNotification('accountsChanged')).toStrictEqual(true);
    expect(isSupportedNotification('chainChanged')).toStrictEqual(true);
    expect(isSupportedNotification('anything else')).toStrictEqual(false);
    expect(isSupportedNotification('')).toStrictEqual(false);
  });

  describe('isSupportedScopeString', () => {
    it('returns true for the wallet namespace', () => {
      expect(isSupportedScopeString('wallet', jest.fn())).toStrictEqual(true);
    });

    it('returns false for the wallet namespace when a reference is included', () => {
      expect(isSupportedScopeString('wallet:someref', jest.fn())).toStrictEqual(
        false,
      );
    });

    it('returns true for the ethereum namespace', () => {
      expect(isSupportedScopeString('eip155', jest.fn())).toStrictEqual(true);
    });

    it('returns true for the ethereum namespace when a network client exists for the reference', () => {
      const existsNetworkClientForChainId = jest.fn().mockReturnValue(true);
      expect(
        isSupportedScopeString('eip155:1', existsNetworkClientForChainId),
      ).toStrictEqual(true);
    });

    it('returns false for the ethereum namespace when a network client does not exist for the reference', () => {
      const existsNetworkClientForChainId = jest.fn().mockReturnValue(false);
      expect(
        isSupportedScopeString('eip155:1', existsNetworkClientForChainId),
      ).toStrictEqual(false);
    });
  });
});
