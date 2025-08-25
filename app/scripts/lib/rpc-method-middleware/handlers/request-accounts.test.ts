import {
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import * as Util from '../../util';
import type { FlattenedBackgroundStateProxy } from '../../../../../shared/types';
import requestEthereumAccounts from './request-accounts';

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
  const getAccounts = jest.fn().mockReturnValue([]);
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
  const getCaip25PermissionFromLegacyPermissionsForOrigin = jest
    .fn()
    .mockResolvedValue({});
  const requestPermissionsForOrigin = jest.fn().mockReturnValue({});
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
      sendMetrics,
      metamaskState: metamaskState as unknown as FlattenedBackgroundStateProxy,
      getCaip25PermissionFromLegacyPermissionsForOrigin,
      requestPermissionsForOrigin,
    });

  return {
    response,
    next,
    end,
    getAccounts,
    sendMetrics,
    metamaskState,
    getCaip25PermissionFromLegacyPermissionsForOrigin,
    requestPermissionsForOrigin,
    handler,
  };
};

describe('requestEthereumAccountsHandler', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('checks if there are any eip155 accounts permissioned', async () => {
    const { handler, getAccounts } = createMockedHandler();

    await handler(baseRequest);
    expect(getAccounts).toHaveBeenCalled();
  });

  describe('eip155 account permissions exist', () => {
    it('returns the accounts', async () => {
      const { handler, response, getAccounts } = createMockedHandler();
      getAccounts.mockReturnValue(['0xdead', '0xbeef']);

      await handler(baseRequest);
      expect(response.result).toStrictEqual(['0xdead', '0xbeef']);
    });
  });

  describe('eip155 account permissions do not exist', () => {
    it('gets the CAIP-25 permission object to request approval for', async () => {
      const { handler, getCaip25PermissionFromLegacyPermissionsForOrigin } =
        createMockedHandler();

      await handler({ ...baseRequest, origin: 'http://test.com' });
      expect(
        getCaip25PermissionFromLegacyPermissionsForOrigin,
      ).toHaveBeenCalledWith();
    });

    it('throws an error if the CAIP-25 approval is rejected', async () => {
      const { handler, requestPermissionsForOrigin, end } =
        createMockedHandler();
      requestPermissionsForOrigin.mockRejectedValue(
        new Error('approval rejected'),
      );

      await handler(baseRequest);
      expect(end).toHaveBeenCalledWith(new Error('approval rejected'));
    });

    it('grants the CAIP-25 approval', async () => {
      const {
        handler,
        getCaip25PermissionFromLegacyPermissionsForOrigin,
        requestPermissionsForOrigin,
      } = createMockedHandler();

      getCaip25PermissionFromLegacyPermissionsForOrigin.mockReturnValue({
        foo: 'bar',
      });

      await handler({ ...baseRequest, origin: 'http://test.com' });
      expect(requestPermissionsForOrigin).toHaveBeenCalledWith({ foo: 'bar' });
    });

    it('returns the newly granted and properly ordered eth accounts', async () => {
      const { handler, getAccounts, response } = createMockedHandler();
      getAccounts
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['0xdead', '0xbeef']);

      await handler(baseRequest);
      expect(response.result).toStrictEqual(['0xdead', '0xbeef']);
      expect(getAccounts).toHaveBeenCalledTimes(2);
    });

    it('emits the dapp viewed metrics event when shouldEmitDappViewedEvent returns true', async () => {
      const { handler, getAccounts, sendMetrics } = createMockedHandler();
      getAccounts
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['0xdead', '0xbeef']);
      MockUtil.shouldEmitDappViewedEvent.mockReturnValue(true);

      await handler(baseRequest);
      expect(sendMetrics).toHaveBeenCalledWith(
        {
          category: 'inpage_provider',
          event: 'Dapp Viewed',
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_first_visit: true,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            number_of_accounts: 3,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            number_of_accounts_connected: 2,
          },
          referrer: {
            url: 'http://test.com',
          },
        },
        {
          excludeMetaMetricsId: true,
        },
      );
    });

    it('does not emit the dapp viewed metrics event when shouldEmitDappViewedEvent returns false', async () => {
      const { handler, getAccounts, sendMetrics } = createMockedHandler();
      getAccounts
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['0xdead', '0xbeef']);
      MockUtil.shouldEmitDappViewedEvent.mockReturnValue(false);

      await handler(baseRequest);
      expect(sendMetrics).not.toHaveBeenCalled();
    });
  });
});
