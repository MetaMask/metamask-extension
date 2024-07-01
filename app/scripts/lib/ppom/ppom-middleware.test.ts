import {
  type Hex,
  JsonRpcRequestStruct,
  JsonRpcResponseStruct,
} from '@metamask/utils';
import * as ControllerUtils from '@metamask/controller-utils';

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
    state: { providerConfig: { chainId: chainId || CHAIN_IDS.MAINNET } },
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

  it('does not do validation for SIWE signature', async () => {
    const middlewareFunction = createMiddleware({
      securityAlertsEnabled: false,
    });

    const req = {
      method: 'personal_sign',
      params: [
        '0x6d6574616d61736b2e6769746875622e696f2077616e747320796f7520746f207369676e20696e207769746820796f757220457468657265756d206163636f756e743a0a3078393335653733656462396666353265323362616337663765303433613165636430366430353437370a0a492061636365707420746865204d6574614d61736b205465726d73206f6620536572766963653a2068747470733a2f2f636f6d6d756e6974792e6d6574616d61736b2e696f2f746f730a0a5552493a2068747470733a2f2f6d6574616d61736b2e6769746875622e696f0a56657273696f6e3a20310a436861696e2049443a20310a4e6f6e63653a2033323839313735370a4973737565642041743a20323032312d30392d33305431363a32353a32342e3030305a',
        '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
        'Example password',
      ],
      jsonrpc: '2.0',
      id: 2974202441,
      origin: 'https://metamask.github.io',
      networkClientId: 'mainnet',
      tabId: 1048745900,
      securityAlertResponse: undefined,
    };
    jest
      .spyOn(ControllerUtils, 'detectSIWE')
      .mockReturnValue({ isSIWEMessage: false, parsedMessage: null });

    await middlewareFunction(req, undefined, () => undefined);

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
