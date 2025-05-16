import { PPOMController } from '@metamask/ppom-validator';
import { PPOM } from '@blockaid/ppom_release';
import {
  TransactionController,
  TransactionParams,
  normalizeTransactionParams,
} from '@metamask/transaction-controller';
import {
  SignatureController,
  SignatureRequest,
} from '@metamask/signature-controller';
import { Hex, JsonRpcRequest } from '@metamask/utils';
import {
  BlockaidReason,
  BlockaidResultType,
  LOADING_SECURITY_ALERT_RESPONSE,
  SecurityAlertSource,
} from '../../../../shared/constants/security-provider';
import { AppStateController } from '../../controllers/app-state-controller';
import {
  generateSecurityAlertId,
  METHOD_SIGN_TYPED_DATA_V3,
  METHOD_SIGN_TYPED_DATA_V4,
  updateSecurityAlertResponse,
  validateRequestWithPPOM,
} from './ppom-util';
import { SecurityAlertResponse } from './types';
import * as securityAlertAPI from './security-alerts-api';

jest.mock('@metamask/transaction-controller', () => ({
  ...jest.requireActual('@metamask/transaction-controller'),
  normalizeTransactionParams: jest.fn(),
}));

const SECURITY_ALERT_ID_MOCK = '1234-5678';
const TRANSACTION_ID_MOCK = '123';
const CHAIN_ID_MOCK = '0x1' as Hex;

const REQUEST_MOCK = {
  method: 'eth_signTypedData_v4',
  params: [],
  id: '',
  jsonrpc: '2.0' as const,
};

const SECURITY_ALERT_RESPONSE_MOCK: SecurityAlertResponse = {
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
  messages: SignatureController['messages'],
) {
  return {
    messages,
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

describe('PPOM Utils', () => {
  const normalizeTransactionParamsMock = jest.mocked(
    normalizeTransactionParams,
  );
  let isSecurityAlertsEnabledMock: jest.SpyInstance;

  const updateSecurityAlertResponseMock = jest.fn();

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
  });

  describe('validateRequestWithPPOM', () => {
    it('updates response from validation with PPOM instance via controller', async () => {
      const ppom = createPPOMMock();
      const ppomController = createPPOMControllerMock();

      ppom.validateJsonRpc.mockResolvedValue(SECURITY_ALERT_RESPONSE_MOCK);

      ppomController.usePPOM.mockImplementation(
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (callback) => callback(ppom as any) as any,
      );

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
      const ppomController = createPPOMControllerMock();

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
      const ppom = createPPOMMock();
      const ppomController = createPPOMControllerMock();

      ppom.validateJsonRpc.mockRejectedValue(createErrorMock());

      ppomController.usePPOM.mockImplementation(
        (callback) =>
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback(ppom as any) as any,
      );

      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
      });

      expect(updateSecurityAlertResponseMock).toHaveBeenCalledWith(
        validateRequestWithPPOMOptionsBase.request.method,
        SECURITY_ALERT_ID_MOCK,
        {
          result_type: BlockaidResultType.Errored,
          reason: BlockaidReason.errored,
          description: 'Test Error: Test error message',
          source: SecurityAlertSource.Local,
        },
      );
    });

    it('updates error response if controller throws', async () => {
      const ppomController = createPPOMControllerMock();

      ppomController.usePPOM.mockRejectedValue(createErrorMock());

      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
      });

      expect(updateSecurityAlertResponseMock).toHaveBeenCalledWith(
        validateRequestWithPPOMOptionsBase.request.method,
        SECURITY_ALERT_ID_MOCK,
        {
          result_type: BlockaidResultType.Errored,
          reason: BlockaidReason.errored,
          description: 'Test Error: Test error message',
          source: SecurityAlertSource.Local,
        },
      );
    });

    it('normalizes request if method is eth_sendTransaction', async () => {
      const ppom = createPPOMMock();
      const ppomController = createPPOMControllerMock();

      ppomController.usePPOM.mockImplementation(
        (callback) =>
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback(ppom as any) as any,
      );

      normalizeTransactionParamsMock.mockReturnValue(TRANSACTION_PARAMS_MOCK_2);

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

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([METHOD_SIGN_TYPED_DATA_V3, METHOD_SIGN_TYPED_DATA_V4])(
      'sanitizes request params if method is %s',
      async (method: string) => {
        const ppom = createPPOMMock();
        const ppomController = createPPOMControllerMock();

        ppomController.usePPOM.mockImplementation(
          (callback) =>
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            callback(ppom as any) as any,
        );

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
      },
    );
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
    it('adds response to app state controller if matching message found', async () => {
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
        method: 'eth_signTypedData_v4',
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

    it('adds response to transaction controller if matching transaction found', async () => {
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
  });

  describe('validateWithAPI', () => {
    const request = {
      ...REQUEST_MOCK,
      method: 'eth_sendTransaction',
      params: [TRANSACTION_PARAMS_MOCK_1],
    };

    it('uses security alerts API if enabled', async () => {
      isSecurityAlertsEnabledMock.mockReturnValue(true);
      normalizeTransactionParamsMock.mockReturnValue(TRANSACTION_PARAMS_MOCK_1);
      const validateWithSecurityAlertsAPIMock = jest
        .spyOn(securityAlertAPI, 'validateWithSecurityAlertsAPI')
        .mockResolvedValue(SECURITY_ALERT_RESPONSE_MOCK);

      const ppom = createPPOMMock();
      const ppomController = createPPOMControllerMock();

      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
        request,
      });

      expect(ppomController.usePPOM).not.toHaveBeenCalled();
      expect(ppom.validateJsonRpc).not.toHaveBeenCalled();

      expect(validateWithSecurityAlertsAPIMock).toHaveBeenCalledTimes(1);
      expect(validateWithSecurityAlertsAPIMock).toHaveBeenCalledWith(
        CHAIN_ID_MOCK,
        request,
      );
    });

    it('uses controller if security alerts API throws', async () => {
      isSecurityAlertsEnabledMock.mockReturnValue(true);
      normalizeTransactionParamsMock.mockReturnValue(TRANSACTION_PARAMS_MOCK_1);

      const ppomController = createPPOMControllerMock();

      const validateWithSecurityAlertsAPIMock = jest
        .spyOn(securityAlertAPI, 'validateWithSecurityAlertsAPI')
        .mockRejectedValue(new Error('Test Error'));

      await validateRequestWithPPOM({
        ...validateRequestWithPPOMOptionsBase,
        ppomController,
        request,
      });

      expect(ppomController.usePPOM).toHaveBeenCalledTimes(1);

      expect(validateWithSecurityAlertsAPIMock).toHaveBeenCalledTimes(1);
      expect(validateWithSecurityAlertsAPIMock).toHaveBeenCalledWith(
        CHAIN_ID_MOCK,
        request,
      );
    });
  });
});
