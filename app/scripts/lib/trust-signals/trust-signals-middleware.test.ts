import { Hex, JsonRpcResponse, Json, JsonRpcRequest } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { mockNetworkState } from '../../../../test/stub/networks';
import {
  parseApprovalTransactionData,
  parseTypedDataMessage,
} from '../../../../shared/modules/transaction.utils';
import { ResultType } from '../../../../shared/lib/trust-signals';
import { createTrustSignalsMiddleware } from './trust-signals-middleware';
import { scanAddressAndAddToCache } from './security-alerts-api';
import { getChainId } from './trust-signals-util';

jest.mock('./security-alerts-api');
jest.mock('../../../../shared/modules/transaction.utils');
process.env.SECURITY_ALERTS_API_ENABLED = 'true';

// Test constants
const TEST_ADDRESSES = {
  TO: '0x1234567890123456789012345678901234567890',
  FROM: '0xabcdef0123456789012345678901234567890123',
  SPENDER: '0x9876543210987654321098765432109876543210',
  DELEGATE: '0xfedcba9876543210fedcba9876543210fedcba98',
};

const MOCK_SCAN_RESPONSES = {
  BENIGN: {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type: ResultType.Benign,
    label: 'Good guy',
  },
  WARNING: {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type: ResultType.Warning,
    label: 'Suspicious guy',
  },
  CACHED: {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type: ResultType.Benign,
    label: 'Bad guy',
  },
};

const getPermittedAccounts = jest.fn();

const createMockRequest = (
  method: string,
  params: Json[] = [],
  origin: string = 'https://example.com',
): JsonRpcRequest & { origin?: string; networkClientId: string } => ({
  method,
  params,
  id: 1,
  jsonrpc: '2.0',
  origin,
  networkClientId: 'testNetworkClientId',
});

const createMockResponse = (): JsonRpcResponse => ({
  id: 1,
  jsonrpc: '2.0',
  result: null,
});

const createTransactionParams = (
  overrides: Partial<Record<string, unknown>> = {},
) => ({
  to: TEST_ADDRESSES.TO,
  from: TEST_ADDRESSES.FROM,
  value: '0x0',
  data: '0x',
  ...overrides,
});

