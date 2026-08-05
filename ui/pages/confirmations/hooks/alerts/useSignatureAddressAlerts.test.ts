import {
  getMockTypedSignConfirmStateForRequest,
  getMockPersonalSignConfirmStateForRequest,
} from '../../../../../test/data/confirmations/helper';
import { unapprovedTypedSignMsgV4 } from '../../../../../test/data/confirmations/typed_sign';
import { unapprovedPersonalSignMsg } from '../../../../../test/data/confirmations/personal_sign';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { SignatureRequestType } from '../../types/confirm';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { shortenAddress } from '../../../../helpers/utils/util';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { useSignatureAddressAlerts } from './useSignatureAddressAlerts';

jest.mock('../../../../hooks/useTrustSignals', () => ({
  useTrustSignals: jest.fn(),
  TrustSignalDisplayState: {
    Malicious: 'malicious',
    Warning: 'warning',
    Unknown: 'unknown',
  },
}));

// Echo any substitutions so tests can assert the flagged field and address are
// named in the message.
jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(
    () => (key: string, subs?: string[]) =>
      subs ? `${key}|${subs.join('|')}` : key,
  ),
}));

jest.mock('../../../../../app/scripts/lib/ppom/security-alerts-api', () => ({
  isSecurityAlertsAPIEnabled: jest.fn(() => true),
}));

const mockIsSecurityAlertsAPIEnabled = jest.requireMock(
  '../../../../../app/scripts/lib/ppom/security-alerts-api',
).isSecurityAlertsAPIEnabled;

const mockUseTrustSignals = jest.requireMock(
  '../../../../hooks/useTrustSignals',
).useTrustSignals;

const MALICIOUS_ADDRESS = '0x52de2dd49a37b9926ae1e063f470ec2fd44f41ec';
const TOKEN_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

type MessageFields = {
  to?: string;
  recipient?: string;
  spender?: string;
};

const buildTypedSignature = (
  primaryType: string,
  fields: MessageFields,
): SignatureRequestType =>
  ({
    ...unapprovedTypedSignMsgV4,
    msgParams: {
      ...unapprovedTypedSignMsgV4.msgParams,
      data: JSON.stringify({
        domain: {
          name: 'USD Coin',
          version: '2',
          chainId: 1,
          verifyingContract: TOKEN_CONTRACT,
        },
        primaryType,
        message: {
          // Matches unapprovedTypedSignMsgV4.msgParams.from so the signer is
          // excluded by the extractor.
          from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          value: '4183963227800',
          ...fields,
        },
        types: {
          EIP712Domain: [{ name: 'name', type: 'string' }],
          [primaryType]: [
            { name: 'from', type: 'address' },
            { name: 'value', type: 'uint256' },
            ...Object.keys(fields).map((name) => ({ name, type: 'address' })),
          ],
        },
      }),
    },
  }) as SignatureRequestType;

// Mock returns a trust-signal result per requested address, driven by `flagged`.
const mockTrustSignalsFor = (
  flagged: Record<string, TrustSignalDisplayState>,
) => {
  mockUseTrustSignals.mockImplementation((requests: { value: string }[]) =>
    requests.map(({ value }) => ({
      state: flagged[value.toLowerCase()] ?? TrustSignalDisplayState.Unknown,
      label: null,
    })),
  );
};

const maliciousAlert = (field: string, address: string) => ({
  actions: [],
  field: RowAlertKey.InteractingWith,
  isBlocking: false,
  key: 'signatureAddressTrustSignalMalicious',
  message: `alertMessageSignatureAddressMalicious|${field}|${shortenAddress(
    address,
  )}`,
  reason: 'nameModalTitleMalicious',
  severity: Severity.Danger,
});

const warningAlert = (field: string, address: string) => ({
  actions: [],
  field: RowAlertKey.InteractingWith,
  isBlocking: false,
  key: 'signatureAddressTrustSignalWarning',
  message: `alertMessageSignatureAddressWarning|${field}|${shortenAddress(
    address,
  )}`,
  reason: 'nameModalTitleWarning',
  severity: Severity.Warning,
});

const expectedScanIncompleteAlert = {
  actions: [],
  field: RowAlertKey.InteractingWith,
  isBlocking: false,
  key: 'signatureAddressScanIncomplete',
  message: 'alertMessageSignatureAddressScanIncomplete',
  reason: 'alertReasonSignatureAddressScanIncomplete',
  severity: Severity.Warning,
};

