import { Hex, JsonRpcResponse, Json, JsonRpcRequest } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { mockNetworkState } from '../../../../test/stub/networks';
import { createTrustSignalsMiddleware } from './trust-signals-middleware';
import { scanAddressAndAddToCache } from './security-alerts-api';
import { ResultType } from './types';
import { getChainId } from './trust-signals-util';

jest.mock('./security-alerts-api');
process.env.SECURITY_ALERTS_API_ENABLED = 'true';

// Test constants
const TEST_ADDRESSES = {
  TO: '0x1234567890123456789012345678901234567890',
  FROM: '0xabcdef0123456789012345678901234567890123',
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
): JsonRpcRequest & { origin?: string } => ({
  method,
  params,
  id: 1,
  jsonrpc: '2.0',
  origin,
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
