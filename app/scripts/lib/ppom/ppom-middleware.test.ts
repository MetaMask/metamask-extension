import {
  type Hex,
  JsonRpcRequestStruct,
  JsonRpcResponseStruct,
} from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';

import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import { createPPOMMiddleware } from './ppom-middleware';
import {
  generateSecurityAlertId,
  handlePPOMError,
  validateRequestWithPPOM,
} from './ppom-util';
import { SecurityAlertResponse } from './types';

jest.mock('./ppom-util');

const SECURITY_ALERT_ID_MOCK = '123';

const SECURITY_ALERT_RESPONSE_MOCK: SecurityAlertResponse = {
  securityAlertId: SECURITY_ALERT_ID_MOCK,
  result_type: BlockaidResultType.Malicious,
  reason: BlockaidReason.permitFarming,
};

const createMiddleware = (
  options: {
    chainId?: Hex;
    error?: Error;
    securityAlertsEnabled?: boolean;
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateSecurityAlertResponse?: any;
  } = {
    updateSecurityAlertResponse: () => undefined,
  },
) => {
  const { chainId, error, securityAlertsEnabled, updateSecurityAlertResponse } =
    options;

  const ppomController = {};

  const preferenceController = {
    store: {
      getState: () => ({
        securityAlertsEnabled:
          securityAlertsEnabled === undefined ?? securityAlertsEnabled,
      }),
    },
  };

  if (error) {
    preferenceController.store.getState = () => {
      throw error;
    };
  }

  const networkController = {
    state: {
      networkConfigurationsByChainId: {
        [chainId || CHAIN_IDS.MAINNET]: {
          chainId: chainId || CHAIN_IDS.MAINNET,
          rpcEndpoints: [{}],
        },
      },
    },
  };

  const appStateController = {
    addSignatureSecurityAlertResponse: () => undefined,
  };

  return createPPOMMiddleware(
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ppomController as any,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preferenceController as any,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    networkController as any,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appStateController as any,
    updateSecurityAlertResponse,
  );
};

describe('PPOMMiddleware', () => {
  const validateRequestWithPPOMMock = jest.mocked(validateRequestWithPPOM);
  const generateSecurityAlertIdMock = jest.mocked(generateSecurityAlertId);
  const handlePPOMErrorMock = jest.mocked(handlePPOMError);

  beforeEach(() => {
    jest.resetAllMocks();

    validateRequestWithPPOMMock.mockResolvedValue(SECURITY_ALERT_RESPONSE_MOCK);
    generateSecurityAlertIdMock.mockReturnValue(SECURITY_ALERT_ID_MOCK);
    handlePPOMErrorMock.mockReturnValue(SECURITY_ALERT_RESPONSE_MOCK);
  });

  it('updates alert response after validating request', async () => {
    const updateSecurityAlertResponse = jest.fn();

    const middlewareFunction = createMiddleware({
      updateSecurityAlertResponse,
    });

    const req = {
      ...JsonRpcRequestStruct,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };

    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct },
      () => undefined,
    );

    await flushPromises();

    expect(updateSecurityAlertResponse).toHaveBeenCalledTimes(1);
    expect(updateSecurityAlertResponse).toHaveBeenCalledWith(
      req.method,
      SECURITY_ALERT_ID_MOCK,
      SECURITY_ALERT_RESPONSE_MOCK,
    );
  });

  it('adds loading response to confirmation requests while validation is in progress', async () => {
    const middlewareFunction = createMiddleware();

    const req = {
      ...JsonRpcRequestStruct,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };

    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct },
      () => undefined,
    );

    expect(req.securityAlertResponse.reason).toBe(BlockaidReason.inProgress);
    expect(req.securityAlertResponse.result_type).toBe(
      BlockaidResultType.Loading,
    );
  });

  it('does not do validation if the user has not enabled the preference', async () => {
    const middlewareFunction = createMiddleware({
      securityAlertsEnabled: false,
    });

    const req = {
      ...JsonRpcRequestStruct,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };

    await middlewareFunction(req, undefined, () => undefined);

    expect(req.securityAlertResponse).toBeUndefined();
    expect(validateRequestWithPPOM).not.toHaveBeenCalled();
  });

  it('does not do validation if user is not on a supported network', async () => {
    const middlewareFunction = createMiddleware({
      chainId: '0x2',
    });

    const req = {
      ...JsonRpcRequestStruct,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };

    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct },
      () => undefined,
    );

    expect(req.securityAlertResponse).toBeUndefined();
    expect(validateRequestWithPPOM).not.toHaveBeenCalled();
  });

  it('does not do validation when request is not for confirmation method', async () => {
    const middlewareFunction = createMiddleware();

    const req = {
      ...JsonRpcRequestStruct,
      method: 'eth_someRequest',
      securityAlertResponse: undefined,
    };

    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct },
      () => undefined,
    );

    expect(req.securityAlertResponse).toBeUndefined();
    expect(validateRequestWithPPOM).not.toHaveBeenCalled();
  });

  it('calls next method', async () => {
    const middlewareFunction = createMiddleware();
    const nextMock = jest.fn();

    await middlewareFunction(
      { ...JsonRpcRequestStruct, method: 'eth_sendTransaction' },
      { ...JsonRpcResponseStruct },
      nextMock,
    );

    expect(nextMock).toHaveBeenCalledTimes(1);
  });

  it('handles error if middleware throws', async () => {
    const error = new Error('Test Error Message');
    error.name = 'TestName';

    const nextMock = jest.fn();

    const middlewareFunction = createMiddleware({ error });

    const req = {
      ...JsonRpcRequestStruct,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };

    await middlewareFunction(req, { ...JsonRpcResponseStruct }, nextMock);

    expect(req.securityAlertResponse).toStrictEqual(
      SECURITY_ALERT_RESPONSE_MOCK,
    );

    expect(nextMock).toHaveBeenCalledTimes(1);
  });
});
