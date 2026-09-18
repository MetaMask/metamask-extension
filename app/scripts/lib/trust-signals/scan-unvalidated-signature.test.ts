import type { ScanAddressResponse } from '../../../../shared/lib/trust-signals';
import { scanUnvalidatedSignatureAddresses } from './scan-unvalidated-signature';

const MALICIOUS_ADDRESS = '0x0000000000000000000000000000000000000bad';
const SIGNER_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const CHAIN_ID = '0x1';

const TYPED_DATA_V4 = {
  types: {
    Transfer: [{ name: 'recipient', type: 'address' }],
  },
  primaryType: 'Transfer',
  message: { recipient: MALICIOUS_ADDRESS },
};

const makeRequest = (
  method: string,
  signer: string,
  data: unknown,
): { method: string; params: unknown[] } => ({
  method,
  params: [signer, JSON.stringify(data)],
});

const makeCache = () => {
  const cache: Record<string, ScanAddressResponse> = {};
  return {
    getAddressSecurityAlertResponse: (address: string) => cache[address],
    addAddressSecurityAlertResponse: (
      address: string,
      response: ScanAddressResponse,
    ) => {
      cache[address] = response;
    },
  };
};

const phishingController = {
  scanAddress: jest.fn(),
};

jest.mock('@metamask/phishing-controller', () => ({
  ...jest.requireActual('@metamask/phishing-controller'),
  isAddressScanSupportedChainId: jest.fn(),
}));

jest.mock('../ppom/security-alerts-api', () => ({
  isSecurityAlertsAPIEnabled: jest.fn(),
}));

jest.mock('./security-alerts-api', () => ({
  scanAddressAndAddToCache: jest.fn().mockResolvedValue(undefined),
}));

const mockIsAddressScanSupportedChainId = jest.requireMock(
  '@metamask/phishing-controller',
).isAddressScanSupportedChainId;

const mockIsSecurityAlertsAPIEnabled = jest.requireMock(
  '../ppom/security-alerts-api',
).isSecurityAlertsAPIEnabled;

const mockScanAddressAndAddToCache = jest.requireMock(
  './security-alerts-api',
).scanAddressAndAddToCache;

