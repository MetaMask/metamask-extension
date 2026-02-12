import {
  SimulationTokenStandard,
  TransactionMeta,
} from '@metamask/transaction-controller';

import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { useTokenTrustSignalAlerts } from './useTokenTrustSignalAlerts';

jest.mock('../../../../hooks/useTokenTrustSignals', () => ({
  useTokenTrustSignalsForAddresses: jest.fn(),
}));

jest.mock('../../../../../app/scripts/lib/ppom/security-alerts-api', () => ({
  isSecurityAlertsAPIEnabled: jest.fn(),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(() => (key: string) => key),
}));

const mockUseTokenTrustSignalsForAddresses = jest.requireMock(
  '../../../../hooks/useTokenTrustSignals',
).useTokenTrustSignalsForAddresses;
const mockIsSecurityAlertsAPIEnabled = jest.requireMock(
  '../../../../../app/scripts/lib/ppom/security-alerts-api',
).isSecurityAlertsAPIEnabled;

const MALICIOUS_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000bad';
const WARNING_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000001';
const SAFE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000002';

const expectedMaliciousAlert = {
  actions: [],
  field: RowAlertKey.IncomingTokens,
  isBlocking: false,
  key: 'tokenTrustSignalMalicious',
  message: 'alertMessageTokenTrustSignalMalicious',
  reason: 'alertReasonTokenTrustSignalMalicious',
  severity: Severity.Danger,
};

const expectedWarningAlert = {
  actions: [],
  field: RowAlertKey.IncomingTokens,
  isBlocking: false,
  key: 'tokenTrustSignalWarning',
  message: 'alertMessageTokenTrustSignalWarning',
  reason: 'alertReasonTokenTrustSignalWarning',
  severity: Severity.Warning,
};

const createMockTransactionWithTokenBalanceChanges = (
  tokenAddresses: string[],
  isDecrease = false,
) => {
  const contractInteraction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.GOERLI,
  });

  return {
    ...contractInteraction,
    simulationData: {
      tokenBalanceChanges: tokenAddresses.map((address) => ({
        address: address.toLowerCase(),
        standard: SimulationTokenStandard.erc20,
        isDecrease,
        difference: '1000000000000000000',
        previousBalance: '0x0',
        newBalance: '1000000000000000000',
      })),
    },
  } as unknown as TransactionMeta;
};

describe('useTokenTrustSignalAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSecurityAlertsAPIEnabled.mockReturnValue(true);
  });

  it('returns an empty array when there are no token balance changes', () => {
    mockUseTokenTrustSignalsForAddresses.mockReturnValue([]);

    const contractInteraction = genUnapprovedContractInteractionConfirmation({
      chainId: CHAIN_IDS.GOERLI,
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useTokenTrustSignalAlerts(),
      getMockConfirmStateForTransaction(contractInteraction as TransactionMeta),
    );

    expect(result.current).toEqual([]);
    expect(mockUseTokenTrustSignalsForAddresses).toHaveBeenCalledWith(
      CHAIN_IDS.GOERLI,
      undefined,
    );
  });

  it('returns an empty array when there are no incoming tokens (only outgoing)', () => {
    mockUseTokenTrustSignalsForAddresses.mockReturnValue([]);

    const transactionWithOutgoingTokens =
      createMockTransactionWithTokenBalanceChanges(
        [MALICIOUS_TOKEN_ADDRESS],
        true, // isDecrease = true (outgoing)
      );

    const { result } = renderHookWithConfirmContextProvider(
      () => useTokenTrustSignalAlerts(),
      getMockConfirmStateForTransaction(transactionWithOutgoingTokens),
    );

    expect(result.current).toEqual([]);
    expect(mockUseTokenTrustSignalsForAddresses).toHaveBeenCalledWith(
      CHAIN_IDS.GOERLI,
      undefined,
    );
  });

  it('returns malicious alert when receiving malicious tokens', () => {
    mockUseTokenTrustSignalsForAddresses.mockReturnValue([
      {
        state: TrustSignalDisplayState.Malicious,
        label: null,
      },
    ]);

    const transactionWithMaliciousToken =
      createMockTransactionWithTokenBalanceChanges([MALICIOUS_TOKEN_ADDRESS]);

    const { result } = renderHookWithConfirmContextProvider(
      () => useTokenTrustSignalAlerts(),
      getMockConfirmStateForTransaction(transactionWithMaliciousToken),
    );

    expect(result.current).toEqual([expectedMaliciousAlert]);
    expect(mockUseTokenTrustSignalsForAddresses).toHaveBeenCalledWith(
      CHAIN_IDS.GOERLI,
      [MALICIOUS_TOKEN_ADDRESS.toLowerCase()],
    );
  });

  it('returns warning alert when receiving warning tokens', () => {
    mockUseTokenTrustSignalsForAddresses.mockReturnValue([
      {
        state: TrustSignalDisplayState.Warning,
        label: null,
      },
    ]);

    const transactionWithWarningToken =
      createMockTransactionWithTokenBalanceChanges([WARNING_TOKEN_ADDRESS]);

    const { result } = renderHookWithConfirmContextProvider(
      () => useTokenTrustSignalAlerts(),
      getMockConfirmStateForTransaction(transactionWithWarningToken),
    );

    expect(result.current).toEqual([expectedWarningAlert]);
    expect(mockUseTokenTrustSignalsForAddresses).toHaveBeenCalledWith(
      CHAIN_IDS.GOERLI,
      [WARNING_TOKEN_ADDRESS.toLowerCase()],
    );
  });

  it('returns malicious alert when receiving both malicious and warning tokens (malicious takes precedence)', () => {
    mockUseTokenTrustSignalsForAddresses.mockReturnValue([
      {
        state: TrustSignalDisplayState.Malicious,
        label: null,
      },
      {
        state: TrustSignalDisplayState.Warning,
        label: null,
      },
    ]);

    const transactionWithMixedTokens =
      createMockTransactionWithTokenBalanceChanges([
        MALICIOUS_TOKEN_ADDRESS,
        WARNING_TOKEN_ADDRESS,
      ]);

    const { result } = renderHookWithConfirmContextProvider(
      () => useTokenTrustSignalAlerts(),
      getMockConfirmStateForTransaction(transactionWithMixedTokens),
    );

    expect(result.current).toEqual([expectedMaliciousAlert]);
    expect(mockUseTokenTrustSignalsForAddresses).toHaveBeenCalledWith(
      CHAIN_IDS.GOERLI,
      [
        MALICIOUS_TOKEN_ADDRESS.toLowerCase(),
        WARNING_TOKEN_ADDRESS.toLowerCase(),
      ],
    );
  });

  it('returns empty array when receiving safe/unknown tokens', () => {
    mockUseTokenTrustSignalsForAddresses.mockReturnValue([
      {
        state: TrustSignalDisplayState.Unknown,
        label: null,
      },
    ]);

    const transactionWithSafeToken =
      createMockTransactionWithTokenBalanceChanges([SAFE_TOKEN_ADDRESS]);

    const { result } = renderHookWithConfirmContextProvider(
      () => useTokenTrustSignalAlerts(),
      getMockConfirmStateForTransaction(transactionWithSafeToken),
    );

    expect(result.current).toEqual([]);
    expect(mockUseTokenTrustSignalsForAddresses).toHaveBeenCalledWith(
      CHAIN_IDS.GOERLI,
      [SAFE_TOKEN_ADDRESS.toLowerCase()],
    );
  });
});