const createMiddleware = (
  options: {
    chainId?: Hex | null;
  } = {},
) => {
  const { chainId } = options;

  const networkController = {
    state: {
      ...(chainId === null
        ? { providerConfig: {} } // Simulate missing chainId by having empty providerConfig
        : mockNetworkState({ chainId: chainId || CHAIN_IDS.MAINNET })),
    },
    getNetworkConfigurationByNetworkClientId: jest
      .fn()
      .mockReturnValue(
        chainId === null
          ? undefined
          : { chainId: chainId || CHAIN_IDS.MAINNET },
      ),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const appStateController = {
    addAddressSecurityAlertResponse: jest.fn(),
    getAddressSecurityAlertResponse: jest.fn(),
  };

  const phishingController = {
    scanUrl: jest.fn(),
  };

  const preferencesController = {
    state: {
      securityAlertsEnabled: true,
    },
  };

  return {
    middleware: createTrustSignalsMiddleware(
      networkController,
      appStateController as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      phishingController as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      preferencesController as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      getPermittedAccounts,
    ),
    appStateController,
    networkController,
    phishingController,
    preferencesController,
  };
};

describe('createTrustSignalsMiddleware', () => {
  const scanAddressMockAndAddToCache = jest.mocked(scanAddressAndAddToCache);
  const parseApprovalTransactionDataMock = jest.mocked(
    parseApprovalTransactionData,
  );
  const parseTypedDataMessageMock = jest.mocked(parseTypedDataMessage);
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('does not run if security alerts are disabled in preferences', async () => {
    const {
      middleware,
      preferencesController,
      appStateController,
      phishingController,
    } = createMiddleware();
    preferencesController.state.securityAlertsEnabled = false;
    const req = createMockRequest('eth_sendTransaction', [
      createTransactionParams(),
    ]);
    const res = createMockResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(scanAddressMockAndAddToCache).not.toHaveBeenCalled();
    expect(
      appStateController.getAddressSecurityAlertResponse,
    ).not.toHaveBeenCalled();
    expect(
      appStateController.addAddressSecurityAlertResponse,
    ).not.toHaveBeenCalled();
    expect(phishingController.scanUrl).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  describe('eth_sendTransaction', () => {
    it('scans a new address and caches the security alert response', async () => {
      scanAddressMockAndAddToCache.mockResolvedValue(
        MOCK_SCAN_RESPONSES.BENIGN,
      );
      const {
        middleware,
        appStateController,
        networkController,
        phishingController,
      } = createMiddleware();
      appStateController.getAddressSecurityAlertResponse.mockReturnValue(
        undefined,
      );
      const req = createMockRequest('eth_sendTransaction', [
        createTransactionParams(),
      ]);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
        TEST_ADDRESSES.TO,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        getChainId(networkController),
      );
      expect(phishingController.scanUrl).toHaveBeenCalledWith(req.origin);
      expect(next).toHaveBeenCalled();
    });

    it('does not scan when address has cached security alert response', async () => {
      scanAddressMockAndAddToCache.mockResolvedValue(
        MOCK_SCAN_RESPONSES.CACHED,
      );
      const {
        middleware,
        appStateController,
        networkController,
        phishingController,
      } = createMiddleware();
      appStateController.getAddressSecurityAlertResponse.mockReturnValue(
        MOCK_SCAN_RESPONSES.CACHED,
      );
      const req = createMockRequest('eth_sendTransaction', [
        createTransactionParams(),
      ]);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
        TEST_ADDRESSES.TO,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        getChainId(networkController),
      );
      expect(phishingController.scanUrl).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('handles scan errors gracefully without blocking the transaction', async () => {
      const error = new Error('Network error');
      scanAddressMockAndAddToCache.mockRejectedValue(error);
      const {
        middleware,
        appStateController,
        networkController,
        phishingController,
      } = createMiddleware();
      appStateController.getAddressSecurityAlertResponse.mockReturnValue(
        undefined,
      );
      const req = createMockRequest('eth_sendTransaction', [
        createTransactionParams(),
      ]);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
        TEST_ADDRESSES.TO,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        getChainId(networkController),
      );
      expect(phishingController.scanUrl).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[createTrustSignalsMiddleware] error scanning address for transaction:',
        error,
      );
    });

    it('handles timeout errors gracefully without blocking the transaction', async () => {
      const timeoutError = new DOMException(
        'The user aborted a request.',
        'AbortError',
      );
      scanAddressMockAndAddToCache.mockRejectedValue(timeoutError);
      const {
        middleware,
        appStateController,
        networkController,
        phishingController,
      } = createMiddleware();
      appStateController.getAddressSecurityAlertResponse.mockReturnValue(
        undefined,
      );

      const req = createMockRequest('eth_sendTransaction', [
        createTransactionParams(),
      ]);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
        TEST_ADDRESSES.TO,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        getChainId(networkController),
      );
      expect(phishingController.scanUrl).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('maps chain IDs to supported EVM chains correctly', async () => {
      scanAddressMockAndAddToCache.mockResolvedValue(
        MOCK_SCAN_RESPONSES.WARNING,
      );
      const {
        middleware,
        appStateController,
        networkController,
        phishingController,
      } = createMiddleware({
        chainId: CHAIN_IDS.POLYGON,
      });
      appStateController.getAddressSecurityAlertResponse.mockReturnValue(
        undefined,
      );

      const req = createMockRequest('eth_sendTransaction', [
        createTransactionParams(),
      ]);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
        TEST_ADDRESSES.TO,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        getChainId(networkController),
      );
      expect(phishingController.scanUrl).toHaveBeenCalled();
    });

    describe('edge cases', () => {
      it('does not scan when transaction has no "to" address', async () => {
        const { middleware, appStateController, phishingController } =
          createMiddleware();
        const paramsWithoutTo = {
          from: TEST_ADDRESSES.FROM,
          value: '0x0',
          data: '0x',
          // intentionally missing "to" address
        };
        const req = createMockRequest('eth_sendTransaction', [paramsWithoutTo]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(
          appStateController.getAddressSecurityAlertResponse,
        ).not.toHaveBeenCalled();
        expect(scanAddressMockAndAddToCache).not.toHaveBeenCalled();
        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('does not scan when params array is empty', async () => {
        const { middleware, phishingController } = createMiddleware();
        const req = createMockRequest('eth_sendTransaction', []);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMockAndAddToCache).not.toHaveBeenCalled();
        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('does not scan when params is not an array', async () => {
        const { middleware, phishingController } = createMiddleware();
        const req = createMockRequest('eth_sendTransaction', null as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMockAndAddToCache).not.toHaveBeenCalled();
        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('handles missing chain ID gracefully', async () => {
        const { middleware, appStateController, phishingController } =
          createMiddleware({
            chainId: null,
          });
        appStateController.getAddressSecurityAlertResponse.mockReturnValue(
          undefined,
        );

        const req = createMockRequest('eth_sendTransaction', [
          createTransactionParams(),
        ]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        // When chain ID is missing, scanAddressAndAddToCache should not be called
        // because getChainId throws an error before the call
        expect(scanAddressMockAndAddToCache).not.toHaveBeenCalled();
        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });
    });

    describe('approval transactions', () => {
      const createApprovalTransactionData = () =>
        `0x095ea7b3000000000000000000000000${TEST_ADDRESSES.SPENDER.slice(
          2,
        ).toLowerCase()}0000000000000000000000000000000000000000000000000000000000000064`;

      beforeEach(() => {
        parseApprovalTransactionDataMock.mockReturnValue({
          name: 'approve',
          spender: TEST_ADDRESSES.SPENDER as `0x${string}`,
          amountOrTokenId: undefined,
          isApproveAll: false,
          isRevokeAll: false,
          tokenAddress: undefined,
        });
      });

      it('scans both contract and spender addresses for approval transactions', async () => {
        scanAddressMockAndAddToCache.mockResolvedValue(
          MOCK_SCAN_RESPONSES.BENIGN,
        );
        const {
          middleware,
          appStateController,
          networkController,
          phishingController,
        } = createMiddleware();

        const approvalData = createApprovalTransactionData();
        const req = createMockRequest('eth_sendTransaction', [
          createTransactionParams({ data: approvalData }),
        ]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        // Should scan both the token contract (to) and the spender
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledTimes(2);
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.TO,
          appStateController.getAddressSecurityAlertResponse,
          appStateController.addAddressSecurityAlertResponse,
          getChainId(networkController),
        );
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.SPENDER,
          appStateController.getAddressSecurityAlertResponse,
          appStateController.addAddressSecurityAlertResponse,
          getChainId(networkController),
        );
        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('handles approval spender scanning errors gracefully', async () => {
        scanAddressMockAndAddToCache
          .mockResolvedValueOnce(MOCK_SCAN_RESPONSES.BENIGN) // Contract scan succeeds
          .mockRejectedValueOnce(new Error('Spender scan failed')); // Spender scan fails

        const { middleware, phishingController } = createMiddleware();

        const approvalData = createApprovalTransactionData();
        const req = createMockRequest('eth_sendTransaction', [
          createTransactionParams({ data: approvalData }),
        ]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMockAndAddToCache).toHaveBeenCalledTimes(2);
        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();

        // Wait for async error handling
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[createTrustSignalsMiddleware] error scanning spender address for approval:',
          expect.any(Error),
        );
      });

      it('does not scan spender when approval parsing fails', async () => {
        parseApprovalTransactionDataMock.mockReturnValue(undefined);
        scanAddressMockAndAddToCache.mockResolvedValue(
          MOCK_SCAN_RESPONSES.BENIGN,
        );

        const { middleware, appStateController, networkController } =
          createMiddleware();

        const req = createMockRequest('eth_sendTransaction', [
          createTransactionParams({ data: '0xinvaliddata' }),
        ]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        // Should only scan the contract address, not the spender
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledTimes(1);
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.TO,
          appStateController.getAddressSecurityAlertResponse,
          appStateController.addAddressSecurityAlertResponse,
          getChainId(networkController),
        );
        expect(next).toHaveBeenCalled();
      });

      it('does not scan spender when spender address is not present', async () => {
        parseApprovalTransactionDataMock.mockReturnValue({
          name: 'approve',
          spender: undefined, // No spender address
          amountOrTokenId: undefined,
          isApproveAll: false,
          isRevokeAll: false,
          tokenAddress: undefined,
        });
        scanAddressMockAndAddToCache.mockResolvedValue(
          MOCK_SCAN_RESPONSES.BENIGN,
        );

        const { middleware, appStateController, networkController } =
          createMiddleware();

        const approvalData = createApprovalTransactionData();
        const req = createMockRequest('eth_sendTransaction', [
          createTransactionParams({ data: approvalData }),
        ]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        // Should only scan the contract address
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledTimes(1);
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.TO,
          appStateController.getAddressSecurityAlertResponse,
          appStateController.addAddressSecurityAlertResponse,
          getChainId(networkController),
        );
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('eth_signTypedData', () => {
    const createTypedDataParams = (verifyingContract?: string) => [
      TEST_ADDRESSES.FROM,
      {
        domain: {
          name: 'Test',
          version: '1',
          chainId: 1,
          ...(verifyingContract && { verifyingContract }),
        },
        message: {
          test: 'data',
        },
      },
    ];

    beforeEach(() => {
      // Mock parseTypedDataMessage to return expected structure
      parseTypedDataMessageMock.mockImplementation((data) => {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        return {
          domain: parsedData.domain || {},
          message: parsedData.message || {},
          primaryType: parsedData.primaryType || 'Test',
          types: parsedData.types || {},
        };
      });
    });

    it('scans verifying contract address', async () => {
      scanAddressMockAndAddToCache.mockResolvedValue(
        MOCK_SCAN_RESPONSES.BENIGN,
      );
      const {
        middleware,
        appStateController,
        networkController,
        phishingController,
      } = createMiddleware();
      const req = createMockRequest(
        MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        createTypedDataParams(TEST_ADDRESSES.TO),
      );
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
        TEST_ADDRESSES.TO,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        getChainId(networkController),
      );
      expect(phishingController.scanUrl).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('handles stringified typed data params', async () => {
      scanAddressMockAndAddToCache.mockResolvedValue(
        MOCK_SCAN_RESPONSES.BENIGN,
      );
      const {
        middleware,
        appStateController,
        networkController,
        phishingController,
      } = createMiddleware();

      const typedData = {
        domain: {
          name: 'Test',
          version: '1',
          chainId: 1,
          verifyingContract: TEST_ADDRESSES.TO,
        },
        message: {
          test: 'data',
        },
      };

      const req = createMockRequest(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
        TEST_ADDRESSES.FROM,
        JSON.stringify(typedData),
      ]);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
        TEST_ADDRESSES.TO,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        getChainId(networkController),
      );
      expect(phishingController.scanUrl).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('does not scan when verifyingContract is not present', async () => {
      const { middleware, phishingController } = createMiddleware();

      const req = createMockRequest(
        MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        createTypedDataParams(), // No verifyingContract
      );
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(scanAddressMockAndAddToCache).not.toHaveBeenCalled();
      expect(phishingController.scanUrl).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('handles all eth_signTypedData variants', async () => {
      const variants = [
        MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
        MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V1,
        MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3,
        MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
      ];

      for (const method of variants) {
        scanAddressMockAndAddToCache.mockResolvedValue(
          MOCK_SCAN_RESPONSES.BENIGN,
        );
        const {
          middleware,
          appStateController,
          networkController,
          phishingController,
        } = createMiddleware();

        const req = createMockRequest(
          method,
          createTypedDataParams(TEST_ADDRESSES.TO),
        );
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.TO,
          appStateController.getAddressSecurityAlertResponse,
          appStateController.addAddressSecurityAlertResponse,
          getChainId(networkController),
        );
        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      }
    });

    it('handles invalid typed data params', async () => {
      const { middleware, phishingController } = createMiddleware();

      const invalidParamsCases = [
        [], // Empty params
        [TEST_ADDRESSES.FROM], // Only one param
        [TEST_ADDRESSES.FROM, null], // Null second param
        [TEST_ADDRESSES.FROM, undefined], // Undefined second param
      ];

      for (const params of invalidParamsCases) {
        const req = createMockRequest(
          MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
          params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        );
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMockAndAddToCache).not.toHaveBeenCalled();
        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      }
    });

    describe('permit signatures', () => {
      const createPermitTypedData = (spender?: string) => ({
        domain: {
          name: 'Test Token',
          version: '1',
          chainId: 1,
          verifyingContract: TEST_ADDRESSES.TO,
        },
        primaryType: 'Permit',
        message: {
          owner: TEST_ADDRESSES.FROM,
          spender: spender || TEST_ADDRESSES.SPENDER,
          value: 1000,
          nonce: 0,
          deadline: Math.floor(Date.now() / 1000) + 3600,
        },
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
      });

      it('scans both verifying contract and spender addresses for permit signatures', async () => {
        scanAddressMockAndAddToCache.mockResolvedValue(
          MOCK_SCAN_RESPONSES.BENIGN,
        );
        const {
          middleware,
          appStateController,
          networkController,
          phishingController,
        } = createMiddleware();

        const permitData = createPermitTypedData();
        const req = createMockRequest(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
          TEST_ADDRESSES.FROM,
          permitData,
        ]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        // Should scan both the verifying contract and the spender
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledTimes(2);
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.TO,
          appStateController.getAddressSecurityAlertResponse,
          appStateController.addAddressSecurityAlertResponse,
          getChainId(networkController),
        );
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.SPENDER,
          appStateController.getAddressSecurityAlertResponse,
          appStateController.addAddressSecurityAlertResponse,
          getChainId(networkController),
        );
        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('handles permit spender scanning errors gracefully', async () => {
        scanAddressMockAndAddToCache
          .mockResolvedValueOnce(MOCK_SCAN_RESPONSES.BENIGN) // Contract scan succeeds
          .mockRejectedValueOnce(new Error('Spender scan failed')); // Spender scan fails

        const { middleware, phishingController } = createMiddleware();

        const permitData = createPermitTypedData();
        const req = createMockRequest(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
          TEST_ADDRESSES.FROM,
          permitData,
        ]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMockAndAddToCache).toHaveBeenCalledTimes(2);
        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();

        // Wait for async error handling
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[createTrustSignalsMiddleware] error scanning spender address for permit:',
          expect.any(Error),
        );
      });

      it('does not scan spender for non-permit typed data signatures', async () => {
        scanAddressMockAndAddToCache.mockResolvedValue(
          MOCK_SCAN_RESPONSES.BENIGN,
        );
        const { middleware, appStateController, networkController } =
          createMiddleware();

        const nonPermitData = {
          domain: {
            name: 'Test',
            version: '1',
            chainId: 1,
            verifyingContract: TEST_ADDRESSES.TO,
          },
          primaryType: 'Order', // Not a permit type
          message: {
            maker: TEST_ADDRESSES.FROM,
            taker: TEST_ADDRESSES.SPENDER,
            amount: 1000,
          },
        };

        const req = createMockRequest(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
          TEST_ADDRESSES.FROM,
          nonPermitData,
        ]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        // Should only scan the verifying contract, not the spender
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledTimes(1);
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.TO,
          appStateController.getAddressSecurityAlertResponse,
          appStateController.addAddressSecurityAlertResponse,
          getChainId(networkController),
        );
        expect(next).toHaveBeenCalled();
      });

      it('does not scan spender when spender address is not present in permit', async () => {
        scanAddressMockAndAddToCache.mockResolvedValue(
          MOCK_SCAN_RESPONSES.BENIGN,
        );
        const { middleware, appStateController, networkController } =
          createMiddleware();

        const permitDataWithoutSpender = createPermitTypedData();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (permitDataWithoutSpender.message as any).spender;

        const req = createMockRequest(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
          TEST_ADDRESSES.FROM,
          permitDataWithoutSpender,
        ]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        // Should only scan the verifying contract
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledTimes(1);
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.TO,
          appStateController.getAddressSecurityAlertResponse,
          appStateController.addAddressSecurityAlertResponse,
          getChainId(networkController),
        );
        expect(next).toHaveBeenCalled();
      });

      it('handles different permit types (PermitSingle, PermitBatch)', async () => {
        const permitTypes = ['Permit', 'PermitSingle', 'PermitBatch'];

        for (const permitType of permitTypes) {
          scanAddressMockAndAddToCache.mockClear();
          scanAddressMockAndAddToCache.mockResolvedValue(
            MOCK_SCAN_RESPONSES.BENIGN,
          );

          const { middleware, appStateController, networkController } =
            createMiddleware();

          const permitData = createPermitTypedData();
          permitData.primaryType = permitType;

          const req = createMockRequest(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
            TEST_ADDRESSES.FROM,
            permitData,
          ]);
          const res = createMockResponse();
          const next = jest.fn();

          await middleware(req, res, next);

          // Should scan both addresses for all permit types
          expect(scanAddressMockAndAddToCache).toHaveBeenCalledTimes(2);
          expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
            TEST_ADDRESSES.TO,
            appStateController.getAddressSecurityAlertResponse,
            appStateController.addAddressSecurityAlertResponse,
            getChainId(networkController),
          );
          expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
            TEST_ADDRESSES.SPENDER,
            appStateController.getAddressSecurityAlertResponse,
            appStateController.addAddressSecurityAlertResponse,
            getChainId(networkController),
          );
        }
      });
    });

    describe('delegation signatures', () => {
      const createDelegationTypedData = (delegate?: string) => ({
        domain: {
          name: 'DelegationManager',
          version: '1',
          chainId: 1,
          verifyingContract: TEST_ADDRESSES.TO,
        },
        primaryType: 'Delegation',
        message: {
          delegate: delegate || TEST_ADDRESSES.DELEGATE,
          delegator: TEST_ADDRESSES.FROM,
          authority:
            '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          caveats: [],
          salt: 12345,
        },
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Caveat: [
            { name: 'enforcer', type: 'address' },
            { name: 'terms', type: 'bytes' },
          ],
          Delegation: [
            { name: 'delegate', type: 'address' },
            { name: 'delegator', type: 'address' },
            { name: 'authority', type: 'bytes32' },
            { name: 'caveats', type: 'Caveat[]' },
            { name: 'salt', type: 'uint256' },
          ],
        },
      });

      it('scans both verifying contract and delegate addresses for delegation signatures', async () => {
        scanAddressMockAndAddToCache.mockResolvedValue(
          MOCK_SCAN_RESPONSES.BENIGN,
        );
        const {
          middleware,
          appStateController,
          networkController,
          phishingController,
        } = createMiddleware();

        const delegationData = createDelegationTypedData();
        const req = createMockRequest(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
          TEST_ADDRESSES.FROM,
          delegationData,
        ]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        // Should scan both the verifying contract and the delegate
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledTimes(2);
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.TO,
          appStateController.getAddressSecurityAlertResponse,
          appStateController.addAddressSecurityAlertResponse,
          getChainId(networkController),
        );
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.DELEGATE,
          appStateController.getAddressSecurityAlertResponse,
          appStateController.addAddressSecurityAlertResponse,
          getChainId(networkController),
        );
        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('handles delegation delegate scanning errors gracefully', async () => {
        scanAddressMockAndAddToCache
          .mockResolvedValueOnce(MOCK_SCAN_RESPONSES.BENIGN) // Contract scan succeeds
          .mockRejectedValueOnce(new Error('Delegate scan failed')); // Delegate scan fails

        const { middleware, phishingController } = createMiddleware();

        const delegationData = createDelegationTypedData();
        const req = createMockRequest(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
          TEST_ADDRESSES.FROM,
          delegationData,
        ]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMockAndAddToCache).toHaveBeenCalledTimes(2);
        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();

        // Wait for async error handling
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[createTrustSignalsMiddleware] error scanning delegate address for delegation:',
          expect.any(Error),
        );
      });

      it('does not scan delegate when delegate address is not present in delegation', async () => {
        scanAddressMockAndAddToCache.mockResolvedValue(
          MOCK_SCAN_RESPONSES.BENIGN,
        );
        const { middleware, appStateController, networkController } =
          createMiddleware();

        const delegationDataWithoutDelegate = createDelegationTypedData();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (delegationDataWithoutDelegate.message as any).delegate;

        const req = createMockRequest(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
          TEST_ADDRESSES.FROM,
          delegationDataWithoutDelegate,
        ]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        // Should only scan the verifying contract
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledTimes(1);
        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.TO,
          appStateController.getAddressSecurityAlertResponse,
          appStateController.addAddressSecurityAlertResponse,
          getChainId(networkController),
        );
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('eth_request_accounts', () => {
    it('scans URL when origin is present', async () => {
      const { middleware, phishingController } = createMiddleware();
      const origin = 'https://example.com';
      const req = createMockRequest(
        MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS,
        [],
        origin,
      );
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(phishingController.scanUrl).toHaveBeenCalledWith(origin);
      expect(next).toHaveBeenCalled();
    });

    it('does not scan URL when origin is not present', async () => {
      const { middleware, phishingController } = createMiddleware();
      const req = createMockRequest(MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS);
      req.origin = undefined;
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(phishingController.scanUrl).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('wallet_request_permissions', () => {
    it('scans URL when origin is present', async () => {
      const { middleware, phishingController } = createMiddleware();
      const origin = 'https://example.com';
      const req = createMockRequest(
        MESSAGE_TYPE.WALLET_REQUEST_PERMISSIONS,
        [],
        origin,
      );
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(phishingController.scanUrl).toHaveBeenCalledWith(origin);
      expect(next).toHaveBeenCalled();
    });

    it('does not scan URL when origin is not present', async () => {
      const { middleware, phishingController } = createMiddleware();
      const req = createMockRequest(MESSAGE_TYPE.WALLET_REQUEST_PERMISSIONS);
      req.origin = undefined;
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(phishingController.scanUrl).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('eth_accounts', () => {
    describe('when user is connected', () => {
      beforeEach(() => {
        getPermittedAccounts.mockReturnValue([TEST_ADDRESSES.FROM]);
      });

      it('scans URL when origin is present', async () => {
        const { middleware, phishingController } = createMiddleware();
        const origin = 'https://example.com';
        const req = createMockRequest(MESSAGE_TYPE.ETH_ACCOUNTS, [], origin);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(phishingController.scanUrl).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('does not scan URL when origin is not present', async () => {
        const { middleware, phishingController } = createMiddleware();
        const req = createMockRequest(MESSAGE_TYPE.ETH_ACCOUNTS);
        req.origin = undefined;
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(phishingController.scanUrl).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('handles phishing scan errors gracefully', async () => {
        const { middleware, phishingController } = createMiddleware();
        const origin = 'https://malicious.com';
        const req = {
          ...createMockRequest(MESSAGE_TYPE.ETH_ACCOUNTS),
          origin,
        };
        const res = createMockResponse();
        const next = jest.fn();

        const error = new Error('Phishing scan failed');
        phishingController.scanUrl.mockRejectedValue(error);

        consoleErrorSpy.mockClear();

        await middleware(req, res, next);

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(phishingController.scanUrl).toHaveBeenCalledWith(origin);
        expect(next).toHaveBeenCalled();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[createTrustSignalsMiddleware] error:',
          error,
        );
      });
    });

    it('does not scan URL when user is not connected', async () => {
      getPermittedAccounts.mockReturnValue([]);
      const { middleware, phishingController } = createMiddleware();
      const req = createMockRequest(MESSAGE_TYPE.ETH_ACCOUNTS);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(phishingController.scanUrl).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('non-transaction methods', () => {
    it('ignores non-transaction RPC methods', async () => {
      const { middleware, appStateController } = createMiddleware();
      const req = createMockRequest('eth_getBalance', [TEST_ADDRESSES.TO]);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(
        appStateController.getAddressSecurityAlertResponse,
      ).not.toHaveBeenCalled();
      expect(scanAddressMockAndAddToCache).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
});
