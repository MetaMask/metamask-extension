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
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { useSignatureRecipientAlerts } from './useSignatureRecipientAlerts';

jest.mock('../../../../hooks/useTrustSignals', () => ({
  useTrustSignals: jest.fn(),
  TrustSignalDisplayState: {
    Malicious: 'malicious',
    Warning: 'warning',
    Unknown: 'unknown',
  },
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(() => (key: string) => key),
}));

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

const expectedMaliciousAlert = {
  actions: [],
  field: RowAlertKey.InteractingWith,
  isBlocking: false,
  key: 'signatureRecipientTrustSignalMalicious',
  message: 'alertMessageAddressTrustSignalMalicious',
  reason: 'nameModalTitleMalicious',
  severity: Severity.Danger,
};

const expectedWarningAlert = {
  actions: [],
  field: RowAlertKey.InteractingWith,
  isBlocking: false,
  key: 'signatureRecipientTrustSignalWarning',
  message: 'alertMessageAddressTrustSignal',
  reason: 'nameModalTitleWarning',
  severity: Severity.Warning,
};

describe('useSignatureRecipientAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a malicious alert for a signature with a malicious `to`', () => {
    mockTrustSignalsFor({
      [MALICIOUS_ADDRESS]: TrustSignalDisplayState.Malicious,
    });

    const signature = buildTypedSignature('GenericSignatureType', {
      to: MALICIOUS_ADDRESS,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureRecipientAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    expect(result.current).toEqual([expectedMaliciousAlert]);
  });

  it('alerts for a malicious recipient even for an unrecognized primaryType (decode-independent)', () => {
    mockTrustSignalsFor({
      [MALICIOUS_ADDRESS]: TrustSignalDisplayState.Malicious,
    });

    const signature = buildTypedSignature('SomeUnknownAction', {
      recipient: MALICIOUS_ADDRESS,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureRecipientAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    expect(result.current).toEqual([expectedMaliciousAlert]);
  });

  it('returns a warning alert for a warning recipient', () => {
    mockTrustSignalsFor({
      [MALICIOUS_ADDRESS]: TrustSignalDisplayState.Warning,
    });

    const signature = buildTypedSignature('AnotherSignatureType', {
      to: MALICIOUS_ADDRESS,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureRecipientAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    expect(result.current).toEqual([expectedWarningAlert]);
  });

  it('returns an empty array when the recipient is not flagged', () => {
    mockTrustSignalsFor({});

    const signature = buildTypedSignature('GenericSignatureType', {
      to: MALICIOUS_ADDRESS,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureRecipientAlerts(),
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
      () => useSignatureRecipientAlerts(),
      getMockTypedSignConfirmStateForRequest(signature),
    );

    // `spender` is excluded, so no beneficiary is scanned and no alert fires.
    expect(result.current).toEqual([]);
    expect(mockUseTrustSignals).toHaveBeenCalledWith([]);
  });

  it('does not surface an alert for non-typed-data signatures', () => {
    mockTrustSignalsFor({
      [MALICIOUS_ADDRESS]: TrustSignalDisplayState.Malicious,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureRecipientAlerts(),
      getMockPersonalSignConfirmStateForRequest(
        unapprovedPersonalSignMsg as SignatureRequestType,
      ),
    );

    expect(result.current).toEqual([]);
  });
});
