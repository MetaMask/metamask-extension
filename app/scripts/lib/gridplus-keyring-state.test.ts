import { EXPECTED_SESSION_KEY } from './gridplus-connect';
import { normalizeGridPlusKeyringState } from './gridplus-keyring-state';

describe('normalizeGridPlusKeyringState', () => {
  it('passes through new GridPlus keyring state unchanged', () => {
    const state = {
      deviceId: 'device-1',
      deviceType: 'lattice' as const,
      sessionKey: EXPECTED_SESSION_KEY,
      hdPath: `m/44'/60'/0'/0/x`,
      page: 1,
      unlockedAccount: 2,
      accounts: [
        {
          address: '0xabc',
          signerPath: [2147483692, 2147483708, 2147483648, 0, 0],
          hdPath: `m/44'/60'/0'/0/x`,
          index: 0,
        },
      ],
      appName: 'MetaMask',
    };

    expect(normalizeGridPlusKeyringState(state)).toBe(state);
  });

  it('converts legacy eth-lattice-keyring state into reconnect-required GridPlus state', () => {
    expect(
      normalizeGridPlusKeyringState({
        creds: {
          deviceID: 'old-device-id',
          password: 'old-password',
          endpoint: null,
        },
        accounts: ['0xabc', '0xdef'],
        accountIndices: [0, 4],
        accountOpts: [
          {
            walletUID: 'wallet-1',
            hdPath: `m/44'/60'/0'/0/x`,
          },
          {
            walletUID: {
              type: 'Buffer',
              data: [1, 15, 255],
            },
            hdPath: `m/44'/60'/1'/0/x`,
          },
        ],
        walletUID: 'wallet-1',
        appName: 'MetaMask',
        network: 'mainnet',
        page: 2,
        hdPath: `m/44'/60'/0'/0/x`,
      }),
    ).toStrictEqual({
      deviceId: null,
      deviceType: null,
      sessionKey: EXPECTED_SESSION_KEY,
      hdPath: `m/44'/60'/0'/0/x`,
      page: 2,
      unlockedAccount: 5,
      accounts: [
        {
          address: '0xabc',
          signerPath: [2147483692, 2147483708, 2147483648, 0, 0],
          hdPath: `m/44'/60'/0'/0/x`,
          index: 0,
          walletUID: 'wallet-1',
        },
        {
          address: '0xdef',
          signerPath: [2147483692, 2147483708, 2147483649, 0, 4],
          hdPath: `m/44'/60'/1'/0/x`,
          index: 4,
          walletUID: '010fff',
        },
      ],
      appName: 'MetaMask',
    });
  });

  it('uses safe defaults for malformed legacy state', () => {
    expect(
      normalizeGridPlusKeyringState({
        creds: {},
        accounts: ['0xabc'],
        accountIndices: ['invalid'],
        accountOpts: [{}],
        page: 'invalid',
      }),
    ).toStrictEqual({
      deviceId: null,
      deviceType: null,
      sessionKey: EXPECTED_SESSION_KEY,
      hdPath: `m/44'/60'/0'/0/x`,
      page: 0,
      unlockedAccount: 1,
      accounts: [
        {
          address: '0xabc',
          signerPath: [2147483692, 2147483708, 2147483648, 0, 0],
          hdPath: `m/44'/60'/0'/0/x`,
          index: 0,
        },
      ],
      appName: 'MetaMask',
    });
  });
});
