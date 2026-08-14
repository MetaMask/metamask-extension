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
  const cache: Record<string, unknown> = {};
  return {
    getAddressSecurityAlertResponse: (address: string) => cache[address],
    addAddressSecurityAlertResponse: (address: string, response: unknown) => {
      cache[address] = response;
    },
  };
};

jest.mock('../ppom/security-alerts-api', () => ({
  isSecurityAlertsAPIEnabled: jest.fn(),
}));

jest.mock('../../../../shared/lib/trust-signals', () => ({
  mapChainIdToSupportedEVMChain: jest.fn(),
}));

jest.mock('./security-alerts-api', () => ({
  scanAddressAndAddToCache: jest.fn().mockResolvedValue(undefined),
}));

const mockIsSecurityAlertsAPIEnabled = jest.requireMock(
  '../ppom/security-alerts-api',
).isSecurityAlertsAPIEnabled;

const mockMapChainIdToSupportedEVMChain = jest.requireMock(
  '../../../../shared/lib/trust-signals',
).mapChainIdToSupportedEVMChain;

const mockScanAddressAndAddToCache = jest.requireMock(
  './security-alerts-api',
).scanAddressAndAddToCache;

describe('scanUnvalidatedSignatureAddresses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSecurityAlertsAPIEnabled.mockReturnValue(true);
    mockMapChainIdToSupportedEVMChain.mockReturnValue('ethereum');
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
    });

    expect(mockScanAddressAndAddToCache).toHaveBeenCalledWith(
      MALICIOUS_ADDRESS,
      cache.getAddressSecurityAlertResponse,
      cache.addAddressSecurityAlertResponse,
      'ethereum',
    );
  });

  it('does nothing for non-typed-data methods', () => {
    scanUnvalidatedSignatureAddresses({
      request: { method: 'personal_sign', params: [SIGNER_ADDRESS, '0xdeadbeef'] },
      chainId: CHAIN_ID as `0x${string}`,
      appStateController: makeCache(),
    });

    expect(mockScanAddressAndAddToCache).not.toHaveBeenCalled();
  });

  it('does nothing for v1 typed data', () => {
    scanUnvalidatedSignatureAddresses({
      request: { method: 'eth_signTypedData', params: [SIGNER_ADDRESS, '{}'] },
      chainId: CHAIN_ID as `0x${string}`,
      appStateController: makeCache(),
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
    });

    expect(mockScanAddressAndAddToCache).not.toHaveBeenCalled();
  });

  it('does nothing on an unsupported chain', () => {
    mockMapChainIdToSupportedEVMChain.mockReturnValue(null);

    scanUnvalidatedSignatureAddresses({
      request: makeRequest(
        'eth_signTypedData_v4',
        SIGNER_ADDRESS,
        TYPED_DATA_V4,
      ),
      chainId: '0x999' as `0x${string}`,
      appStateController: makeCache(),
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
    });

    expect(mockScanAddressAndAddToCache).not.toHaveBeenCalled();
  });

  it('excludes permit spender when verifyingContract is present', () => {
    const data = {
      types: { Permit: [{ name: 'spender', type: 'address' }] },
      primaryType: 'Permit',
      domain: { verifyingContract: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' },
      message: { spender: MALICIOUS_ADDRESS },
    };

    scanUnvalidatedSignatureAddresses({
      request: makeRequest('eth_signTypedData_v4', SIGNER_ADDRESS, data),
      chainId: CHAIN_ID as `0x${string}`,
      appStateController: makeCache(),
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
    });

    expect(mockScanAddressAndAddToCache).toHaveBeenCalledWith(
      MALICIOUS_ADDRESS,
      expect.any(Function),
      expect.any(Function),
      'ethereum',
    );
  });

  it('handles malformed typed data without throwing', () => {
    expect(() =>
      scanUnvalidatedSignatureAddresses({
        request: { method: 'eth_signTypedData_v4', params: [SIGNER_ADDRESS, 'not-json{'] },
        chainId: CHAIN_ID as `0x${string}`,
        appStateController: makeCache(),
      }),
    ).not.toThrow();

    expect(mockScanAddressAndAddToCache).not.toHaveBeenCalled();
  });

  it('accepts typed data as an object in params[1]', () => {
    const cache = makeCache();
    scanUnvalidatedSignatureAddresses({
      request: { method: 'eth_signTypedData_v4', params: [SIGNER_ADDRESS, TYPED_DATA_V4] },
      chainId: CHAIN_ID as `0x${string}`,
      appStateController: cache,
    });

    expect(mockScanAddressAndAddToCache).toHaveBeenCalledWith(
      MALICIOUS_ADDRESS,
      expect.any(Function),
      expect.any(Function),
      'ethereum',
    );
  });
});
