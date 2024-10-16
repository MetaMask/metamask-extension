import { ethErrors } from 'eth-rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain';
import * as Multichain from '@metamask/multichain';
import {
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import { deferredPromise } from '../../util';
import * as Util from '../../util';
import { RestrictedMethods } from '../../../../../shared/constants/permissions';
import { PermissionNames } from '../../../controllers/permissions';
import { flushPromises } from '../../../../../test/lib/timer-helpers';
import requestEthereumAccounts from './request-accounts';

jest.mock('@metamask/multichain', () => ({
  ...jest.requireActual('@metamask/multichain'),
  setPermittedEthChainIds: jest.fn(),
  setEthAccounts: jest.fn(),
}));
const MockMultichain = jest.mocked(Multichain);

jest.mock('../../util', () => ({
  ...jest.requireActual('../../util'),
  shouldEmitDappViewedEvent: jest.fn(),
}));
const MockUtil = jest.mocked(Util);

const baseRequest = {
  jsonrpc: '2.0' as const,
  id: 0,
  method: 'eth_requestAccounts',
  networkClientId: 'mainnet',
  origin: 'http://test.com',
  params: [],
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const getAccounts = jest.fn().mockResolvedValue([]);
  const getUnlockPromise = jest.fn();
  const requestPermissionApprovalForOrigin = jest.fn().mockResolvedValue({
    approvedChainIds: ['0x1', '0x5'],
    approvedAccounts: ['0xdeadbeef'],
  });
  const sendMetrics = jest.fn();
  const metamaskState = {
    permissionHistory: {},
    metaMetricsId: 'metaMetricsId',
    accounts: {
      '0x1': {},
      '0x2': {},
      '0x3': {},
    },
  };
  const grantPermissions = jest.fn();
  const response: PendingJsonRpcResponse<string[]> = {
    jsonrpc: '2.0' as const,
    id: 0,
    result: undefined,
  };
  const handler = (
    request: JsonRpcRequest<JsonRpcParams> & { origin: string },
  ) =>
    requestEthereumAccounts.implementation(request, response, next, end, {
      getAccounts,
      getUnlockPromise,
      requestPermissionApprovalForOrigin,
      sendMetrics,
      metamaskState,
      grantPermissions,
    });

  return {
    response,
    next,
    end,
    getAccounts,
    getUnlockPromise,
    requestPermissionApprovalForOrigin,
    sendMetrics,
    grantPermissions,
    handler,
  };
};

describe('requestEthereumAccountsHandler', () => {
  beforeEach(() => {
    MockUtil.shouldEmitDappViewedEvent.mockReturnValue(true);
    MockMultichain.setEthAccounts.mockImplementation(
      (caveatValue) => caveatValue,
    );
    MockMultichain.setPermittedEthChainIds.mockImplementation(
      (caveatValue) => caveatValue,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('checks if there are any eip155 accounts permissioned', async () => {
    const { handler, getAccounts } = createMockedHandler();

    await handler(baseRequest);
    expect(getAccounts).toHaveBeenCalled();
  });

  describe('eip155 account permissions exist', () => {
    it('waits for the wallet to unlock', async () => {
      const { handler, getUnlockPromise, getAccounts } = createMockedHandler();
      getAccounts.mockResolvedValue(['0xdead', '0xbeef']);

      await handler(baseRequest);
      expect(getUnlockPromise).toHaveBeenCalledWith(true);
    });

    it('returns the accounts', async () => {
      const { handler, response, getAccounts } = createMockedHandler();
      getAccounts.mockResolvedValue(['0xdead', '0xbeef']);

      await handler(baseRequest);
      expect(response.result).toStrictEqual(['0xdead', '0xbeef']);
    });

    it('blocks subsequent requests if there is currently a request waiting for the wallet to be unlocked', async () => {
      const { handler, getUnlockPromise, getAccounts, end, response } =
        createMockedHandler();
      const { promise, resolve } = deferredPromise();
      getUnlockPromise.mockReturnValue(promise);
      getAccounts.mockResolvedValue(['0xdead', '0xbeef']);

      handler(baseRequest);
      expect(response).toStrictEqual({
        id: 0,
        jsonrpc: '2.0',
        result: undefined,
      });
      expect(end).not.toHaveBeenCalled();

      await flushPromises();

      await handler(baseRequest);
      expect(response.error).toStrictEqual(
        ethErrors.rpc.resourceUnavailable(
          `Already processing eth_requestAccounts. Please wait.`,
        ),
      );
      expect(end).toHaveBeenCalledTimes(1);
      resolve?.();
    });
  });

  describe('eip155 account permissions do not exist', () => {
    it('requests eth_accounts and permittedChains approval if origin is not snapId', async () => {
      const { handler, requestPermissionApprovalForOrigin } =
        createMockedHandler();

      await handler(baseRequest);
      expect(requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
        [RestrictedMethods.eth_accounts]: {},
        [PermissionNames.permittedChains]: {},
      });
    });

    it('requests eth_accounts approval if origin is snapId', async () => {
      const { handler, requestPermissionApprovalForOrigin } =
        createMockedHandler();

      await handler({ ...baseRequest, origin: 'npm:snap' });
      expect(requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
        [RestrictedMethods.eth_accounts]: {},
      });
    });

    it('throws an error if the eth_accounts and permittedChains approval is rejected', async () => {
      const { handler, requestPermissionApprovalForOrigin, end } =
        createMockedHandler();
      requestPermissionApprovalForOrigin.mockRejectedValue(
        new Error('approval rejected'),
      );

      await handler(baseRequest);
      expect(end).toHaveBeenCalledWith(new Error('approval rejected'));
    });

    it('sets the approved chainIds on an empty CAIP-25 caveat with isMultichainOrigin: false if origin is not snapId', async () => {
      const { handler } = createMockedHandler();

      await handler(baseRequest);
      expect(MockMultichain.setPermittedEthChainIds).toHaveBeenCalledWith(
        {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: false,
        },
        ['0x1', '0x5'],
      );
    });

    it('sets the approved accounts on the CAIP-25 caveat after the approved chainIds if origin is not snapId', async () => {
      const { handler } = createMockedHandler();

      MockMultichain.setPermittedEthChainIds.mockReturnValue({
        requiredScopes: {},
        optionalScopes: {},
        sessionProperties: { caveatValueWithEthChainIdsSet: true },
        isMultichainOrigin: false,
      });

      await handler(baseRequest);
      expect(MockMultichain.setEthAccounts).toHaveBeenCalledWith(
        {
          requiredScopes: {},
          optionalScopes: {},
          sessionProperties: { caveatValueWithEthChainIdsSet: true },
          isMultichainOrigin: false,
        },
        ['0xdeadbeef'],
      );
    });

    it('does not set the approved chainIds on an empty CAIP-25 caveat if origin is snapId', async () => {
      const { handler } = createMockedHandler();

      await handler({ baseRequest, origin: 'npm:snap' });
      expect(MockMultichain.setPermittedEthChainIds).not.toHaveBeenCalled();
    });

    it('sets the approved accounts on an empty CAIP-25 caveat with isMultichainOrigin: false if origin is snapId', async () => {
      const { handler } = createMockedHandler();

      await handler({ baseRequest, origin: 'npm:snap' });
      expect(MockMultichain.setEthAccounts).toHaveBeenCalledWith(
        {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: false,
        },
        ['0xdeadbeef'],
      );
    });

    it('grants a CAIP-25 permission', async () => {
      const { handler, grantPermissions } = createMockedHandler();

      MockMultichain.setEthAccounts.mockReturnValue({
        requiredScopes: {},
        optionalScopes: {},
        sessionProperties: { caveatValueWithEthAccountsSet: true },
        isMultichainOrigin: false,
      });

      await handler(baseRequest);
      expect(grantPermissions).toHaveBeenCalledWith({
        subject: {
          origin: 'http://test.com',
        },
        approvedPermissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {},
                  sessionProperties: { caveatValueWithEthAccountsSet: true },
                  isMultichainOrigin: false,
                },
              },
            ],
          },
        },
      });
    });

    it('returns the newly granted and properly ordered eth accounts', async () => {
      const { handler, getAccounts, response } = createMockedHandler();
      getAccounts
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(['0xdead', '0xbeef']);

      await handler(baseRequest);
      expect(response.result).toStrictEqual(['0xdead', '0xbeef']);
      expect(getAccounts).toHaveBeenCalledTimes(2);
    });

    it('emits the dapp viewed metrics event', async () => {
      const { handler, getAccounts, sendMetrics } = createMockedHandler();
      getAccounts
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(['0xdead', '0xbeef']);

      await handler(baseRequest);
      expect(sendMetrics).toHaveBeenCalledWith({
        category: 'inpage_provider',
        event: 'Dapp Viewed',
        properties: {
          is_first_visit: true,
          number_of_accounts: 3,
          number_of_accounts_connected: 2,
        },
        referrer: {
          url: 'http://test.com',
        },
      });
    });
  });
});
