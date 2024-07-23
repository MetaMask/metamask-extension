import { ethErrors } from 'eth-rpc-errors';
import { deferredPromise } from '../../util';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../../multichain-api/caip25permissions';
import requestEthereumAccounts from './request-accounts';

jest.mock('../../util', () => ({
  ...jest.requireActual('../../util'),
  shouldEmitDappViewedEvent: jest.fn(),
}));

const baseRequest = {
  origin: 'http://test.com',
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const getAccounts = jest.fn().mockResolvedValue(['0xdead', '0xbeef']);
  const getUnlockPromise = jest.fn();
  const hasPermission = jest.fn();
  const requestAccountsPermission = jest.fn();
  const sendMetrics = jest.fn();
  const getPermissionsForOrigin = jest.fn().mockReturnValue({
    eth_accounts: {
      caveats: [
        {
          value: ['0xdead', '0xbeef'],
        },
      ],
    },
  });
  const metamaskState = {
    permissionHistory: {},
    metaMetricsId: 'metaMetricsId',
  };
  const grantPermissions = jest.fn();
  const getNetworkConfigurationByNetworkClientId = jest.fn().mockReturnValue({
    chainId: '0x1',
  });
  const response = {};
  const handler = (request) =>
    requestEthereumAccounts.implementation(request, response, next, end, {
      getAccounts,
      getUnlockPromise,
      hasPermission,
      requestAccountsPermission,
      sendMetrics,
      getPermissionsForOrigin,
      metamaskState,
      grantPermissions,
      getNetworkConfigurationByNetworkClientId,
    });

  return {
    response,
    next,
    end,
    getAccounts,
    getUnlockPromise,
    hasPermission,
    requestAccountsPermission,
    sendMetrics,
    getPermissionsForOrigin,
    grantPermissions,
    getNetworkConfigurationByNetworkClientId,
    handler,
  };
};

describe('requestEthereumAccountsHandler', () => {
  beforeAll(() => {
    delete process.env.BARAD_DUR;
  });

  it('checks if the eth_accounts permission exists', async () => {
    const { handler, hasPermission } = createMockedHandler();

    try {
      await handler(baseRequest);
    } catch (err) {
      // noop
    }

    expect(hasPermission).toHaveBeenCalledWith('eth_accounts');
  });

  describe('eth_account permission exists', () => {
    it('waits for the wallet to unlock', async () => {
      const { handler, hasPermission, getUnlockPromise } =
        createMockedHandler();
      hasPermission.mockReturnValue(true);

      await handler(baseRequest);
      expect(getUnlockPromise).toHaveBeenCalledWith(true);
    });

    it('gets accounts from the eth_accounts permission', async () => {
      const { handler, hasPermission, getAccounts } = createMockedHandler();
      hasPermission.mockReturnValue(true);

      await handler(baseRequest);
      expect(getAccounts).toHaveBeenCalled();
    });

    it('returns the accounts', async () => {
      const { handler, hasPermission, response } = createMockedHandler();
      hasPermission.mockReturnValue(true);

      await handler(baseRequest);
      expect(response.result).toStrictEqual(['0xdead', '0xbeef']);
    });

    it('blocks subsequent requests if there is currently a request waiting for the wallet to be unlocked', async () => {
      const { handler, hasPermission, getUnlockPromise, end, response } =
        createMockedHandler();
      hasPermission.mockReturnValue(true);
      const { promise, resolve } = deferredPromise();
      getUnlockPromise.mockReturnValue(promise);

      handler(baseRequest);
      expect(response).toStrictEqual({});
      expect(end).not.toHaveBeenCalled();

      await handler(baseRequest);
      expect(response.error).toStrictEqual(
        ethErrors.rpc.resourceUnavailable(
          `Already processing eth_requestAccounts. Please wait.`,
        ),
      );
      expect(end).toHaveBeenCalledTimes(1);
      resolve();
    });
  });

  describe('eth_account permission does not exist', () => {
    it('requests the accounts permission', async () => {
      const { handler, requestAccountsPermission } = createMockedHandler();

      try {
        await handler(baseRequest);
      } catch (err) {
        // noop
      }
      expect(requestAccountsPermission).toHaveBeenCalled();
    });

    it('gets the permitted accounts', async () => {
      const { handler, getAccounts } = createMockedHandler();

      try {
        await handler(baseRequest);
      } catch (err) {
        // noop
      }
      expect(getAccounts).toHaveBeenCalled();
    });

    it('returns the permitted accounts', async () => {
      const { handler, response } = createMockedHandler();

      await handler(baseRequest);
      expect(response.result).toStrictEqual(['0xdead', '0xbeef']);
    });

    it.todo('emits the dapp viewed metrics event');

    it('does not grant a CAIP-25 endowment if the BARAD_DUR flag is not set', async () => {
      delete process.env.BARAD_DUR;
      const { handler, grantPermissions, end } = createMockedHandler();

      await handler(baseRequest);
      expect(grantPermissions).not.toHaveBeenCalled();
      expect(end).toHaveBeenCalled();
    });

    it('grants a CAIP-25 endowment as an optional scope for the chain using the permitted accounts if the BARAD_DUR flag is set', async () => {
      process.env.BARAD_DUR = 1;
      const { handler, grantPermissions } = createMockedHandler();

      await handler(baseRequest);
      expect(grantPermissions).toHaveBeenCalledWith({
        subject: { origin: 'http://test.com' },
        approvedPermissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'eip155:1': {
                      methods: [],
                      notifications: [],
                      accounts: ['eip155:1:0xdead', 'eip155:1:0xbeef'],
                    },
                  },
                },
              },
            ],
          },
        },
      });
    });
  });
});
