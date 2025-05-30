import { Hex, JsonRpcParams, JsonRpcResponse } from '@metamask/utils';
import { NetworkController } from '@metamask/network-controller';
import { AppStateController } from '../../controllers/app-state-controller';
import { createTrustSignalsMiddleware } from './trust-signals-middleware';
import { scanAddress } from './security-alerts-api';
import { SupportedEVMChain, ResultType } from './types';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';

jest.mock('./security-alerts-api');

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

// Helper functions
const createMockRequest = (
  method: string,
  params: any[] = []
): JsonRpcParams => ({
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

const createTransactionParams = (overrides: Partial<any> = {}) => ({
  to: TEST_ADDRESSES.TO,
  from: TEST_ADDRESSES.FROM,
  value: '0x0',
  data: '0x',
  ...overrides,
});

const createMiddleware = (options: {
  chainId?: Hex | null;
} = {}) => {
  const { chainId } = options;

  const networkController = {
    state: {
      ...(chainId !== null
        ? mockNetworkState({ chainId: chainId || CHAIN_IDS.MAINNET })
        : { providerConfig: {} }  // Simulate missing chainId by having empty providerConfig
      ),
    },
  } as any;

  const appStateController = {
    addAddressSecurityAlertResponse: jest.fn(),
    getAddressSecurityAlertResponse: jest.fn(),
  };

  return {
    middleware: createTrustSignalsMiddleware(networkController, appStateController as any),
    appStateController,
    networkController,
  };
}

describe('TrustSignalsMiddleware', () => {
  const scanAddressMock = jest.mocked(scanAddress);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('eth_sendTransaction', () => {
    it('should scan a new address and cache the security alert response', async () => {
      scanAddressMock.mockResolvedValue(MOCK_SCAN_RESPONSES.BENIGN);
      const { middleware, appStateController } = createMiddleware();
      appStateController.getAddressSecurityAlertResponse.mockReturnValue(undefined);

      const req = createMockRequest('eth_sendTransaction', [createTransactionParams()]);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(appStateController.getAddressSecurityAlertResponse).toHaveBeenCalledWith(TEST_ADDRESSES.TO);
      expect(scanAddressMock).toHaveBeenCalledWith(SupportedEVMChain.Ethereum, TEST_ADDRESSES.TO);
      expect(appStateController.addAddressSecurityAlertResponse).toHaveBeenCalledWith(
        TEST_ADDRESSES.TO,
        MOCK_SCAN_RESPONSES.BENIGN
      );
      expect(next).toHaveBeenCalled();
    });

    it('should skip scanning when address has cached security alert response', async () => {
      const { middleware, appStateController } = createMiddleware();
      appStateController.getAddressSecurityAlertResponse.mockReturnValue(MOCK_SCAN_RESPONSES.CACHED);

      const req = createMockRequest('eth_sendTransaction', [createTransactionParams()]);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(appStateController.getAddressSecurityAlertResponse).toHaveBeenCalledWith(TEST_ADDRESSES.TO);
      expect(scanAddressMock).not.toHaveBeenCalled();
      expect(appStateController.addAddressSecurityAlertResponse).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle scan errors gracefully without blocking the transaction', async () => {
      const error = new Error('Network error');
      scanAddressMock.mockRejectedValue(error);
      const { middleware, appStateController } = createMiddleware();
      appStateController.getAddressSecurityAlertResponse.mockReturnValue(undefined);

      const req = createMockRequest('eth_sendTransaction', [createTransactionParams()]);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(scanAddressMock).toHaveBeenCalledWith(SupportedEVMChain.Ethereum, TEST_ADDRESSES.TO);
      expect(appStateController.addAddressSecurityAlertResponse).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should map chain IDs to supported EVM chains correctly', async () => {
      scanAddressMock.mockResolvedValue(MOCK_SCAN_RESPONSES.WARNING);
      const { middleware, appStateController } = createMiddleware({
        chainId: CHAIN_IDS.POLYGON,
      });
      appStateController.getAddressSecurityAlertResponse.mockReturnValue(undefined);

      const req = createMockRequest('eth_sendTransaction', [createTransactionParams()]);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(scanAddressMock).toHaveBeenCalledWith(SupportedEVMChain.Polygon, TEST_ADDRESSES.TO);
      expect(appStateController.addAddressSecurityAlertResponse).toHaveBeenCalledWith(
        TEST_ADDRESSES.TO,
        MOCK_SCAN_RESPONSES.WARNING
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

        expect(appStateController.getAddressSecurityAlertResponse).not.toHaveBeenCalled();
        expect(scanAddressMock).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('should skip processing when params array is empty', async () => {
        const { middleware } = createMiddleware();
        const req = createMockRequest('eth_sendTransaction', []);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMock).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('should skip processing when params is not an array', async () => {
        const { middleware } = createMiddleware();
        const req = createMockRequest('eth_sendTransaction', null as any);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMock).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('should handle missing chain ID gracefully', async () => {
        const { middleware, appStateController } = createMiddleware({ chainId: null });
        appStateController.getAddressSecurityAlertResponse.mockReturnValue(undefined);

        const req = createMockRequest('eth_sendTransaction', [createTransactionParams()]);
        const res = createMockResponse();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(scanAddressMock).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('non-transaction methods', () => {
    it('should ignore non-transaction RPC methods', async () => {
      const { middleware, appStateController } = createMiddleware();
      const req = createMockRequest('eth_getBalance', [TEST_ADDRESSES.TO]);
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(appStateController.getAddressSecurityAlertResponse).not.toHaveBeenCalled();
      expect(scanAddressMock).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
});