const buildArraySignature = (count: number): SignatureRequestType =>
  ({
    ...unapprovedTypedSignMsgV4,
    msgParams: {
      ...unapprovedTypedSignMsgV4.msgParams,
      data: JSON.stringify({
        domain: {
          name: 'Airdrop',
          version: '1',
          chainId: 1,
          verifyingContract: TOKEN_CONTRACT,
        },
        primaryType: 'Airdrop',
        message: {
          recipients: Array.from(
            { length: count },
            (_, i) => `0x${(i + 1).toString(16).padStart(2, '0').repeat(20)}`,
          ),
        },
        types: {
          EIP712Domain: [{ name: 'name', type: 'string' }],
          Airdrop: [{ name: 'recipients', type: 'address[]' }],
        },
      }),
    },
  }) as SignatureRequestType;

describe('useSignatureAddressAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('names the flagged address and field for a malicious `to`', () => {
    mockTrustSignalsFor({
      [MALICIOUS_ADDRESS]: TrustSignalDisplayState.Malicious,
    });

    const signature = buildTypedSignature('GenericSignatureType', {
      to: MALICIOUS_ADDRESS,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    expect(result.current).toEqual([maliciousAlert('to', MALICIOUS_ADDRESS)]);
  });

  it('alerts for a malicious address even for an unrecognized primaryType (decode-independent)', () => {
    mockTrustSignalsFor({
      [MALICIOUS_ADDRESS]: TrustSignalDisplayState.Malicious,
    });

    const signature = buildTypedSignature('SomeUnknownAction', {
      recipient: MALICIOUS_ADDRESS,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    expect(result.current).toEqual([
      maliciousAlert('recipient', MALICIOUS_ADDRESS),
    ]);
  });

  it('returns a warning alert for a warning address', () => {
    mockTrustSignalsFor({
      [MALICIOUS_ADDRESS]: TrustSignalDisplayState.Warning,
    });

    const signature = buildTypedSignature('AnotherSignatureType', {
      to: MALICIOUS_ADDRESS,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    expect(result.current).toEqual([warningAlert('to', MALICIOUS_ADDRESS)]);
  });

  it('returns an empty array when the address is not flagged', () => {
    mockTrustSignalsFor({});

    const signature = buildTypedSignature('GenericSignatureType', {
      to: MALICIOUS_ADDRESS,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    expect(result.current).toEqual([]);
  });

  it('does not alert on the permit `spender` field (owned by useSpenderAlerts)', () => {
    mockTrustSignalsFor({
      [MALICIOUS_ADDRESS]: TrustSignalDisplayState.Malicious,
    });

    const signature = buildTypedSignature('Permit', {
      spender: MALICIOUS_ADDRESS,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    // `spender` is excluded, so no address is scanned and no alert fires.
    expect(result.current).toEqual([]);
    expect(mockUseTrustSignals).toHaveBeenCalledWith([]);
  });

  it('alerts on a `spender` field when the primaryType is not a permit', () => {
    mockTrustSignalsFor({
      [MALICIOUS_ADDRESS]: TrustSignalDisplayState.Malicious,
    });

    const signature = buildTypedSignature('ClaimOrder', {
      spender: MALICIOUS_ADDRESS,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    expect(result.current).toEqual([
      maliciousAlert('spender', MALICIOUS_ADDRESS),
    ]);
  });

  it('returns an empty array when the security-alerts API is disabled', () => {
    mockIsSecurityAlertsAPIEnabled.mockReturnValueOnce(false);
    mockTrustSignalsFor({
      [MALICIOUS_ADDRESS]: TrustSignalDisplayState.Malicious,
    });

    const signature = buildTypedSignature('GenericSignatureType', {
      to: MALICIOUS_ADDRESS,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    expect(result.current).toEqual([]);
  });

  it('surfaces a caution when the signature exceeds the address cap', () => {
    mockTrustSignalsFor({});

    const signature = buildArraySignature(15);

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    expect(result.current).toEqual([expectedScanIncompleteAlert]);
  });

  it('does not surface the address-count caution at or below the cap', () => {
    mockTrustSignalsFor({});

    const signature = buildArraySignature(10);

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    expect(result.current).toEqual([]);
  });

  it('does not surface an alert for non-typed-data signatures', () => {
    mockTrustSignalsFor({
      [MALICIOUS_ADDRESS]: TrustSignalDisplayState.Malicious,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockPersonalSignConfirmStateForRequest(
        unapprovedPersonalSignMsg as SignatureRequestType,
      ),
    );

    expect(result.current).toEqual([]);
  });
});
