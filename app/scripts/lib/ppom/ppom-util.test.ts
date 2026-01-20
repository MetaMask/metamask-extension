import { PPOMController } from '@metamask/ppom-validator';
import {
  TransactionController,
  TransactionControllerUnapprovedTransactionAddedEvent,
  TransactionEnvelopeType,
  TransactionMeta,
  TransactionParams,
  normalizeTransactionParams,
} from '@metamask/transaction-controller';
import {
  SignatureController,
  SignatureControllerState,
  SignatureRequest,
  SignatureRequestType,
  SignatureStateChange,
} from '@metamask/signature-controller';
import { Hex, JsonRpcRequest } from '@metamask/utils';
import { PPOM } from '@blockaid/ppom_release';
import { isSnapId } from '@metamask/snaps-utils';
import {
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
  Messenger,
} from '@metamask/messenger';
import {
  BlockaidReason,
  BlockaidResultType,
  LOADING_SECURITY_ALERT_RESPONSE,
  SecurityAlertSource,
} from '../../../../shared/constants/security-provider';
import { AppStateController } from '../../controllers/app-state-controller';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { isSnapPreinstalled } from '../../../../shared/lib/snaps/snaps';
import { RootMessenger } from '../messenger';
import {
  generateSecurityAlertId,
  updateSecurityAlertResponse,
  validateRequestWithPPOM,
} from './ppom-util';
import { SecurityAlertResponse } from './types';
import * as securityAlertAPI from './security-alerts-api';

jest.mock('@metamask/transaction-controller', () => ({
  ...jest.requireActual('@metamask/transaction-controller'),
  normalizeTransactionParams: jest.fn(),
}));

jest.mock('@metamask/snaps-utils', () => ({
  ...jest.requireActual('@metamask/snaps-utils'),
  isSnapId: jest.fn(),
}));

jest.mock('../../../../shared/lib/snaps/snaps', () => ({
  ...jest.requireActual('../../../../shared/lib/snaps/snaps'),
  isSnapPreinstalled: jest.fn(),
}));

const SECURITY_ALERT_ID_MOCK = '1234-5678';
const TRANSACTION_ID_MOCK = '123';
const CHAIN_ID_MOCK = '0x1' as Hex;
const GAS_MOCK = '0x1234';
const GAS_PRICE_MOCK = '0x5678';

// Mock data for permission origin tests
const PERMISSION_ORIGIN_MOCK = 'https://malicious-site.com';
const GATOR_SNAP_ORIGIN_MOCK = 'npm:@metamask/gator-permissions-snap';

const REQUEST_MOCK = {
  method: 'eth_signTypedData_v4',
  params: [],
  id: '',
  jsonrpc: '2.0' as const,
};

const SECURITY_ALERT_RESPONSE_MOCK: SecurityAlertResponse = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: 'success',
  reason: 'success',
  source: SecurityAlertSource.Local,
  securityAlertId: SECURITY_ALERT_ID_MOCK,
};

const TRANSACTION_PARAMS_MOCK_1: TransactionParams = {
  to: '0x123',
  from: '0x123',
  value: '0x123',
};

const SIGN_TYPED_DATA_PARAMS_MOCK_1 = '0x123';
const SIGN_TYPED_DATA_PARAMS_MOCK_2 =
  '{"primaryType":"Permit","domain":{},"types":{}}';

const TRANSACTION_PARAMS_MOCK_2: TransactionParams = {
  ...TRANSACTION_PARAMS_MOCK_1,
  to: '0x456',
};

const MESSENGER_MOCK = {
  subscribe: jest.fn(),
} as unknown as RootMessenger;

function createPPOMMock() {
  return {
    validateJsonRpc: jest.fn(),
  } as unknown as jest.Mocked<PPOM>;
}

function createPPOMControllerMock() {
  return {
    usePPOM: jest.fn(),
  } as unknown as jest.Mocked<PPOMController>;
}

