import { type Hex, JsonRpcResponseStruct } from '@metamask/utils';
import * as ControllerUtils from '@metamask/controller-utils';

import { CHAIN_IDS } from '../../../../shared/constants/network';

import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import { mockNetworkState } from '../../../../test/stub/networks';
import { createPPOMMiddleware, PPOMMiddlewareRequest } from './ppom-middleware';
import {
  generateSecurityAlertId,
  handlePPOMError,
  isChainSupported,
  validateRequestWithPPOM,
} from './ppom-util';
import { SecurityAlertResponse } from './types';

jest.mock('./ppom-util');

const SECURITY_ALERT_ID_MOCK = '123';
const INTERNAL_ACCOUNT_ADDRESS = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b';

const SECURITY_ALERT_RESPONSE_MOCK: SecurityAlertResponse = {
  securityAlertId: SECURITY_ALERT_ID_MOCK,
  result_type: BlockaidResultType.Malicious,
  reason: BlockaidReason.permitFarming,
};

const REQUEST_MOCK = {
  params: [],
  id: '',
  jsonrpc: '2.0' as const,
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
        securityAlertsEnabled: securityAlertsEnabled ?? true,
      }),
    },
  };

  if (error) {
    preferenceController.store.getState = () => {
      throw error;
    };
  }

  const networkController = {
    state: mockNetworkState({ chainId: chainId || CHAIN_IDS.MAINNET }),
  };

  const appStateController = {
    addSignatureSecurityAlertResponse: () => undefined,
  };

  const accountsController = {
    listAccounts: () => [{ address: INTERNAL_ACCOUNT_ADDRESS }],
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accountsController as any,
    updateSecurityAlertResponse,
  );
};

