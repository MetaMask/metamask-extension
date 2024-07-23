import { ethErrors } from 'eth-rpc-errors';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../../multichain-api/caip25permissions';
import { deferredPromise } from '../../util';
import requestEthereumAccounts from './request-accounts';

const baseRequest = {
  origin: 'http://test.com',
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const getAccounts = jest.fn().mockResolvedValue(['0xdead', '0xbeef']);
  const getUnlockPromise = jest.fn()
  const hasPermission = jest.fn()
  const requestAccountsPermission = jest.fn()
  const sendMetrics = jest.fn()
  const getPermissionsForOrigin = jest.fn()
  const metamaskState = jest.fn()
  const grantPermissions = jest.fn()
  const getNetworkConfigurationByNetworkClientId = jest.fn()
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
    metamaskState,
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
    const { handler, hasPermission } = createMockedHandler()

    try {
      await handler(baseRequest)
    } catch(err) {
      //noop
    }

    expect(hasPermission).toHaveBeenCalledWith('eth_accounts')
  })

  it('blocks subsequent requests if eth_accounts permission exists but in a previous request the wallet has not been unlocked yet', async () => {
    const { handler, hasPermission, getUnlockPromise, end, response } = createMockedHandler()

    hasPermission.mockReturnValue(true)
    const { promise, resolve, reject } = deferredPromise()
    getUnlockPromise.mockReturnValue(promise)

    handler(baseRequest)
    expect(response).toStrictEqual({})
    expect(end).not.toHaveBeenCalled()

    await handler(baseRequest)
    expect(response.error).toStrictEqual(
      ethErrors.rpc.resourceUnavailable(
        `Already processing eth_requestAccounts. Please wait.`,
      )
    )
    expect(end).toHaveBeenCalledTimes(1)
    resolve()
  })

  // describe('BARAD_DUR flag is not set', () => {

  //   it('gets accounts from the eth_accounts permission', async () => {
  //     const { handler, getAccounts } = createMockedHandler();

  //     await handler(baseRequest);
  //     expect(getAccounts).toHaveBeenCalled();
  //   });

  //   it('returns the accounts', async () => {
  //     const { handler, response } = createMockedHandler();

  //     await handler(baseRequest);
  //     expect(response.result).toStrictEqual(['0xdead', '0xbeef']);
  //   });
  // });

  // describe('BARAD_DUR flag is set', () => {
  //   beforeAll(() => {
  //     process.env.BARAD_DUR = 1;
  //   });

  //   it('gets the CAIP-25 authorized scopes caveat', async () => {
  //     const { handler, getCaveat } = createMockedHandler();

  //     await handler(baseRequest);
  //     expect(getCaveat).toHaveBeenCalledWith(
  //       'http://test.com',
  //       Caip25EndowmentPermissionName,
  //       Caip25CaveatType,
  //     );
  //   });

  //   it('returns an empty array if the permission does not exist', async () => {
  //     const { handler, getCaveat, response } = createMockedHandler();

  //     getCaveat.mockImplementation(() => {
  //       throw new Error('permission does not exist');
  //     });

  //     await handler(baseRequest);
  //     expect(response.result).toStrictEqual([]);
  //   });

  //   it('returns an empty array if the caveat does not exist', async () => {
  //     const { handler, getCaveat, response } = createMockedHandler();

  //     getCaveat.mockReturnValue(undefined);

  //     await handler(baseRequest);
  //     expect(response.result).toStrictEqual([]);
  //   });

  //   it('returns an array of unique hex addresses from the eip155 namespaced scopes', async () => {
  //     const { handler, getCaveat, response } = createMockedHandler();

  //     getCaveat.mockReturnValue({
  //       value: {
  //         requiredScopes: {
  //           'eip155:1': {
  //             methods: [],
  //             notifications: [],
  //             accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
  //           },
  //           'eip155:5': {
  //             methods: [],
  //             notifications: [],
  //             accounts: ['eip155:5:0x1', 'eip155:5:0x3'],
  //           },
  //         },
  //         optionalScopes: {
  //           'eip155:1': {
  //             methods: [],
  //             notifications: [],
  //             accounts: ['eip155:1:0xdeadbeef'],
  //           },
  //         },
  //       },
  //     });

  //     await handler(baseRequest);
  //     expect(response.result).toStrictEqual([
  //       '0x1',
  //       '0x2',
  //       '0xdeadbeef',
  //       '0x3',
  //     ]);
  //   });
  // });
});
