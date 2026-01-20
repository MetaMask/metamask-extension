import { type Hex, JsonRpcResponseStruct } from '@metamask/utils';
import { detectSIWE, SIWEMessage } from '@metamask/controller-utils';

import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import { createPPOMMiddleware, PPOMMiddlewareRequest } from './ppom-middleware';
import {
  generateSecurityAlertId,
  handlePPOMError,
  validateRequestWithPPOM,
} from './ppom-util';
import { SecurityAlertResponse } from './types';

jest.mock('./ppom-util');
jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  detectSIWE: jest.fn(),
}));

const SECURITY_ALERT_ID_MOCK = '123';
const INTERNAL_ACCOUNT_ADDRESS = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b';

const SECURITY_ALERT_RESPONSE_MOCK: SecurityAlertResponse = {
  securityAlertId: SECURITY_ALERT_ID_MOCK,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: BlockaidResultType.Malicious,
  reason: BlockaidReason.permitFarming,
};

const REQUEST_MOCK = {
  params: [],
  id: '',
  jsonrpc: '2.0' as const,
  origin: 'test.com',
  networkClientId: 'networkClientId',
};

const createMiddleware = (
  options: {
    chainId?: Hex | null;
    error?: Error;
    securityAlertsEnabled?: boolean;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
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
    state: {
      securityAlertsEnabled: securityAlertsEnabled ?? true,
    },
  };

  if (error) {
    Object.defineProperty(preferenceController, 'state', {
      get() {
        throw error;
      },
    });
  }

  const networkController = {
    getNetworkConfigurationByNetworkClientId: jest
      .fn()
      .mockReturnValue({ chainId: chainId || CHAIN_IDS.MAINNET }),
  };

  const appStateController = {
    addSignatureSecurityAlertResponse: () => undefined,
  };

  const accountsController = {
    listAccounts: () => [{ address: INTERNAL_ACCOUNT_ADDRESS }],
  };

  const middlewareFunction = createPPOMMiddleware(
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ppomController as any,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preferenceController as any,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    networkController as any,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appStateController as any,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accountsController as any,
    updateSecurityAlertResponse,
  );
  return { middlewareFunction, networkController };
};

describe('PPOMMiddleware', () => {
  const generateSecurityAlertIdMock = jest.mocked(generateSecurityAlertId);
  const handlePPOMErrorMock = jest.mocked(handlePPOMError);
  const detectSIWEMock = jest.mocked(detectSIWE);

  beforeEach(() => {
    jest.resetAllMocks();

    generateSecurityAlertIdMock.mockReturnValue(SECURITY_ALERT_ID_MOCK);
    handlePPOMErrorMock.mockReturnValue(SECURITY_ALERT_RESPONSE_MOCK);
    detectSIWEMock.mockReturnValue({ isSIWEMessage: false } as SIWEMessage);

    globalThis.sentry = {
      withIsolationScope: jest
        .fn()
        .mockImplementation((fn) => fn({ setTags: jest.fn() })),
      startSpan: jest.fn().mockImplementation((_, fn) => fn({})),
      startSpanManual: jest.fn().mockImplementation((_, fn) => fn({})),
    };
  });

  it('gets the network configuration for the request networkClientId', async () => {
    const { middlewareFunction, networkController } = createMiddleware();

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

    expect(
      networkController.getNetworkConfigurationByNetworkClientId,
    ).toHaveBeenCalledTimes(1);
    expect(
      networkController.getNetworkConfigurationByNetworkClientId,
    ).toHaveBeenCalledWith('networkClientId');
  });

  it('adds checking chain response to confirmation requests while validation is in progress', async () => {
    const updateSecurityAlertResponse = jest.fn();

    const { middlewareFunction } = createMiddleware({
      updateSecurityAlertResponse,
    });

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
    const { middlewareFunction } = createMiddleware({
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

  it('does not do validation when request is not for confirmation method', async () => {
    const { middlewareFunction } = createMiddleware();

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
    const { middlewareFunction } = createMiddleware();

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
    const { middlewareFunction } = createMiddleware({
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
    detectSIWEMock.mockReturnValue({ isSIWEMessage: true } as SIWEMessage);

    // @ts-expect-error Passing invalid input for testing purposes
    await middlewareFunction(req, undefined, () => undefined);

    expect(req.securityAlertResponse).toBeUndefined();
    expect(validateRequestWithPPOM).not.toHaveBeenCalled();
  });

  it('calls next method', async () => {
    const { middlewareFunction } = createMiddleware();
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

    const { middlewareFunction } = createMiddleware({ error });

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