describe('PPOMMiddleware', () => {
  const validateRequestWithPPOMMock = jest.mocked(validateRequestWithPPOM);
  const generateSecurityAlertIdMock = jest.mocked(generateSecurityAlertId);
  const handlePPOMErrorMock = jest.mocked(handlePPOMError);
  const isChainSupportedMock = jest.mocked(isChainSupported);

  beforeEach(() => {
    jest.resetAllMocks();

    validateRequestWithPPOMMock.mockResolvedValue(SECURITY_ALERT_RESPONSE_MOCK);
    generateSecurityAlertIdMock.mockReturnValue(SECURITY_ALERT_ID_MOCK);
    handlePPOMErrorMock.mockReturnValue(SECURITY_ALERT_RESPONSE_MOCK);
    isChainSupportedMock.mockResolvedValue(true);
  });

  it('updates alert response after validating request', async () => {
    const updateSecurityAlertResponse = jest.fn();

    const middlewareFunction = createMiddleware({
      updateSecurityAlertResponse,
    });

    const req = {
      ...REQUEST_MOCK,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };

    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct.TYPE },
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

    const req: PPOMMiddlewareRequest<(string | { to: string })[]> = {
      ...REQUEST_MOCK,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };

    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct.TYPE },
      () => undefined,
    );

    expect(req.securityAlertResponse?.reason).toBe(BlockaidReason.inProgress);
    expect(req.securityAlertResponse?.result_type).toBe(
      BlockaidResultType.Loading,
    );
  });

  it('does not do validation if the user has not enabled the preference', async () => {
    const middlewareFunction = createMiddleware({
      securityAlertsEnabled: false,
    });

    const req = {
      ...REQUEST_MOCK,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };

    // @ts-expect-error Passing in invalid input for testing purposes
    await middlewareFunction(req, undefined, () => undefined);

    expect(req.securityAlertResponse).toBeUndefined();
    expect(validateRequestWithPPOM).not.toHaveBeenCalled();
  });

  it('does not do validation if user is not on a supported network', async () => {
    isChainSupportedMock.mockResolvedValue(false);
    const middlewareFunction = createMiddleware({
      chainId: '0x2',
    });

    const req = {
      ...REQUEST_MOCK,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };

    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct.TYPE },
      () => undefined,
    );

    expect(req.securityAlertResponse).toBeUndefined();
    expect(validateRequestWithPPOM).not.toHaveBeenCalled();
  });

  it('does not do validation when request is not for confirmation method', async () => {
    const middlewareFunction = createMiddleware();

    const req = {
      ...REQUEST_MOCK,
      method: 'eth_someRequest',
      securityAlertResponse: undefined,
    };

    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct.TYPE },
      () => undefined,
    );

    expect(req.securityAlertResponse).toBeUndefined();
    expect(validateRequestWithPPOM).not.toHaveBeenCalled();
  });

  it('does not do validation when request is send to users own account', async () => {
    const middlewareFunction = createMiddleware();

    const req = {
      ...REQUEST_MOCK,
      params: [{ to: INTERNAL_ACCOUNT_ADDRESS }],
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };

    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct.TYPE },
      () => undefined,
    );

    expect(req.securityAlertResponse).toBeUndefined();
    expect(validateRequestWithPPOM).not.toHaveBeenCalled();
  });

  it('does not do validation for SIWE signature', async () => {
    const middlewareFunction = createMiddleware({
      securityAlertsEnabled: true,
    });

    const req = {
      method: 'personal_sign',
      params: [
        '0x6d6574616d61736b2e6769746875622e696f2077616e747320796f7520746f207369676e20696e207769746820796f757220457468657265756d206163636f756e743a0a3078393335653733656462396666353265323362616337663765303433613165636430366430353437370a0a492061636365707420746865204d6574614d61736b205465726d73206f6620536572766963653a2068747470733a2f2f636f6d6d756e6974792e6d6574616d61736b2e696f2f746f730a0a5552493a2068747470733a2f2f6d6574616d61736b2e6769746875622e696f0a56657273696f6e3a20310a436861696e2049443a20310a4e6f6e63653a2033323839313735370a4973737565642041743a20323032312d30392d33305431363a32353a32342e3030305a',
        '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
        'Example password',
      ],
      jsonrpc: '2.0' as const,
      id: 2974202441,
      origin: 'https://metamask.github.io',
      networkClientId: 'mainnet',
      tabId: 1048745900,
      securityAlertResponse: undefined,
    };
    jest.spyOn(ControllerUtils, 'detectSIWE').mockReturnValue({
      isSIWEMessage: true,
      parsedMessage: {
        address: '0x935e73edb9ff52e23bac7f7e049a1ecd06d05477',
        chainId: 1,
        domain: 'metamask.github.io',
        expirationTime: null,
        issuedAt: '2021-09-30T16:25:24.000Z',
        nonce: '32891757',
        notBefore: '2022-03-17T12:45:13.610Z',
        requestId: 'some_id',
        scheme: null,
        statement:
          'I accept the MetaMask Terms of Service: https://community.metamask.io/tos',
        uri: 'https://metamask.github.io',
        version: '1',
        resources: null,
      },
    });

    // @ts-expect-error Passing invalid input for testing purposes
    await middlewareFunction(req, undefined, () => undefined);

    expect(req.securityAlertResponse).toBeUndefined();
    expect(validateRequestWithPPOM).not.toHaveBeenCalled();
  });

  it('calls next method', async () => {
    const middlewareFunction = createMiddleware();
    const nextMock = jest.fn();

    await middlewareFunction(
      { ...REQUEST_MOCK, method: 'eth_sendTransaction' },
      { ...JsonRpcResponseStruct.TYPE },
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
      ...REQUEST_MOCK,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };

    await middlewareFunction(req, { ...JsonRpcResponseStruct.TYPE }, nextMock);

    expect(req.securityAlertResponse).toStrictEqual(
      SECURITY_ALERT_RESPONSE_MOCK,
    );

    expect(nextMock).toHaveBeenCalledTimes(1);
  });
});
