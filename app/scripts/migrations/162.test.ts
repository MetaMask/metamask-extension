import { createMockInternalAccount } from '../../../test/jest/mocks';
import { migrate, version } from './162';

const oldVersion = 161;

describe(`migration #${version}`, () => {
  beforeEach(() => {
    global.sentry = { captureException: jest.fn() };
  });

  afterEach(() => {
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe(`migration #${version}`, () => {
    it('logs an error and returns the original state if TokensController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {},
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).toHaveBeenCalledWith(
        new Error(`Migration ${version}: TokensController not found.`),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('logs an error and returns the original state if AccountsController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: {},
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).toHaveBeenCalledWith(
        new Error(`Migration ${version}: AccountsController not found.`),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('returns the original state if TokenBalancesController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: {},
          AccountsController: {},
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('logs an error and returns the original state if TokensController is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: 'not an object',
          AccountsController: {},
          TokenBalancesController: {},
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: TokensController is type 'string', expected object.`,
        ),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('logs an error and returns the original state if AccountsController is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: {},
          AccountsController: 'not an object',
          TokenBalancesController: {},
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: AccountsController is type 'string', expected object.`,
        ),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('does not remove any tokens from state if all accounts in TokensController state exist in AccountsController state', async () => {
      const mockInternalAccount = createMockInternalAccount();
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokenBalancesController: {
            tokenBalances: {
              [mockInternalAccount.address]: {
                '0x1': {
                  '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
                    balance: '0x5',
                  },
                },
              },
            },
          },
          TokensController: {
            allTokens: {
              '0x1': {
                [mockInternalAccount.address]: [
                  {
                    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                    aggregators: [],
                    decimals: 18,
                    image:
                      'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
                    name: 'Dai',
                    symbol: 'DAI',
                  },
                ],
              },
            },
          },
          AccountsController: {
            internalAccounts: {
              accounts: {
                [mockInternalAccount.id]: mockInternalAccount,
              },
              selectedAccount: mockInternalAccount.id,
            },
          },
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('does remove any tokens from state if the related account in TokensController state does not exist in AccountsController state', async () => {
      const mockInternalAccount = createMockInternalAccount();
      const testAccountAddress = '0xtestAddress';
      const testBalanceValue = '0x1495acd1c2';

      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokenBalancesController: {
            tokenBalances: {
              [mockInternalAccount.address]: {
                '0x1': {
                  '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
                    balance: testBalanceValue,
                  },
                },
              },
              [testAccountAddress]: {
                '0x1': {
                  '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
                    balance: testBalanceValue,
                  },
                  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
                    balance: testBalanceValue,
                  },
                },
              },
            },
          },
          TokensController: {
            allTokens: {
              '0x1': {
                [mockInternalAccount.address]: [
                  {
                    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                    aggregators: [],
                    decimals: 18,
                    image:
                      'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
                    name: 'Dai',
                    symbol: 'DAI',
                  },
                ],
                Oxacc1: [
                  {
                    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                    aggregators: [],
                    decimals: 18,
                    image:
                      'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
                    name: 'Dai',
                    symbol: 'DAI',
                  },
                  {
                    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                    aggregators: [],
                    decimals: 6,
                    image:
                      'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
                    name: 'USDC',
                    symbol: 'USDC',
                  },
                ],
              },
            },
            allIgnoredTokens: {
              '0x1': {
                Oxacc1: [],
                [mockInternalAccount.address]: [],
              },
            },
            allDetectedTokens: {
              '0x1': {
                Oxacc1: [],
                [mockInternalAccount.address]: [],
              },
            },
          },
          AccountsController: {
            internalAccounts: {
              accounts: {
                [mockInternalAccount.id]: mockInternalAccount,
              },
              selectedAccount: mockInternalAccount.id,
            },
          },
        },
      };

      const newStorage = await migrate(oldStorage);

      const expectedData = {
        TokenBalancesController: {
          tokenBalances: {
            [mockInternalAccount.address]: {
              '0x1': {
                '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
                  balance: testBalanceValue,
                },
              },
            },
          },
        },
        TokensController: {
          allTokens: {
            '0x1': {
              [mockInternalAccount.address]: [
                {
                  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                  aggregators: [],
                  decimals: 18,
                  image:
                    'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
                  name: 'Dai',
                  symbol: 'DAI',
                },
              ],
            },
          },
          allIgnoredTokens: {
            '0x1': {
              [mockInternalAccount.address]: [],
            },
          },
          allDetectedTokens: {
            '0x1': {
              [mockInternalAccount.address]: [],
            },
          },
        },
        AccountsController: {
          internalAccounts: {
            accounts: {
              [mockInternalAccount.id]: mockInternalAccount,
            },
            selectedAccount: mockInternalAccount.id,
          },
        },
      };

      expect(newStorage.meta).toStrictEqual({ version });
      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
