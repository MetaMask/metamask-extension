/* eslint-disable @typescript-eslint/no-explicit-any */
import { PPOMController } from '@metamask/ppom-validator';
import { PPOM } from '@blockaid/ppom_release';
import {
  TransactionController,
  TransactionParams,
  normalizeTransactionParams,
} from '@metamask/transaction-controller';
import { SignatureController } from '@metamask/signature-controller';
import type { PersonalMessage } from '@metamask/message-manager';
import {
  BlockaidReason,
  BlockaidResultType,
  SecurityAlertSource,
} from '../../../../shared/constants/security-provider';
import { AppStateController } from '../../controllers/app-state';
import {
  generateSecurityAlertId,
  isChainSupported,
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
const CHAIN_ID_MOCK = '0x1';

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
};

const TRANSACTION_PARAMS_MOCK_1: TransactionParams = {
  to: '0x123',
  from: '0x123',
  value: '0x123',
};

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
  const getSupportedChainIdsMock = jest.spyOn(
    securityAlertAPI,
    'getSecurityAlertsAPISupportedChainIds',
  );
  let isSecurityAlertsEnabledMock: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    isSecurityAlertsEnabledMock = jest
      .spyOn(securityAlertAPI, 'isSecurityAlertsAPIEnabled')
      .mockReturnValue(false);
  });

  describe('validateRequestWithPPOM', () => {
    it('returns response from validation with PPOM instance via controller', async () => {
      const ppom = createPPOMMock();
      const ppomController = createPPOMControllerMock();

      ppom.validateJsonRpc.mockResolvedValue(SECURITY_ALERT_RESPONSE_MOCK);

      ppomController.usePPOM.mockImplementation(
        (callback) => callback(ppom as any) as any,
      );

      const response = await validateRequestWithPPOM({
        ppomController,
        request: REQUEST_MOCK,
        securityAlertId: SECURITY_ALERT_ID_MOCK,
        chainId: CHAIN_ID_MOCK,
      });

      expect(response).toStrictEqual({
        ...SECURITY_ALERT_RESPONSE_MOCK,
        securityAlertId: SECURITY_ALERT_ID_MOCK,
      });

      expect(ppom.validateJsonRpc).toHaveBeenCalledTimes(1);
      expect(ppom.validateJsonRpc).toHaveBeenCalledWith(REQUEST_MOCK);
    });

    it('returns error response if validation with PPOM instance throws', async () => {
      const ppom = createPPOMMock();
      const ppomController = createPPOMControllerMock();

      ppom.validateJsonRpc.mockRejectedValue(createErrorMock());

      ppomController.usePPOM.mockImplementation(
        (callback) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback(ppom as any) as any,
      );

      const response = await validateRequestWithPPOM({
        ppomController,
        request: REQUEST_MOCK,
        securityAlertId: SECURITY_ALERT_ID_MOCK,
        chainId: CHAIN_ID_MOCK,
      });

      expect(response).toStrictEqual({
        result_type: BlockaidResultType.Errored,
        reason: BlockaidReason.errored,
        description: 'Test Error: Test error message',
      });
    });

    it('returns error response if controller throws', async () => {
      const ppomController = createPPOMControllerMock();

      ppomController.usePPOM.mockRejectedValue(createErrorMock());

      const response = await validateRequestWithPPOM({
        ppomController,
        request: REQUEST_MOCK,
        securityAlertId: SECURITY_ALERT_ID_MOCK,
        chainId: CHAIN_ID_MOCK,
      });

      expect(response).toStrictEqual({
        result_type: BlockaidResultType.Errored,
        reason: BlockaidReason.errored,
        description: 'Test Error: Test error message',
      });
    });

    it('normalizes request if method is eth_sendTransaction', async () => {
      const ppom = createPPOMMock();
      const ppomController = createPPOMControllerMock();

      ppomController.usePPOM.mockImplementation(
        (callback) =>
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
        ppomController,
        request,
        securityAlertId: SECURITY_ALERT_ID_MOCK,
        chainId: CHAIN_ID_MOCK,
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
        } as unknown as PersonalMessage,
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
        appStateController: {} as any,
        method: 'eth_sendTransaction',
        securityAlertId: SECURITY_ALERT_ID_MOCK,
        securityAlertResponse: SECURITY_ALERT_RESPONSE_MOCK,
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
        ppomController,
        request,
        securityAlertId: SECURITY_ALERT_ID_MOCK,
        chainId: CHAIN_ID_MOCK,
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
        ppomController,
        request,
        securityAlertId: SECURITY_ALERT_ID_MOCK,
        chainId: CHAIN_ID_MOCK,
      });

      expect(ppomController.usePPOM).toHaveBeenCalledTimes(1);

      expect(validateWithSecurityAlertsAPIMock).toHaveBeenCalledTimes(1);
      expect(validateWithSecurityAlertsAPIMock).toHaveBeenCalledWith(
        CHAIN_ID_MOCK,
        request,
      );
    });
  });

  describe('isChainSupported', () => {
    describe('when security alerts API is enabled', () => {
      beforeEach(async () => {
        isSecurityAlertsEnabledMock.mockReturnValue(true);
        getSupportedChainIdsMock.mockResolvedValue([CHAIN_ID_MOCK]);
      });

      it('returns true if chain is supported', async () => {
        expect(await isChainSupported(CHAIN_ID_MOCK)).toStrictEqual(true);
      });

      it('returns false if chain is not supported', async () => {
        expect(await isChainSupported('0x2')).toStrictEqual(false);
      });

      it('returns correctly if security alerts API throws', async () => {
        getSupportedChainIdsMock.mockRejectedValue(new Error('Test Error'));
        expect(await isChainSupported(CHAIN_ID_MOCK)).toStrictEqual(true);
      });
    });

    describe('when security alerts API is disabled', () => {
      it('returns true if chain is supported', async () => {
        expect(await isChainSupported(CHAIN_ID_MOCK)).toStrictEqual(true);
      });

      it('returns false if chain is not supported', async () => {
        expect(await isChainSupported('0x2')).toStrictEqual(false);
      });
    });
  });
});
