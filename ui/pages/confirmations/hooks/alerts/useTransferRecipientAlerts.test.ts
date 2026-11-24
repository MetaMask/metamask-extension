import { TransactionMeta } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';

import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../test/data/confirmations/token-transfer';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { useTransferRecipientAlerts } from './useTransferRecipientAlerts';

jest.mock('../../../../hooks/useTrustSignals', () => ({
  useTrustSignals: jest.fn(),
  useTrustSignal: jest.fn(),
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

// Payee encoded in genUnapprovedTokenTransferConfirmation calldata.
const TRANSFER_RECIPIENT = '0x2e0D7E8c45221FcA00d74a3609A0f7097035d09B';
const TOKEN_CONTRACT = '0x076146c765189d51be3160a2140cf80bfc73ad68';

const expectedMaliciousAlert = {
  actions: [],
  field: RowAlertKey.InteractingWith,
  isBlocking: false,
  key: `transferRecipientTrustSignalMalicious-${TRANSFER_RECIPIENT.toLowerCase()}`,
  message: 'alertMessageAddressTrustSignalMalicious',
  reason: 'alertReasonAddressTrustSignalMalicious',
  severity: Severity.Danger,
};

const expectedWarningAlert = {
  actions: [],
  field: RowAlertKey.InteractingWith,
  isBlocking: false,
  key: `transferRecipientTrustSignalWarning-${TRANSFER_RECIPIENT.toLowerCase()}`,
  message: 'alertMessageAddressTrustSignal',
  reason: 'alertReasonAddressTrustSignalWarning',
  severity: Severity.Warning,
};

describe('useTransferRecipientAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSecurityAlertsAPIEnabled.mockReturnValue(true);
    mockUseTrustSignals.mockReturnValue([
      { state: TrustSignalDisplayState.Unknown },
    ]);
  });

  it('returns an empty array when security alerts API is disabled', () => {
    mockIsSecurityAlertsAPIEnabled.mockReturnValue(false);
    mockUseTrustSignals.mockReturnValue([
      { state: TrustSignalDisplayState.Malicious },
    ]);

    const { result } = renderHookWithConfirmContextProvider(
      () => useTransferRecipientAlerts(),
      getMockConfirmStateForTransaction(
        genUnapprovedTokenTransferConfirmation() as TransactionMeta,
      ),
    );

    expect(result.current).toEqual([]);
  });

  it('returns a malicious alert for a token transfer whose payee is malicious', () => {
    mockUseTrustSignals.mockReturnValue([
      { state: TrustSignalDisplayState.Malicious },
    ]);

    const { result } = renderHookWithConfirmContextProvider(
      () => useTransferRecipientAlerts(),
      getMockConfirmStateForTransaction(
        genUnapprovedTokenTransferConfirmation() as TransactionMeta,
      ),
    );

    expect(result.current).toEqual([expectedMaliciousAlert]);
    expect(mockUseTrustSignals).toHaveBeenCalledWith([
      {
        value: TRANSFER_RECIPIENT,
        type: NameType.ETHEREUM_ADDRESS,
        chainId: CHAIN_IDS.GOERLI,
      },
    ]);
  });

  it('returns a warning alert for a token transfer whose payee is warning', () => {
    mockUseTrustSignals.mockReturnValue([
      { state: TrustSignalDisplayState.Warning },
    ]);

    const { result } = renderHookWithConfirmContextProvider(
      () => useTransferRecipientAlerts(),
      getMockConfirmStateForTransaction(
        genUnapprovedTokenTransferConfirmation() as TransactionMeta,
      ),
    );

    expect(result.current).toEqual([expectedWarningAlert]);
  });

  it('returns empty when the payee is the same as txParams.to', () => {
    mockUseTrustSignals.mockReturnValue([
      { state: TrustSignalDisplayState.Malicious },
    ]);

    const contractInteraction = genUnapprovedContractInteractionConfirmation({
      chainId: CHAIN_IDS.GOERLI,
    }) as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useTransferRecipientAlerts(),
      getMockConfirmStateForTransaction({
        ...contractInteraction,
        txParams: {
          ...contractInteraction.txParams,
          to: TOKEN_CONTRACT,
        },
      }),
    );

    expect(result.current).toEqual([]);
    expect(mockUseTrustSignals).toHaveBeenCalledWith([]);
  });

  it('returns empty when the payee is unknown', () => {
    mockUseTrustSignals.mockReturnValue([
      { state: TrustSignalDisplayState.Unknown },
    ]);

    const { result } = renderHookWithConfirmContextProvider(
      () => useTransferRecipientAlerts(),
      getMockConfirmStateForTransaction(
        genUnapprovedTokenTransferConfirmation() as TransactionMeta,
      ),
    );

    expect(result.current).toEqual([]);
  });
});
