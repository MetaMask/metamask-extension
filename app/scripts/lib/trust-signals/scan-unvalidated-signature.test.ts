import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { ResultType } from '../../../../shared/lib/trust-signals';
import { scanUnvalidatedSignatureAddresses } from './scan-unvalidated-signature';
import { scanAddressAndAddToCache } from './security-alerts-api';

jest.mock('./security-alerts-api');

jest.mock('../ppom/security-alerts-api', () => ({
  isSecurityAlertsAPIEnabled: jest.fn(() => true),
}));

const mockIsSecurityAlertsAPIEnabled = jest.requireMock(
  '../ppom/security-alerts-api',
).isSecurityAlertsAPIEnabled;

const SIGNER = '0xabcdef0123456789012345678901234567890123';
const RECIPIENT = '0x1234567890123456789012345678901234567890';
const SPENDER = '0x9876543210987654321098765432109876543210';

const mockScan = scanAddressAndAddToCache as jest.MockedFunction<
  typeof scanAddressAndAddToCache
>;

const createAppStateController = () => ({
  getAddressSecurityAlertResponse: jest.fn().mockReturnValue(undefined),
  addAddressSecurityAlertResponse: jest.fn(),
});

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/u;

// Build a minimal but valid EIP-712 payload whose schema types each address-
// shaped message value as `address` (so the schema-driven extractor collects it).
const buildTypedData = (
  message: Record<string, unknown>,
  primaryType = 'X',
  {
    verifyingContract = '0x0000000000000000000000000000000000000001',
  }: {
    verifyingContract?: string;
  } = {},
) =>
  JSON.stringify({
    domain: verifyingContract ? { verifyingContract } : {},
    message,
    primaryType,
    types: {
      [primaryType]: Object.keys(message).map((name) => ({
        name,
        type: EVM_ADDRESS_REGEX.test(String(message[name]))
          ? 'address'
          : 'string',
      })),
    },
  });

const run = (
  method: string,
  params: unknown,
  chainId: Hex = CHAIN_IDS.MAINNET as Hex,
) => {
  const appStateController = createAppStateController();
  scanUnvalidatedSignatureAddresses({
    request: { method, params },
    chainId,
    appStateController,
  });
  return appStateController;
};

describe('scanUnvalidatedSignatureAddresses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScan.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: ResultType.Benign,
      label: '',
    });
  });

  it('scans an address field embedded in an unrecognized typed-data message', () => {
    run(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
      SIGNER,
      buildTypedData({ to: RECIPIENT }, 'ReceiveWithAuthorization'),
    ]);

    expect(mockScan).toHaveBeenCalledTimes(1);
    expect(mockScan).toHaveBeenCalledWith(
      RECIPIENT,
      expect.any(Function),
      expect.any(Function),
      'ethereum',
    );
  });

  it('scans multiple address fields and excludes the signer', () => {
    run(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
      SIGNER,
      buildTypedData({ spender: SPENDER, recipient: RECIPIENT, from: SIGNER }),
    ]);

    const scanned = mockScan.mock.calls.map((call) => call[0]);
    expect(scanned).toEqual(expect.arrayContaining([SPENDER, RECIPIENT]));
    expect(scanned).not.toContain(SIGNER);
  });

  it('excludes the top-level spender for permit types with a verifying contract', () => {
    run(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
      SIGNER,
      buildTypedData({ spender: SPENDER, recipient: RECIPIENT }, 'Permit'),
    ]);

    const scanned = mockScan.mock.calls.map((call) => call[0]);
    expect(scanned).toContain(RECIPIENT);
    expect(scanned).not.toContain(SPENDER);
  });

  it('scans the top-level spender for permit types without a verifying contract', () => {
    run(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
      SIGNER,
      buildTypedData({ spender: SPENDER, recipient: RECIPIENT }, 'Permit', {
        verifyingContract: '',
      }),
    ]);

    const scanned = mockScan.mock.calls.map((call) => call[0]);
    expect(scanned).toEqual(expect.arrayContaining([SPENDER, RECIPIENT]));
  });

  it('scans a field named spender for non-permit types', () => {
    run(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
      SIGNER,
      buildTypedData({ spender: SPENDER, recipient: RECIPIENT }, 'X'),
    ]);

    const scanned = mockScan.mock.calls.map((call) => call[0]);
    expect(scanned).toEqual(expect.arrayContaining([SPENDER, RECIPIENT]));
  });

  it('is a no-op for non-typed-data methods', () => {
    run(MESSAGE_TYPE.PERSONAL_SIGN, [SIGNER, '0xdeadbeef']);
    expect(mockScan).not.toHaveBeenCalled();
  });

  it('is a no-op when params are missing the typed data payload', () => {
    run(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [SIGNER]);
    expect(mockScan).not.toHaveBeenCalled();
  });

  it('is a no-op when the security-alerts API is disabled', () => {
    mockIsSecurityAlertsAPIEnabled.mockReturnValueOnce(false);
    run(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [
      SIGNER,
      buildTypedData({ to: RECIPIENT }),
    ]);
    expect(mockScan).not.toHaveBeenCalled();
  });

  it('is a no-op for unsupported chains', () => {
    run(
      MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
      [SIGNER, buildTypedData({ to: RECIPIENT })],
      '0xdeadbeef' as Hex,
    );
    expect(mockScan).not.toHaveBeenCalled();
  });

  it('does not throw on malformed typed data', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() =>
      run(MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4, [SIGNER, '{not json']),
    ).not.toThrow();
    expect(mockScan).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
