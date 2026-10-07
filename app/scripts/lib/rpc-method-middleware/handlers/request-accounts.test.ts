import type {
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import * as UtilModule1 from '../../../../../shared/lib/add-hex-prefix';
import * as UtilModule2 from '../../../../../shared/lib/url-utils';
import * as UtilModule3 from '../../util';
import * as UtilModule4 from '../../../../../shared/lib/format-value';
import * as UtilModule5 from '../../../../../shared/lib/environment';
import * as UtilModule6 from '../../../../../shared/lib/asset-conversion-rates';
import * as UtilModule7 from '../../../../../shared/lib/environment-type';
import * as UtilModule8 from '../../install-type';
import {
  requestEthereumAccountsHandler,
  type RequestEthereumAccountsHooks,
} from './request-accounts';

const Util = {
  get addHexPrefix() {
    return UtilModule1.addHexPrefix;
  },
  get addUrlProtocolPrefix() {
    return UtilModule2.addUrlProtocolPrefix;
  },
  get checkAlarmExists() {
    return UtilModule3.checkAlarmExists;
  },
  get convertEnglishWordlistIndicesToCodepoints() {
    return UtilModule3.convertEnglishWordlistIndicesToCodepoints;
  },
  get extractRpcDomain() {
    return UtilModule3.extractRpcDomain;
  },
  get formatTxMetaForRpcResult() {
    return UtilModule3.formatTxMetaForRpcResult;
  },
  get formatValue() {
    return UtilModule4.formatValue;
  },
  get generateRandomId() {
    return UtilModule3.generateRandomId;
  },
  get getBooleanFlag() {
    return UtilModule5.getBooleanFlag;
  },
  get getChainType() {
    return UtilModule3.getChainType;
  },
  get getConversionRatesForNativeAsset() {
    return UtilModule6.getConversionRatesForNativeAsset;
  },
  get getDeviceType() {
    return UtilModule3.getDeviceType;
  },
  get getEnvironmentType() {
    return UtilModule7.getEnvironmentType;
  },
  get getInstallType() {
    return UtilModule8.getInstallType;
  },
  get getMethodDataName() {
    return UtilModule3.getMethodDataName;
  },
  get getOs() {
    return UtilModule3.getOs;
  },
  get getPlatform() {
    return UtilModule3.getPlatform;
  },
  get getValidUrl() {
    return UtilModule2.getValidUrl;
  },
  get initInstallType() {
    return UtilModule8.initInstallType;
  },
  get initializeRpcProviderDomains() {
    return UtilModule3.initializeRpcProviderDomains;
  },
  get isKnownDomain() {
    return UtilModule3.isKnownDomain;
  },
  get isPublicEndpointUrl() {
    return UtilModule3.isPublicEndpointUrl;
  },
  get isSpecialUseDomain() {
    return UtilModule3.isSpecialUseDomain;
  },
  get isValidAmount() {
    return UtilModule4.isValidAmount;
  },
  get isValidDate() {
    return UtilModule3.isValidDate;
  },
  get isValidEmail() {
    return UtilModule2.isValidEmail;
  },
  get isWebOrigin() {
    return UtilModule2.isWebOrigin;
  },
  get isWebUrl() {
    return UtilModule2.isWebUrl;
  },
  get previousValueComparator() {
    return UtilModule3.previousValueComparator;
  },
  get shouldEmitDappViewedEvent() {
    return UtilModule3.shouldEmitDappViewedEvent;
  },
};

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
    analyticsId: 'analyticsId',
    internalAccounts: {
      accounts: {
        '0x01': { address: '0x01' },
        '0x02': { address: '0x02' },
        '0x03': { address: '0x03' },
      } as unknown as RequestEthereumAccountsHooks['metamaskState']['internalAccounts']['accounts'],
      selectedAccount: '',
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
    requestEthereumAccountsHandler.implementation(
      request,
      response,
      next,
      end,
      {
        getAccounts,
        sendMetrics,
        metamaskState,
        getCaip25PermissionFromLegacyPermissionsForOrigin,
        requestPermissionsForOrigin,
      },
    );

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
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_first_visit: true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            number_of_accounts: 3,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            number_of_accounts_connected: 2,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_iframe: false,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_cross_origin_iframe: false,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            iframe_origin: null,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            top_level_origin: null,
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
