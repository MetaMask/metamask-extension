import { cloneDeep } from 'lodash';
<<<<<<< Updated upstream
import { zeroAddress } from 'ethereumjs-util';
=======
>>>>>>> Stashed changes
import { migrate, version } from './206';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

<<<<<<< Updated upstream
const ZERO_ADDRESS = zeroAddress();

describe(`migration #${VERSION}`, () => {
  it('migrate balances to 0x0 ONLY for native, ONLY for Tempo chains and FOR ALL accounts', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        TokenBalancesController: {
          tokenBalances: {
            '0xbf4ed7b27f1d666546861667caba0eecca747d7d': {
              '0x1': {
                [ZERO_ADDRESS]: '0x42',
              },
              '0x1079': {
                [ZERO_ADDRESS]: '0x0',
                '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
              },
              '0xa5bf': {
                [ZERO_ADDRESS]: '0x0',
                '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
              },
            },
            '0x13b7e6EBcd40777099E4c45d407745aB2de1D1F8': {
              '0x1': {
                [ZERO_ADDRESS]: '0x42',
              },
              '0x1079': {
                [ZERO_ADDRESS]:
                  '0x9612084f0316e0ebd5182f398e5195a51b5ca47667d4c9b26c9b26c9b26c9b2',
                '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
              },
              '0xa5bf': {
                [ZERO_ADDRESS]: '0x0',
                '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
              },
            },
            '0xd8da6bf26964af9d7eed9e03e53415d37aa96045': {
              '0x1': {
                [ZERO_ADDRESS]: '0x42',
              },
              '0x1079': {
                [ZERO_ADDRESS]:
                  '0x9612084f0316e0ebd5182f398e5195a51b5ca47667d4c9b26c9b26c9b26c9b2',
                '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
              },
              '0xa5bf': {
                [ZERO_ADDRESS]:
                  '0x9612084f0316e0ebd5182f398e5195a51b5ca47667d4c9b26c9b26c9b26c9b2',
                '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
              },
            },
          },
=======
describe(`migration #${VERSION}`, () => {
  it('resets isSignedIn from true to false', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AuthenticationController: {
          isSignedIn: true,
          srpSessionData: { 'srp-1': { token: 'cached-token' } },
>>>>>>> Stashed changes
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
<<<<<<< Updated upstream
    expect(versionedData.data.TokenBalancesController).toStrictEqual({
      tokenBalances: {
        '0xbf4ed7b27f1d666546861667caba0eecca747d7d': {
          '0x1': {
            [ZERO_ADDRESS]: '0x42',
          },
          '0x1079': {
            [ZERO_ADDRESS]: '0x0',
            '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
          },
          '0xa5bf': {
            [ZERO_ADDRESS]: '0x0',
            '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
          },
        },
        '0x13b7e6EBcd40777099E4c45d407745aB2de1D1F8': {
          '0x1': {
            [ZERO_ADDRESS]: '0x42',
          },
          '0x1079': {
            // Migrated
            [ZERO_ADDRESS]: '0x0',
            '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
          },
          '0xa5bf': {
            [ZERO_ADDRESS]: '0x0',
            '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
          },
        },
        '0xd8da6bf26964af9d7eed9e03e53415d37aa96045': {
          '0x1': {
            [ZERO_ADDRESS]: '0x42',
          },
          '0x1079': {
            // Migrated
            [ZERO_ADDRESS]: '0x0',
            '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
          },
          '0xa5bf': {
            // Migrated
            [ZERO_ADDRESS]: '0x0',
            '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
          },
        },
      },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['TokenBalancesController']),
    );
  });

  it('does not mark the controller as migrated if no change happened', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        TokenBalancesController: {
          tokenBalances: {
            '0xbf4ed7b27f1d666546861667caba0eecca747d7d': {
              '0x1': {
                [ZERO_ADDRESS]: '0x42',
              },
              '0x1079': {
                [ZERO_ADDRESS]: '0x0',
                '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
              },
              '0xa5bf': {
                [ZERO_ADDRESS]: '0x0',
                '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
              },
            },
          },
=======
    expect(versionedData.data.AuthenticationController).toStrictEqual({
      isSignedIn: false,
      srpSessionData: { 'srp-1': { token: 'cached-token' } },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['AuthenticationController']),
    );
  });

  it('preserves srpSessionData untouched', async () => {
    const srpSessionData = {
      'srp-1': { token: 'token-1', profile: { profileId: 'p1' } },
      'srp-2': { token: 'token-2', profile: { profileId: 'p2' } },
    };
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AuthenticationController: {
          isSignedIn: true,
          srpSessionData,
>>>>>>> Stashed changes
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

<<<<<<< Updated upstream
    expect(versionedData.meta.version).toBe(VERSION);
    // Same same
    expect(versionedData.data.TokenBalancesController).toStrictEqual({
      tokenBalances: {
        '0xbf4ed7b27f1d666546861667caba0eecca747d7d': {
          '0x1': {
            [ZERO_ADDRESS]: '0x42',
          },
          '0x1079': {
            [ZERO_ADDRESS]: '0x0',
            '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
          },
          '0xa5bf': {
            [ZERO_ADDRESS]: '0x0',
            '0x20c000000000000000000000b9537d11c60e8b50': '0x123',
          },
        },
      },
    });
    expect(changedControllers).toStrictEqual(new Set([]));
  });

  it('does nothing when TokenBalancesController is missing', async () => {
=======
    expect(versionedData.data.AuthenticationController).toStrictEqual({
      isSignedIn: false,
      srpSessionData,
    });
  });

  it('does nothing when AuthenticationController is missing', async () => {
>>>>>>> Stashed changes
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        SomeOtherController: {},
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

<<<<<<< Updated upstream
  it('does nothing when TokenBalancesController is of incorrect type', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        TokenBalancesController: 'I am not an object',
=======
  it('does nothing when AuthenticationController is not an object', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AuthenticationController: 'invalid',
>>>>>>> Stashed changes
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

<<<<<<< Updated upstream
  it('does nothing when tokenBalances object is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        TokenBalancesController: {
          iamNotTheTokenBalanceObject: {},
=======
  it('does nothing when isSignedIn is already false', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AuthenticationController: {
          isSignedIn: false,
          srpSessionData: {},
>>>>>>> Stashed changes
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

<<<<<<< Updated upstream
  it('does nothing when tokenBalances is of incorrect type', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        TokenBalancesController: {
          tokenBalances: 'I am not an object.',
=======
  it('does nothing when isSignedIn property is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AuthenticationController: {
          srpSessionData: {},
>>>>>>> Stashed changes
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });
});
