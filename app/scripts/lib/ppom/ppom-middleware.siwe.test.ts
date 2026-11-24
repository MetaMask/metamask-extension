import { bytesToHex, stringToBytes } from '@metamask/utils';

import { CHAIN_IDS } from '../../../../shared/constants/network';
import { createPPOMMiddleware } from './ppom-middleware';
import { generateSecurityAlertId, validateRequestWithPPOM } from './ppom-util';

jest.mock('./ppom-util');

const CHECKSUMMED_ADDRESS = '0x935E73EDb9fF52E23BaC7F7e043A1ecD06d05477';

const buildSiwePersonalSignRequest = (address: string) => {
  const message = [
    'metamask.github.io wants you to sign in with your Ethereum account:',
    address,
    '',
    'I accept the MetaMask Terms of Service: https://community.metamask.io/tos',
    '',
    'URI: https://metamask.github.io',
    'Version: 1',
    'Chain ID: 1',
    'Nonce: 32891757',
    'Issued At: 2021-09-30T16:25:24.000Z',
  ].join('\n');

  return {
    method: 'personal_sign',
    params: [bytesToHex(stringToBytes(message)), address],
    jsonrpc: '2.0' as const,
    id: 1,
    origin: 'https://metamask.github.io',
    networkClientId: 'mainnet',
  };
};

const runMiddleware = async (address: string) => {
  const middleware = createPPOMMiddleware(
    {} as never,
    { state: { securityAlertsEnabled: true } } as never,
    {
      getNetworkConfigurationByNetworkClientId: () => ({
        chainId: CHAIN_IDS.MAINNET,
      }),
    } as never,
    { addSignatureSecurityAlertResponse: jest.fn() } as never,
    { listAccounts: () => [] } as never,
    jest.fn(),
  );

  // @ts-expect-error Passing a partial request for testing purposes
  await middleware(buildSiwePersonalSignRequest(address), undefined, jest.fn());
};

describe('PPOMMiddleware SIWE exemption (real parser)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(generateSecurityAlertId).mockReturnValue('123');
    globalThis.sentry = {
      withIsolationScope: jest
        .fn()
        .mockImplementation((fn) => fn({ setTags: jest.fn() })),
      startSpan: jest.fn().mockImplementation((_, fn) => fn({})),
      startSpanManual: jest.fn().mockImplementation((_, fn) => fn({})),
    };
  });

  it('skips PPOM validation for a checksummed SIWE address', async () => {
    await runMiddleware(CHECKSUMMED_ADDRESS);

    expect(validateRequestWithPPOM).not.toHaveBeenCalled();
  });

  it('runs PPOM validation for the same SIWE message with a lowercase address', async () => {
    await runMiddleware(CHECKSUMMED_ADDRESS.toLowerCase());

    expect(validateRequestWithPPOM).toHaveBeenCalledTimes(1);
  });
});
