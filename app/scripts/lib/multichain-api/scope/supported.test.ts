import {
  isSupportedAccount,
  isSupportedNotification,
  isSupportedScopeString,
} from './supported';

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

  describe('isSupportedAccount', () => {
    it('returns false for non-ethereum namespaces', () => {
      expect(isSupportedAccount('wallet:1:0x1', jest.fn())).toStrictEqual(
        false,
      );
      expect(
        isSupportedAccount(
          'bip122:000000000019d6689c085ae165831e93:0x1',
          jest.fn(),
        ),
      ).toStrictEqual(false);
      expect(
        isSupportedAccount('cosmos:cosmoshub-2:0x1', jest.fn()),
      ).toStrictEqual(false);
    });

    it('returns true for ethereum eoa accounts', () => {
      const getInternalAccountsMock = jest.fn().mockReturnValue([
        {
          type: 'eip155:eoa',
          address: '0xdeadbeef',
        },
      ]);
      expect(
        isSupportedAccount('eip155:1:0xdeadbeef', getInternalAccountsMock),
      ).toStrictEqual(true);
    });

    it('returns true for ethereum erc4337 accounts', () => {
      const getInternalAccountsMock = jest.fn().mockReturnValue([
        {
          type: 'eip155:erc4337',
          address: '0xdeadbeef',
        },
      ]);
      expect(
        isSupportedAccount('eip155:1:0xdeadbeef', getInternalAccountsMock),
      ).toStrictEqual(true);
    });

    it('returns false for other ethereum account types', () => {
      const getInternalAccountsMock = jest.fn().mockReturnValue([
        {
          type: 'eip155:other',
          address: '0xdeadbeef',
        },
      ]);
      expect(
        isSupportedAccount('eip155:1:0xdeadbeef', getInternalAccountsMock),
      ).toStrictEqual(false);
    });
  });
});
