import { isSupportedMethod, isSupportedNotification, isSupportedScopeString, validNotifications, validRpcMethods } from './supported';

describe('Scope Support', () => {
  it('isSupportedNotification', () => {
    validNotifications.forEach((notification) => {
      expect(isSupportedNotification(notification)).toStrictEqual(true);
    })
    expect(isSupportedNotification('anything else')).toStrictEqual(false);
    expect(isSupportedNotification('')).toStrictEqual(false);
  });

  it('isSupportedMethod', () => {
    validRpcMethods.forEach((method) => {
      expect(isSupportedMethod(method)).toStrictEqual(true);
    })
    expect(isSupportedMethod('anything else')).toStrictEqual(false);
    expect(isSupportedMethod('')).toStrictEqual(false);
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
      const findNetworkClientIdByChainIdMock = jest
        .fn()
        .mockReturnValue('networkClientId');
      expect(
        isSupportedScopeString('eip155:1', findNetworkClientIdByChainIdMock),
      ).toStrictEqual(true);
    });

    it('returns false for the ethereum namespace when a network client does not exist for the reference', () => {
      const findNetworkClientIdByChainIdMock = jest
        .fn()
        .mockImplementation(() => {
          throw new Error('failed to find network client for chainId');
        });
      expect(
        isSupportedScopeString('eip155:1', findNetworkClientIdByChainIdMock),
      ).toStrictEqual(false);
    });
  });
});
