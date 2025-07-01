import { Hex, JsonRpcResponse, Json, JsonRpcRequest } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { mockNetworkState } from '../../../../test/stub/networks';
import { createTrustSignalsMiddleware } from './trust-signals-middleware';
import { scanAddressAndAddToCache } from './security-alerts-api';
import { ResultType } from './types';

jest.mock('./security-alerts-api');
process.env.TRUST_SIGNALS_PROD_ENABLED = 'true';
process.env.SECURITY_ALERTS_API_ENABLED = 'true';

// Test constants
const TEST_ADDRESSES = {
  TO: '0x1234567890123456789012345678901234567890',
  FROM: '0xabcdef0123456789012345678901234567890123',
};

const MOCK_SCAN_RESPONSES = {
  BENIGN: {
    result_type: ResultType.Benign,
    label: 'Good guy',
  },
  WARNING: {
    result_type: ResultType.Warning,
    label: 'Suspicious guy',
  },
  CACHED: {
    result_type: ResultType.Benign,
    label: 'Bad guy',
  },
};

const createMockRequest = (
  method: string,
  params: Json[] = [],
): JsonRpcRequest => ({
  method,
  params,
  id: 1,
  jsonrpc: '2.0',
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
    ),
    appStateController,
    networkController,
    phishingController,
    preferencesController,
  };
};

describe('TrustSignalsMiddleware', () => {
  const scanAddressMockAndAddToCache = jest.mocked(scanAddressAndAddToCache);
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should not run if security alerts are disabled in preferences', async () => {
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
    it('should scan a new address and cache the security alert response', async () => {
      scanAddressMockAndAddToCache.mockResolvedValue(
        MOCK_SCAN_RESPONSES.BENIGN,
      );
      const { middleware, appStateController, networkController } =
        createMiddleware();
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
        appStateController,
        networkController,
      );
      expect(next).toHaveBeenCalled();
    });

    it('should skip scanning when address has cached security alert response', async () => {
      scanAddressMockAndAddToCache.mockResolvedValue(
        MOCK_SCAN_RESPONSES.CACHED,
      );
      const { middleware, appStateController, networkController } =
        createMiddleware();
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
        appStateController,
        networkController,
      );
      expect(next).toHaveBeenCalled();
    });

    it('should handle scan errors gracefully without blocking the transaction', async () => {
      const error = new Error('Network error');
      scanAddressMockAndAddToCache.mockRejectedValue(error);
      const { middleware, appStateController, networkController } =
        createMiddleware();
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
        appStateController,
        networkController,
      );
      expect(next).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[createTrustSignalsMiddleware] error: ',
        error,
      );
    });

    it('should handle timeout errors gracefully without blocking the transaction', async () => {
      const timeoutError = new DOMException(
        'The user aborted a request.',
        'AbortError',
      );
      scanAddressMockAndAddToCache.mockRejectedValue(timeoutError);
      const { middleware, appStateController, networkController } =
        createMiddleware();
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
        appStateController,
        networkController,
      );
      expect(next).toHaveBeenCalled();
    });

    it('should map chain IDs to supported EVM chains correctly', async () => {
      scanAddressMockAndAddToCache.mockResolvedValue(
        MOCK_SCAN_RESPONSES.WARNING,
      );
      const { middleware, appStateController, networkController } =
        createMiddleware({
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
        appStateController,
        networkController,
      );
    });

    describe('edge cases', () => {
      it('should skip processing when transaction has no "to" address', async () => {
        const { middleware, appStateController } = createMiddleware();
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
        expect(next).toHaveBeenCalled();
      });

      it('should skip processing when params array is empty', async () => {
        const { middleware } = createMiddleware();
        const req = createMockRequest('eth_sendTransaction', []);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMockAndAddToCache).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('should skip processing when params is not an array', async () => {
        const { middleware } = createMiddleware();
        const req = createMockRequest('eth_sendTransaction', null as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMockAndAddToCache).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('should handle missing chain ID gracefully', async () => {
        const error = new Error('Chain ID not found');
        scanAddressMockAndAddToCache.mockRejectedValue(error);
        const { middleware, appStateController, networkController } =
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

        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.TO,
          appStateController,
          networkController,
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

    it('should scan verifying contract address', async () => {
      scanAddressMockAndAddToCache.mockResolvedValue(
        MOCK_SCAN_RESPONSES.BENIGN,
      );
      const { middleware, appStateController, networkController } =
        createMiddleware();

      const req = createMockRequest(
        MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        createTypedDataParams(TEST_ADDRESSES.TO),
      );
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
        TEST_ADDRESSES.TO,
        appStateController,
        networkController,
      );
      expect(next).toHaveBeenCalled();
    });

    it('should handle stringified typed data params', async () => {
      scanAddressMockAndAddToCache.mockResolvedValue(
        MOCK_SCAN_RESPONSES.BENIGN,
      );
      const { middleware, appStateController, networkController } =
        createMiddleware();

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
        appStateController,
        networkController,
      );
      expect(next).toHaveBeenCalled();
    });

    it('should skip scanning when verifyingContract is not present', async () => {
      const { middleware } = createMiddleware();

      const req = createMockRequest(
        MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        createTypedDataParams(), // No verifyingContract
      );
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(scanAddressMockAndAddToCache).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle all eth_signTypedData variants', async () => {
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
        const { middleware, appStateController, networkController } =
          createMiddleware();

        const req = createMockRequest(
          method,
          createTypedDataParams(TEST_ADDRESSES.TO),
        );
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMockAndAddToCache).toHaveBeenCalledWith(
          TEST_ADDRESSES.TO,
          appStateController,
          networkController,
        );
        expect(next).toHaveBeenCalled();
      }
    });

    it('should handle invalid typed data params', async () => {
      const { middleware } = createMiddleware();

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
        expect(next).toHaveBeenCalled();
      }
    });
  });

  describe('eth_accounts', () => {
    it('should scan URL when mainFrameOrigin is present', async () => {
      const { middleware, phishingController } = createMiddleware();
      const mainFrameOrigin = 'https://example.com';
      const req = {
        ...createMockRequest(MESSAGE_TYPE.ETH_ACCOUNTS),
        mainFrameOrigin,
      };
      const res = createMockResponse();
      const next = jest.fn();

      phishingController.scanUrl.mockResolvedValue({
        result_type: 'benign',
        label: 'Safe site',
      });

      await middleware(req, res, next);

      expect(phishingController.scanUrl).toHaveBeenCalledWith(mainFrameOrigin);
      expect(next).toHaveBeenCalled();
    });

    it('should not scan URL when mainFrameOrigin is not present', async () => {
      const { middleware, phishingController } = createMiddleware();
      const req = createMockRequest(MESSAGE_TYPE.ETH_ACCOUNTS);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(phishingController.scanUrl).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle phishing scan errors gracefully', async () => {
      const { middleware, phishingController } = createMiddleware();
      const mainFrameOrigin = 'https://malicious.com';
      const req = {
        ...createMockRequest(MESSAGE_TYPE.ETH_ACCOUNTS),
        mainFrameOrigin,
      };
      const res = createMockResponse();
      const next = jest.fn();

      const error = new Error('Phishing scan failed');
      phishingController.scanUrl.mockRejectedValue(error);

      consoleErrorSpy.mockClear();

      await middleware(req, res, next);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(phishingController.scanUrl).toHaveBeenCalledWith(mainFrameOrigin);
      expect(next).toHaveBeenCalled();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[createTrustSignalsMiddleware] error:',
        error,
      );
    });
  });

  describe('non-transaction methods', () => {
    it('should ignore non-transaction RPC methods', async () => {
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