function createErrorMock() {
  const error = new Error('Test error message');
  error.name = 'Test Error';

  return error;
}

function createAppStateControllerMock() {
  return {
    addSignatureSecurityAlertResponse: jest.fn(),
  } as unknown as jest.Mocked<AppStateController>;
}

function createSignatureControllerMock(
  signatureRequests: SignatureControllerState['signatureRequests'],
) {
  return {
    state: {
      signatureRequests,
    },
  } as unknown as jest.Mocked<SignatureController>;
}

function createTransactionControllerMock(
  state: TransactionController['state'],
) {
  return {
    state,
    updateSecurityAlertResponse: jest.fn(),
  } as unknown as jest.Mocked<TransactionController>;
}

function createMessengerMock() {
  return new Messenger<
    MockAnyNamespace,
    never,
    SignatureStateChange | TransactionControllerUnapprovedTransactionAddedEvent
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });
}

describe('PPOM Utils', () => {
  const updateSecurityAlertResponseMock = jest.fn();
  let isSecurityAlertsEnabledMock: jest.SpyInstance;
  let ppomController: jest.Mocked<PPOMController>;
  let ppom: jest.Mocked<PPOM>;

  const normalizeTransactionParamsMock = jest.mocked(
    normalizeTransactionParams,
  );
  const isSnapIdMock = jest.mocked(isSnapId);
  const isSnapPreinstalledMock = jest.mocked(isSnapPreinstalled);

  const validateRequestWithPPOMOptionsBase = {
    request: REQUEST_MOCK,
    securityAlertId: SECURITY_ALERT_ID_MOCK,
    chainId: CHAIN_ID_MOCK,
    updateSecurityAlertResponse: updateSecurityAlertResponseMock,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    isSecurityAlertsEnabledMock = jest
      .spyOn(securityAlertAPI, 'isSecurityAlertsAPIEnabled')
      .mockReturnValue(false);

    ppomController = createPPOMControllerMock();
    ppom = createPPOMMock();

    // @ts-expect-error PPOM from package does not match controller type
    ppomController.usePPOM.mockImplementation((callback) => callback(ppom));

    normalizeTransactionParamsMock.mockImplementation(
      (params: TransactionParams) => params,
    );

    // Reset snap utility mocks
    isSnapIdMock.mockReturnValue(false);
    isSnapPreinstalledMock.mockReturnValue(false);
  });

  describe('validateRequestWithPPOM', () => {
    it('updates response from validation with PPOM instance via controller', async () => {
      ppom.validateJsonRpc.mockResolvedValue(SECURITY_ALERT_RESPONSE_MOCK);

      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
      });
      expect(updateSecurityAlertResponseMock).toHaveBeenCalledWith(
        REQUEST_MOCK.method,
        SECURITY_ALERT_ID_MOCK,
        {
          ...SECURITY_ALERT_RESPONSE_MOCK,
          securityAlertId: SECURITY_ALERT_ID_MOCK,
        },
      );

      expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
      expect(ppom.validateJsonRpc).toHaveBeenCalledWith(REQUEST_MOCK);
    });

    it('updates securityAlertResponse with loading state', async () => {
      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
      });

      expect(updateSecurityAlertResponseMock).toHaveBeenCalledWith(
        REQUEST_MOCK.method,
        SECURITY_ALERT_ID_MOCK,
        LOADING_SECURITY_ALERT_RESPONSE,
      );
    });

    it('updates error response if validation with PPOM instance throws', async () => {
      ppom.validateJsonRpc.mockRejectedValue(createErrorMock());

      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
      });

      expect(updateSecurityAlertResponseMock).toHaveBeenCalledWith(
        validateRequestWithPPOMOptionsBase.request.method,
        SECURITY_ALERT_ID_MOCK,
        {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: BlockaidResultType.Errored,
          reason: BlockaidReason.errored,
          description: 'Test Error: Test error message',
          source: SecurityAlertSource.Local,
        },
      );
    });

    it('updates error response if controller throws', async () => {
      ppomController.usePPOM.mockRejectedValue(createErrorMock());

      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
      });

      expect(updateSecurityAlertResponseMock).toHaveBeenCalledWith(
        validateRequestWithPPOMOptionsBase.request.method,
        SECURITY_ALERT_ID_MOCK,
        {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: BlockaidResultType.Errored,
          reason: BlockaidReason.errored,
          description: 'Test Error: Test error message',
          source: SecurityAlertSource.Local,
        },
      );
    });

    describe('if method is eth_sendTransaction', () => {
      it('normalizes transaction params', async () => {
        normalizeTransactionParamsMock.mockReturnValue(
          TRANSACTION_PARAMS_MOCK_2,
        );

        updateSecurityAlertResponseMock.mockResolvedValue({
          txParams: TRANSACTION_PARAMS_MOCK_1,
        });

        const request = {
          ...REQUEST_MOCK,
          method: 'eth_sendTransaction',
          params: [TRANSACTION_PARAMS_MOCK_1],
        };

        await validateRequestWithPPOM({
          ...validateRequestWithPPOMOptionsBase,
          ppomController,
          request,
        });

        expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
        expect(ppom.validateJsonRpc).toHaveBeenCalledWith({
          ...request,
          params: [TRANSACTION_PARAMS_MOCK_2],
        });

        expect(normalizeTransactionParamsMock).toHaveBeenCalledTimes(1);
        expect(normalizeTransactionParamsMock).toHaveBeenCalledWith(
          TRANSACTION_PARAMS_MOCK_1,
        );
      });

      it('includes gas properties', async () => {
        updateSecurityAlertResponseMock.mockResolvedValue({
          txParams: {
            ...TRANSACTION_PARAMS_MOCK_1,
            gas: GAS_MOCK,
            maxFeePerGas: GAS_PRICE_MOCK,
          },
        });

        const request = {
          ...REQUEST_MOCK,
          method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
          params: [TRANSACTION_PARAMS_MOCK_1],
        };

        await validateRequestWithPPOM({
          ...validateRequestWithPPOMOptionsBase,
          ppomController,
          request,
        });

        expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
        expect(ppom.validateJsonRpc).toHaveBeenCalledWith({
          ...request,
          params: [
            {
              ...TRANSACTION_PARAMS_MOCK_1,
              gas: GAS_MOCK,
              gasPrice: GAS_PRICE_MOCK,
            },
          ],
        });
      });

      it('includes gas properties using gas price', async () => {
        updateSecurityAlertResponseMock.mockResolvedValue({
          txParams: {
            ...TRANSACTION_PARAMS_MOCK_1,
            gas: GAS_MOCK,
            gasPrice: GAS_PRICE_MOCK,
          },
        });

        const request = {
          ...REQUEST_MOCK,
          method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
          params: [TRANSACTION_PARAMS_MOCK_1],
        };

        await validateRequestWithPPOM({
          ...validateRequestWithPPOMOptionsBase,
          ppomController,
          request,
        });

        expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
        expect(ppom.validateJsonRpc).toHaveBeenCalledWith({
          ...request,
          params: [
            {
              ...TRANSACTION_PARAMS_MOCK_1,
              gas: GAS_MOCK,
              gasPrice: GAS_PRICE_MOCK,
            },
          ],
        });
      });

      it('removes unnecessary params', async () => {
        updateSecurityAlertResponseMock.mockResolvedValue({
          txParams: {
            ...TRANSACTION_PARAMS_MOCK_1,
            gas: GAS_MOCK,
            maxFeePerGas: GAS_PRICE_MOCK,
          },
        });

        const request = {
          ...REQUEST_MOCK,
          method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
          params: [
            {
              ...TRANSACTION_PARAMS_MOCK_1,
              gasLimit: GAS_MOCK,
              maxFeePerGas: GAS_PRICE_MOCK,
              maxPriorityFeePerGas: GAS_PRICE_MOCK,
              type: TransactionEnvelopeType.feeMarket,
            },
          ],
        };

        await validateRequestWithPPOM({
          ...validateRequestWithPPOMOptionsBase,
          ppomController,
          request,
        });

        expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
        expect(ppom.validateJsonRpc).toHaveBeenCalledWith({
          ...request,
          params: [
            {
              ...TRANSACTION_PARAMS_MOCK_1,
              gas: GAS_MOCK,
              gasPrice: GAS_PRICE_MOCK,
            },
          ],
        });
      });
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3,
      MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
    ])('sanitizes request params if method is %s', async (method: string) => {
      const firstTwoParams = [
        SIGN_TYPED_DATA_PARAMS_MOCK_1,
        SIGN_TYPED_DATA_PARAMS_MOCK_2,
      ];

      const unwantedParams = [{}, undefined, 1, null];

      const params = [...firstTwoParams, ...unwantedParams];

      const request = {
        ...REQUEST_MOCK,
        method,
        params,
      } as unknown as JsonRpcRequest;

      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
        request,
      });

      expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
      expect(ppom.validateJsonRpc).toHaveBeenCalledWith({
        ...request,
        params: firstTwoParams,
      });
    });

    it('sanitizes request params if second param is an object', async () => {
      const params = [
        SIGN_TYPED_DATA_PARAMS_MOCK_1,
        { primaryType: 'Permit', domain: {}, types: {} },
      ];

      const request = {
        ...REQUEST_MOCK,
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params,
      } as unknown as JsonRpcRequest;

      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
        request,
      });

      expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
      expect(ppom.validateJsonRpc).toHaveBeenCalledWith({
        ...request,
        params: [SIGN_TYPED_DATA_PARAMS_MOCK_1, SIGN_TYPED_DATA_PARAMS_MOCK_2],
      });
    });

    it('removes unnecessary properties from request', async () => {
      updateSecurityAlertResponseMock.mockResolvedValue({
        txParams: TRANSACTION_PARAMS_MOCK_1,
      });

      const request = {
        ...REQUEST_MOCK,
        delegationMock: '0x123',
        method: 'eth_sendTransaction',
        origin: 'test.com',
        params: [TRANSACTION_PARAMS_MOCK_1],
        test1: 'test1',
        test2: 'test2',
      };

      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
        request: request as never,
      });

      expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
      expect(ppom.validateJsonRpc).toHaveBeenCalledWith({
        ...request,
        test1: undefined,
        test2: undefined,
      });
    });

    describe('permission origin handling', () => {
      it('uses decodedPermission.origin for permission requests from preinstalled snaps', async () => {
        // Mock snap validation functions
        isSnapIdMock.mockReturnValue(true);
        isSnapPreinstalledMock.mockReturnValue(true);

        const request = {
          ...REQUEST_MOCK,
          method: 'eth_signTypedData_v4',
          origin: GATOR_SNAP_ORIGIN_MOCK, // Gator snap origin
          params: [
            SIGN_TYPED_DATA_PARAMS_MOCK_1,
            SIGN_TYPED_DATA_PARAMS_MOCK_2,
          ],
        };

        const signatureRequestWithPermission = {
          id: 'test-id',
          chainId: '0x1',
          networkClientId: 'test-network',
          status: 'unapproved',
          time: Date.now(),
          type: SignatureRequestType.TypedSign,
          messageParams: {
            from: '0x123',
            data: 'test-data',
          },
          decodedPermission: {
            origin: PERMISSION_ORIGIN_MOCK, // Actual malicious domain
            permission: {
              type: 'native-token-stream',
              data: {
                initialAmount: '0x1234',
                maxAmount: '0x1234',
                amountPerSecond: '0x1234',
                startTime: 123456789,
              },
              justification: 'Test permission',
            },
            chainId: '0x1',
            signer: {
              type: 'account',
              data: { address: '0x123' },
            },
            expiry: 123456789,
          },
        } as SignatureRequest;

        updateSecurityAlertResponseMock.mockResolvedValue(
          signatureRequestWithPermission,
        );

        await validateRequestWithPPOM({
          ...validateRequestWithPPOMOptionsBase,
          ppomController,
          request,
        });

        expect(isSnapIdMock).toHaveBeenCalledWith(GATOR_SNAP_ORIGIN_MOCK);
        expect(isSnapPreinstalledMock).toHaveBeenCalledWith(
          GATOR_SNAP_ORIGIN_MOCK,
        );
        expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
        expect(ppom.validateJsonRpc).toHaveBeenCalledWith(
          expect.objectContaining({
            origin: PERMISSION_ORIGIN_MOCK, // Should use permission origin
          }),
        );
        expect(ppom.validateJsonRpc).toHaveBeenCalledWith(
          expect.not.objectContaining({
            origin: GATOR_SNAP_ORIGIN_MOCK, // Should not use Gator snap origin
          }),
        );
      });

      it('rejects origin override for non-preinstalled snaps', async () => {
        // Mock snap validation functions - snap is not preinstalled
        isSnapIdMock.mockReturnValue(true);
        isSnapPreinstalledMock.mockReturnValue(false);

        const nonPreinstalledSnapOrigin = 'npm:@metamask/fake-permissions-snap';

        const request = {
          ...REQUEST_MOCK,
          method: 'eth_signTypedData_v4',
          origin: nonPreinstalledSnapOrigin, // non preinstalled snap origin
          params: [
            SIGN_TYPED_DATA_PARAMS_MOCK_1,
            SIGN_TYPED_DATA_PARAMS_MOCK_2,
          ],
        };

        const signatureRequestWithPermission = {
          id: 'test-id',
          chainId: '0x1',
          networkClientId: 'test-network',
          status: 'unapproved',
          time: Date.now(),
          type: SignatureRequestType.TypedSign,
          messageParams: {
            from: '0x123',
            data: 'test-data',
          },
          decodedPermission: {
            origin: 'https://legitimate-domain.com', // Actual malicious domain
            permission: {
              type: 'native-token-stream',
              data: {
                initialAmount: '0x1234',
                maxAmount: '0x1234',
                amountPerSecond: '0x1234',
                startTime: 123456789,
              },
              justification: 'Test permission',
            },
            chainId: '0x1',
            signer: {
              type: 'account',
              data: { address: '0x123' },
            },
            expiry: 123456789,
          },
        } as SignatureRequest;

        updateSecurityAlertResponseMock.mockResolvedValue(
          signatureRequestWithPermission,
        );

        await validateRequestWithPPOM({
          ...validateRequestWithPPOMOptionsBase,
          ppomController,
          request,
        });

        expect(isSnapIdMock).toHaveBeenCalledWith(nonPreinstalledSnapOrigin);
        expect(isSnapPreinstalledMock).toHaveBeenCalledWith(
          nonPreinstalledSnapOrigin,
        );
        expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
        expect(ppom.validateJsonRpc).toHaveBeenCalledWith(
          expect.objectContaining({
            origin: nonPreinstalledSnapOrigin, // Should use snap origin, not permission origin
          }),
        );
        expect(ppom.validateJsonRpc).toHaveBeenCalledWith(
          expect.not.objectContaining({
            origin: 'https://legitimate-domain.com', // Should not use permission origin
          }),
        );
      });

      it('rejects origin override for non-snap requests', async () => {
        // Mock snap validation functions - not a snap
        isSnapIdMock.mockReturnValue(false);

        const request = {
          ...REQUEST_MOCK,
          method: 'eth_signTypedData_v4',
          origin: 'https://malicious-site.com', // Not a snap
          params: [
            SIGN_TYPED_DATA_PARAMS_MOCK_1,
            SIGN_TYPED_DATA_PARAMS_MOCK_2,
          ],
        };

        const signatureRequestWithPermission = {
          id: 'test-id',
          chainId: '0x1',
          networkClientId: 'test-network',
          status: 'unapproved',
          time: Date.now(),
          type: SignatureRequestType.TypedSign,
          messageParams: {
            from: '0x123',
            data: 'test-data',
          },
          decodedPermission: {
            origin: 'https://legitimate-domain.com', // Different from request origin
            permission: {
              type: 'native-token-stream',
              data: {
                initialAmount: '0x1234',
                maxAmount: '0x1234',
                amountPerSecond: '0x1234',
                startTime: 123456789,
              },
              justification: 'Test permission',
            },
            chainId: '0x1',
            signer: {
              type: 'account',
              data: { address: '0x123' },
            },
            expiry: 123456789,
          },
        } as SignatureRequest;

        updateSecurityAlertResponseMock.mockResolvedValue(
          signatureRequestWithPermission,
        );

        await validateRequestWithPPOM({
          ...validateRequestWithPPOMOptionsBase,
          ppomController,
          request,
        });

        expect(isSnapIdMock).toHaveBeenCalledWith('https://malicious-site.com');
        expect(isSnapPreinstalledMock).not.toHaveBeenCalled();
        expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
        expect(ppom.validateJsonRpc).toHaveBeenCalledWith(
          expect.objectContaining({
            origin: 'https://malicious-site.com', // Should use request origin, not permission origin
          }),
        );
        expect(ppom.validateJsonRpc).toHaveBeenCalledWith(
          expect.not.objectContaining({
            origin: 'https://legitimate-domain.com', // Should not use permission origin
          }),
        );
      });

      it('falls back to request origin for non-permission requests', async () => {
        const requestOrigin = 'https://dapp.com';
        const request = {
          ...REQUEST_MOCK,
          method: 'eth_signTypedData_v4',
          origin: requestOrigin,
          params: [
            SIGN_TYPED_DATA_PARAMS_MOCK_1,
            SIGN_TYPED_DATA_PARAMS_MOCK_2,
          ],
        };

        const signatureRequestWithoutPermission = {
          id: 'test-id',
          chainId: '0x1',
          networkClientId: 'test-network',
          status: 'unapproved',
          time: Date.now(),
          type: SignatureRequestType.TypedSign,
          messageParams: {
            from: '0x123',
            data: 'test-data',
          },
          // No decodedPermission
        } as SignatureRequest;

        updateSecurityAlertResponseMock.mockResolvedValue(
          signatureRequestWithoutPermission,
        );

        await validateRequestWithPPOM({
          ...validateRequestWithPPOMOptionsBase,
          ppomController,
          request,
        });

        expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
        expect(ppom.validateJsonRpc).toHaveBeenCalledWith(
          expect.objectContaining({
            origin: requestOrigin, // Should use request origin
          }),
        );
      });

      it('handles malicious domain detection for permission requests from preinstalled snaps', async () => {
        // Mock snap validation functions
        isSnapIdMock.mockReturnValue(true);
        isSnapPreinstalledMock.mockReturnValue(true);

        const maliciousDomain = 'https://phishing-site.com';
        const request = {
          ...REQUEST_MOCK,
          method: 'eth_signTypedData_v4',
          origin: GATOR_SNAP_ORIGIN_MOCK,
          params: [
            SIGN_TYPED_DATA_PARAMS_MOCK_1,
            SIGN_TYPED_DATA_PARAMS_MOCK_2,
          ],
        };

        const signatureRequestWithMaliciousPermission = {
          id: 'test-id',
          chainId: '0x1',
          networkClientId: 'test-network',
          status: 'unapproved',
          time: Date.now(),
          type: SignatureRequestType.TypedSign,
          messageParams: {
            from: '0x123',
            data: 'test-data',
          },
          decodedPermission: {
            origin: maliciousDomain, // Malicious domain
            permission: {
              type: 'native-token-stream',
              data: {
                initialAmount: '0x1234',
                maxAmount: '0x1234',
                amountPerSecond: '0x1234',
                startTime: 123456789,
              },
              justification: 'Suspicious permission request',
            },
            chainId: '0x1',
            signer: {
              type: 'account',
              data: { address: '0x123' },
            },
            expiry: 123456789,
          },
        } as SignatureRequest;

        updateSecurityAlertResponseMock.mockResolvedValue(
          signatureRequestWithMaliciousPermission,
        );

        await validateRequestWithPPOM({
          ...validateRequestWithPPOMOptionsBase,
          ppomController,
          request,
        });

        expect(isSnapIdMock).toHaveBeenCalledWith(GATOR_SNAP_ORIGIN_MOCK);
        expect(isSnapPreinstalledMock).toHaveBeenCalledWith(
          GATOR_SNAP_ORIGIN_MOCK,
        );
        expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
        expect(ppom.validateJsonRpc).toHaveBeenCalledWith(
          expect.objectContaining({
            origin: maliciousDomain, // Should validate against malicious domain
          }),
        );
      });
    });
  });

  describe('generateSecurityAlertId', () => {
    it('returns uuid', () => {
      const securityAlertId = generateSecurityAlertId();

      expect(securityAlertId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
      );
    });
  });

  describe('updateSecurityAlertResponse', () => {
    it('adds response to app state controller if signature request already exists', async () => {
      const appStateController = createAppStateControllerMock();

      const signatureController = createSignatureControllerMock({
        '123': {
          securityAlertResponse: {
            ...SECURITY_ALERT_RESPONSE_MOCK,
            securityAlertId: SECURITY_ALERT_ID_MOCK,
          },
        } as unknown as SignatureRequest,
      });

      await updateSecurityAlertResponse({
        appStateController,
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        messenger: MESSENGER_MOCK,
        securityAlertId: SECURITY_ALERT_ID_MOCK,
        securityAlertResponse: SECURITY_ALERT_RESPONSE_MOCK,
        signatureController,
        transactionController: {} as unknown as TransactionController,
      });

      expect(
        appStateController.addSignatureSecurityAlertResponse,
      ).toHaveBeenCalledTimes(1);

      expect(
        appStateController.addSignatureSecurityAlertResponse,
      ).toHaveBeenCalledWith(SECURITY_ALERT_RESPONSE_MOCK);
    });

    it('adds response to app state controller after signature controller state change event', async () => {
      const appStateController = createAppStateControllerMock();
      const signatureController = createSignatureControllerMock({});
      const messenger = createMessengerMock();

      const updatePromise = updateSecurityAlertResponse({
        appStateController,
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        messenger,
        securityAlertId: SECURITY_ALERT_ID_MOCK,
        securityAlertResponse: SECURITY_ALERT_RESPONSE_MOCK,
        signatureController,
        transactionController: {} as unknown as TransactionController,
      });

      messenger.publish(
        'SignatureController:stateChange',
        {
          signatureRequests: {
            '123': {
              securityAlertResponse: SECURITY_ALERT_RESPONSE_MOCK,
            } as unknown as SignatureRequest,
          },
        } as unknown as SignatureControllerState,
        [],
      );

      await updatePromise;

      expect(
        appStateController.addSignatureSecurityAlertResponse,
      ).toHaveBeenCalledTimes(1);

      expect(
        appStateController.addSignatureSecurityAlertResponse,
      ).toHaveBeenCalledWith(SECURITY_ALERT_RESPONSE_MOCK);
    });

    it('adds response to transaction controller if transaction already exists', async () => {
      const transactionController = createTransactionControllerMock({
        transactions: [
          {
            id: TRANSACTION_ID_MOCK,
            securityAlertResponse: {
              securityAlertId: SECURITY_ALERT_ID_MOCK,
            },
          },
        ],
      } as unknown as TransactionController['state']);

      await updateSecurityAlertResponse({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        appStateController: {} as any,
        method: 'eth_sendTransaction',
        messenger: MESSENGER_MOCK,
        securityAlertId: SECURITY_ALERT_ID_MOCK,
        securityAlertResponse: SECURITY_ALERT_RESPONSE_MOCK,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signatureController: {} as any,
        transactionController,
      });

      expect(
        transactionController.updateSecurityAlertResponse,
      ).toHaveBeenCalledTimes(1);

      expect(
        transactionController.updateSecurityAlertResponse,
      ).toHaveBeenCalledWith(TRANSACTION_ID_MOCK, SECURITY_ALERT_RESPONSE_MOCK);
    });

    it('adds response to transaction controller after transaction added event', async () => {
      const transactionController = createTransactionControllerMock({
        transactions: [],
      } as unknown as TransactionController['state']);

      const messenger = createMessengerMock();

      const updatePromise = updateSecurityAlertResponse({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        appStateController: {} as any,
        method: 'eth_sendTransaction',
        messenger,
        securityAlertId: SECURITY_ALERT_ID_MOCK,
        securityAlertResponse: SECURITY_ALERT_RESPONSE_MOCK,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signatureController: {} as any,
        transactionController,
      });

      messenger.publish('TransactionController:unapprovedTransactionAdded', {
        id: TRANSACTION_ID_MOCK,
        securityAlertResponse: SECURITY_ALERT_RESPONSE_MOCK,
        txParams: TRANSACTION_PARAMS_MOCK_1,
      } as TransactionMeta);

      await updatePromise;

      expect(
        transactionController.updateSecurityAlertResponse,
      ).toHaveBeenCalledTimes(1);

      expect(
        transactionController.updateSecurityAlertResponse,
      ).toHaveBeenCalledWith(TRANSACTION_ID_MOCK, SECURITY_ALERT_RESPONSE_MOCK);
    });
  });

  describe('validateWithAPI', () => {
    const request = {
      ...REQUEST_MOCK,
      method: 'eth_sendTransaction',
      params: [TRANSACTION_PARAMS_MOCK_1],
    };

    it('uses security alerts API if enabled', async () => {
      isSecurityAlertsEnabledMock.mockReturnValue(true);

      const validateWithSecurityAlertsAPIMock = jest
        .spyOn(securityAlertAPI, 'validateWithSecurityAlertsAPI')
        .mockResolvedValue(SECURITY_ALERT_RESPONSE_MOCK);

      updateSecurityAlertResponseMock.mockResolvedValue({
        txParams: TRANSACTION_PARAMS_MOCK_1,
      });

      const getSecurityAlertsConfigMock = jest.fn();

      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
        request,
        getSecurityAlertsConfig: getSecurityAlertsConfigMock,
      });

      expect(ppomController.usePPOM).not.toHaveBeenCalled();
      expect(ppom.validateJsonRpc).not.toHaveBeenCalled();

      expect(validateWithSecurityAlertsAPIMock).toHaveBeenCalledTimes(1);
      expect(validateWithSecurityAlertsAPIMock).toHaveBeenCalledWith(
        CHAIN_ID_MOCK,
        request,
        getSecurityAlertsConfigMock,
      );
    });

    it('uses controller if security alerts API throws', async () => {
      isSecurityAlertsEnabledMock.mockReturnValue(true);

      updateSecurityAlertResponseMock.mockResolvedValue({
        txParams: TRANSACTION_PARAMS_MOCK_1,
      });

      const validateWithSecurityAlertsAPIMock = jest
        .spyOn(securityAlertAPI, 'validateWithSecurityAlertsAPI')
        .mockRejectedValue(new Error('Test Error'));

      const getSecurityAlertsConfigMock = jest.fn();

      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
        request,
        getSecurityAlertsConfig: getSecurityAlertsConfigMock,
      });

      expect(ppomController.usePPOM).toHaveBeenCalledTimes(1);

      expect(validateWithSecurityAlertsAPIMock).toHaveBeenCalledTimes(1);
      expect(validateWithSecurityAlertsAPIMock).toHaveBeenCalledWith(
        CHAIN_ID_MOCK,
        request,
        getSecurityAlertsConfigMock,
      );
    });
  });
});
