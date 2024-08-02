import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../../multichain-api/caip25permissions';
import ethereumAccounts from './eth-accounts';

const baseRequest = {
  origin: 'http://test.com',
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const getAccounts = jest.fn().mockResolvedValue(['0xdead', '0xbeef']);
  const getCaveat = jest.fn().mockReturnValue(
    Object.freeze({
      value: {
        requiredScopes: {},
        optionalScopes: {},
      },
    }),
  );
  const response = {};
  const handler = (request) =>
    ethereumAccounts.implementation(request, response, next, end, {
      getAccounts,
      getCaveat,
    });

  return {
    response,
    next,
    end,
    getAccounts,
    getCaveat,
    handler,
  };
};

describe('ethAccountsHandler', () => {
  describe('BARAD_DUR flag is not set', () => {
    beforeAll(() => {
      delete process.env.BARAD_DUR;
    });

    it('gets accounts from the eth_accounts permission', async () => {
      const { handler, getAccounts } = createMockedHandler();

      await handler(baseRequest);
      expect(getAccounts).toHaveBeenCalled();
    });

    it('returns the accounts', async () => {
      const { handler, response } = createMockedHandler();

      await handler(baseRequest);
      expect(response.result).toStrictEqual(['0xdead', '0xbeef']);
    });
  });

  describe('BARAD_DUR flag is set', () => {
    beforeAll(() => {
      process.env.BARAD_DUR = 1;
    });

    it('gets the CAIP-25 authorized scopes caveat', async () => {
      const { handler, getCaveat } = createMockedHandler();

      await handler(baseRequest);
      expect(getCaveat).toHaveBeenCalledWith(
        'http://test.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    });

    it('returns an empty array if the permission does not exist', async () => {
      const { handler, getCaveat, response } = createMockedHandler();

      getCaveat.mockImplementation(() => {
        throw new Error('permission does not exist');
      });

      await handler(baseRequest);
      expect(response.result).toStrictEqual([]);
    });

    it('returns an empty array if the caveat does not exist', async () => {
      const { handler, getCaveat, response } = createMockedHandler();

      getCaveat.mockReturnValue(undefined);

      await handler(baseRequest);
      expect(response.result).toStrictEqual([]);
    });

    it('returns an array of unique hex addresses from the eip155 namespaced scopes', async () => {
      const { handler, getCaveat, response } = createMockedHandler();

      getCaveat.mockReturnValue(
        Object.freeze({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
              },
              'eip155:5': {
                methods: [],
                notifications: [],
                accounts: ['eip155:5:0x1', 'eip155:5:0x3'],
              },
            },
            optionalScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0xdeadbeef'],
              },
            },
          },
        }),
      );

      await handler(baseRequest);
      expect(response.result).toStrictEqual([
        '0x1',
        '0x2',
        '0xdeadbeef',
        '0x3',
      ]);
    });
  });
});
