import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import {
  getMockTypedSignConfirmState,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../../test/data/confirmations/helper';
import {
  unapprovedTypedSignMsgV4,
  rawMessageV4,
} from '../../../../../test/data/confirmations/typed_sign';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { SignatureRequestType } from '../../types/confirm';
import { useSignatureAddressAlerts } from './useSignatureAddressAlerts';

jest.mock('../../../../hooks/useTrustSignals', () => ({
  useTrustSignals: jest.fn(),
  TrustSignalDisplayState: {
    Malicious: 'malicious',
    Warning: 'warning',
    Unknown: 'unknown',
  },
}));

jest.mock('../../../../../app/scripts/lib/ppom/security-alerts-api', () => ({
  isSecurityAlertsAPIEnabled: jest.fn(),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(() => (key: string) => key),
}));

const mockUseTrustSignals = jest.requireMock(
  '../../../../hooks/useTrustSignals',
).useTrustSignals;

const mockIsSecurityAlertsAPIEnabled = jest.requireMock(
  '../../../../../app/scripts/lib/ppom/security-alerts-api',
).isSecurityAlertsAPIEnabled;

const MALICIOUS_ADDRESS = '0x0000000000000000000000000000000000000bad';
const WARNING_ADDRESS = '0x0000000000000000000000000000000000000001';
const SIGNER_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const makeTypedSignV4 = (messageOverrides: object) =>
  ({
    ...unapprovedTypedSignMsgV4,
    msgParams: {
      ...unapprovedTypedSignMsgV4.msgParams,
      data: JSON.stringify({
        ...rawMessageV4,
        ...messageOverrides,
      }),
    },
  }) as SignatureRequestType;

describe('useSignatureAddressAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSecurityAlertsAPIEnabled.mockReturnValue(true);
    mockUseTrustSignals.mockReturnValue([]);
  });

  it('returns empty array when security alerts API is disabled', () => {
    mockIsSecurityAlertsAPIEnabled.mockReturnValue(false);

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmState(),
    );

    expect(result.current).toEqual([]);
  });

  it('returns empty array when no message fields contain addresses', () => {
    const request = makeTypedSignV4({
      types: { Greeting: [{ name: 'text', type: 'string' }] },
      primaryType: 'Greeting',
      message: { text: 'Hello world' },
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(request),
    );

    expect(result.current).toEqual([]);
  });

  it('returns a danger alert for a malicious address field', () => {
    const request = makeTypedSignV4({
      types: {
        Transfer: [{ name: 'recipient', type: 'address' }],
      },
      primaryType: 'Transfer',
      message: { recipient: MALICIOUS_ADDRESS },
    });

    mockUseTrustSignals.mockReturnValue([
      { state: TrustSignalDisplayState.Malicious },
    ]);

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(request),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      key: `signatureAddressTrustSignalMalicious_${MALICIOUS_ADDRESS}`,
      severity: Severity.Danger,
      field: RowAlertKey.InteractingWith,
      isBlocking: false,
    });
  });

  it('returns a warning alert for a flagged address field', () => {
    const request = makeTypedSignV4({
      types: {
        Transfer: [{ name: 'recipient', type: 'address' }],
      },
      primaryType: 'Transfer',
      message: { recipient: WARNING_ADDRESS },
    });

    mockUseTrustSignals.mockReturnValue([
      { state: TrustSignalDisplayState.Warning },
    ]);

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(request),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      key: `signatureAddressTrustSignalWarning_${WARNING_ADDRESS}`,
      severity: Severity.Warning,
      field: RowAlertKey.InteractingWith,
    });
  });

  it('excludes the signer address from alerts', () => {
    const request = makeTypedSignV4({
      types: { T: [{ name: 'addr', type: 'address' }] },
      primaryType: 'T',
      message: { addr: SIGNER_ADDRESS },
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(request),
    );

    expect(mockUseTrustSignals).toHaveBeenCalledWith([]);
    expect(result.current).toEqual([]);
  });

  it('excludes permit spender field from scan', () => {
    const request = makeTypedSignV4({
      types: {
        Permit: [{ name: 'spender', type: 'address' }],
      },
      domain: {
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      primaryType: 'Permit',
      message: { spender: MALICIOUS_ADDRESS },
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(request),
    );

    expect(mockUseTrustSignals).toHaveBeenCalledWith([]);
    expect(result.current).toEqual([]);
  });

  it('returns overflow caution alert when address cap is exceeded', () => {
    const addresses: Record<string, string> = {};
    const types: { name: string; type: string }[] = [];
    for (let i = 0; i < 12; i += 1) {
      const name = `addr${i}`;
      const addr = `0x${String(i).padStart(40, '0')}`;
      addresses[name] = addr;
      types.push({ name, type: 'address' });
    }

    const request = makeTypedSignV4({
      types: { Flood: types },
      primaryType: 'Flood',
      message: addresses,
    });

    mockUseTrustSignals.mockReturnValue(
      new Array(10).fill({ state: TrustSignalDisplayState.Unknown }),
    );

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(request),
    );

    expect(result.current.some((a) => a.key === 'signatureAddressScanIncomplete')).toBe(true);
    expect(
      result.current.find((a) => a.key === 'signatureAddressScanIncomplete'),
    ).toMatchObject({
      severity: Severity.Warning,
      field: RowAlertKey.InteractingWith,
    });
  });

  it('handles malformed typed data without throwing', () => {
    const request = {
      ...unapprovedTypedSignMsgV4,
      msgParams: {
        ...unapprovedTypedSignMsgV4.msgParams,
        data: 'not-valid-json{',
      },
    } as SignatureRequestType;

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(request),
    );

    expect(result.current).toEqual([]);
  });

  it('returns no alerts for unknown trust signal state', () => {
    const request = makeTypedSignV4({
      types: {
        Transfer: [{ name: 'recipient', type: 'address' }],
      },
      primaryType: 'Transfer',
      message: { recipient: '0x0000000000000000000000000000000000000002' },
    });

    mockUseTrustSignals.mockReturnValue([
      { state: TrustSignalDisplayState.Unknown },
    ]);

    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmStateForRequest(request),
    );

    expect(result.current).toEqual([]);
  });

  it('passes all extracted addresses to useTrustSignals', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useSignatureAddressAlerts(),
      getMockTypedSignConfirmState(),
    );

    expect(mockUseTrustSignals).toHaveBeenCalled();
    const calls = mockUseTrustSignals.mock.calls[0][0];
    expect(calls.length).toBeGreaterThan(0);
    calls.forEach((entry: { chainId: string }) => {
      expect(entry.chainId).toBe(CHAIN_IDS.GOERLI);
    });

    expect(result.current).toEqual([]);
  });
});