describe('scanUnvalidatedSignatureAddresses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSecurityAlertsAPIEnabled.mockReturnValue(true);
    mockIsAddressScanSupportedChainId.mockReturnValue(true);
  });

  it('scans extracted address fields after PPOM passes', () => {
    const cache = makeCache();
    scanUnvalidatedSignatureAddresses({
      request: makeRequest(
        'eth_signTypedData_v4',
        SIGNER_ADDRESS,
        TYPED_DATA_V4,
      ),
      chainId: CHAIN_ID as `0x${string}`,
      appStateController: cache,
      phishingController,
    });

    expect(mockScanAddressAndAddToCache).toHaveBeenCalledWith(
      MALICIOUS_ADDRESS,
      cache.getAddressSecurityAlertResponse,
      cache.addAddressSecurityAlertResponse,
      CHAIN_ID,
      phishingController,
    );
  });

  it('does nothing for non-typed-data methods', () => {
    scanUnvalidatedSignatureAddresses({
      request: {
        method: 'personal_sign',
        params: [SIGNER_ADDRESS, '0xdeadbeef'],
      },
      chainId: CHAIN_ID as `0x${string}`,
      appStateController: makeCache(),
      phishingController,
    });

    expect(mockScanAddressAndAddToCache).not.toHaveBeenCalled();
  });

  it('does nothing for v1 typed data', () => {
    scanUnvalidatedSignatureAddresses({
      request: { method: 'eth_signTypedData', params: [SIGNER_ADDRESS, '{}'] },
      chainId: CHAIN_ID as `0x${string}`,
      appStateController: makeCache(),
      phishingController,
    });

    expect(mockScanAddressAndAddToCache).not.toHaveBeenCalled();
  });

  it('does nothing when security alerts API is disabled', () => {
    mockIsSecurityAlertsAPIEnabled.mockReturnValue(false);

    scanUnvalidatedSignatureAddresses({
      request: makeRequest(
        'eth_signTypedData_v4',
        SIGNER_ADDRESS,
        TYPED_DATA_V4,
      ),
      chainId: CHAIN_ID as `0x${string}`,
      appStateController: makeCache(),
      phishingController,
    });

    expect(mockScanAddressAndAddToCache).not.toHaveBeenCalled();
  });

  it('does nothing on an unsupported chain', () => {
    mockIsAddressScanSupportedChainId.mockReturnValue(false);

    scanUnvalidatedSignatureAddresses({
      request: makeRequest(
        'eth_signTypedData_v4',
        SIGNER_ADDRESS,
        TYPED_DATA_V4,
      ),
      chainId: '0x999' as `0x${string}`,
      appStateController: makeCache(),
      phishingController,
    });

    expect(mockScanAddressAndAddToCache).not.toHaveBeenCalled();
  });

  it('excludes the signer address', () => {
    const data = {
      types: { T: [{ name: 'recipient', type: 'address' }] },
      primaryType: 'T',
      message: { recipient: SIGNER_ADDRESS },
    };

    scanUnvalidatedSignatureAddresses({
      request: makeRequest('eth_signTypedData_v4', SIGNER_ADDRESS, data),
      chainId: CHAIN_ID as `0x${string}`,
      appStateController: makeCache(),
      phishingController,
    });

    expect(mockScanAddressAndAddToCache).not.toHaveBeenCalled();
  });

  it('excludes permit spender when verifyingContract is present', () => {
    const data = {
      types: { Permit: [{ name: 'spender', type: 'address' }] },
      primaryType: 'Permit',
      domain: {
        verifyingContract: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      },
      message: { spender: MALICIOUS_ADDRESS },
    };

    scanUnvalidatedSignatureAddresses({
      request: makeRequest('eth_signTypedData_v4', SIGNER_ADDRESS, data),
      chainId: CHAIN_ID as `0x${string}`,
      appStateController: makeCache(),
      phishingController,
    });

    expect(mockScanAddressAndAddToCache).not.toHaveBeenCalled();
  });

  it('does not exclude permit spender when verifyingContract is absent', () => {
    const data = {
      types: { Permit: [{ name: 'spender', type: 'address' }] },
      primaryType: 'Permit',
      domain: {},
      message: { spender: MALICIOUS_ADDRESS },
    };

    scanUnvalidatedSignatureAddresses({
      request: makeRequest('eth_signTypedData_v4', SIGNER_ADDRESS, data),
      chainId: CHAIN_ID as `0x${string}`,
      appStateController: makeCache(),
      phishingController,
    });

    expect(mockScanAddressAndAddToCache).toHaveBeenCalledWith(
      MALICIOUS_ADDRESS,
      expect.any(Function),
      expect.any(Function),
      CHAIN_ID,
      phishingController,
    );
  });

  it('handles malformed typed data without throwing', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() =>
      scanUnvalidatedSignatureAddresses({
        request: {
          method: 'eth_signTypedData_v4',
          params: [SIGNER_ADDRESS, 'not-json{'],
        },
        chainId: CHAIN_ID as `0x${string}`,
        appStateController: makeCache(),
        phishingController,
      }),
    ).not.toThrow();

    expect(mockScanAddressAndAddToCache).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('accepts typed data as an object in params[1]', () => {
    const cache = makeCache();
    scanUnvalidatedSignatureAddresses({
      request: {
        method: 'eth_signTypedData_v4',
        params: [SIGNER_ADDRESS, TYPED_DATA_V4],
      },
      chainId: CHAIN_ID as `0x${string}`,
      appStateController: cache,
      phishingController,
    });

    expect(mockScanAddressAndAddToCache).toHaveBeenCalledWith(
      MALICIOUS_ADDRESS,
      expect.any(Function),
      expect.any(Function),
      CHAIN_ID,
      phishingController,
    );
  });
});
