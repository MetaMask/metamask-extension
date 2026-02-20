import { CHAIN_IDS, TransactionType } from '@metamask/transaction-controller';
import { Severity } from '../../../helpers/constants/design-system';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import { setBackgroundConnection } from '../../../store/background-connection';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { useInsufficientPayTokenBalanceAlert } from './alerts/transactions/useInsufficientPayTokenBalanceAlert';
import { usePerpsDepositInsufficientPayTokenBalanceAlert } from './perps/usePerpsDepositInsufficientPayTokenBalanceAlert';
import useConfirmationAlerts from './useConfirmationAlerts';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

// Mock async hooks used by useSpenderAlerts to prevent React Act warnings
jest.mock('../components/confirm/info/approve/hooks/use-is-nft', () => ({
  ...jest.requireActual('../components/confirm/info/approve/hooks/use-is-nft'),
  useIsNFT: () => ({ isNFT: false, pending: false }),
}));

jest.mock('../../../hooks/useAsync', () => ({
  ...jest.requireActual('../../../hooks/useAsync'),
  useAsyncResult: () => ({ value: null, pending: false, error: undefined }),
}));

jest.mock('./alerts/useSpenderAlerts', () => ({
  useSpenderAlerts: () => [],
}));

jest.mock('./alerts/transactions/useInsufficientPayTokenBalanceAlert', () => ({
  useInsufficientPayTokenBalanceAlert: jest.fn(),
}));

jest.mock('./perps/usePerpsDepositInsufficientPayTokenBalanceAlert', () => ({
  usePerpsDepositInsufficientPayTokenBalanceAlert: jest.fn(),
}));

describe('useConfirmationAlerts', () => {
  const backgroundConnectionMock = new Proxy(
    {},
    {
      get: () => jest.fn().mockResolvedValue(undefined),
    },
  );
  const useInsufficientPayTokenBalanceAlertMock = jest.mocked(
    useInsufficientPayTokenBalanceAlert,
  );
  const usePerpsDepositInsufficientPayTokenBalanceAlertMock = jest.mocked(
    usePerpsDepositInsufficientPayTokenBalanceAlert,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
    useInsufficientPayTokenBalanceAlertMock.mockReturnValue([]);
    usePerpsDepositInsufficientPayTokenBalanceAlertMock.mockReturnValue([]);
  });

  it('returns empty array if no alerts', () => {
    const { result } = renderHookWithConfirmContextProvider(
      useConfirmationAlerts,
      mockState,
    );
    expect(result.current).toEqual([]);
  });

  it('uses shared insufficient pay-token alerts for non-perps transactions', () => {
    const sharedAlert = {
      key: 'shared-alert',
      message: 'shared',
      severity: Severity.Info,
    } as Alert;
    const perpsAlert = {
      key: 'perps-alert',
      message: 'perps',
      severity: Severity.Info,
    } as Alert;
    useInsufficientPayTokenBalanceAlertMock.mockReturnValue([sharedAlert]);
    usePerpsDepositInsufficientPayTokenBalanceAlertMock.mockReturnValue([
      perpsAlert,
    ]);

    const transaction = genUnapprovedContractInteractionConfirmation({
      chainId: CHAIN_IDS.MAINNET,
    });
    const state = getMockConfirmStateForTransaction(transaction);

    const { result } = renderHookWithConfirmContextProvider(
      useConfirmationAlerts,
      state,
    );

    const alertKeys = result.current.map((alert) => alert.key);
    expect(alertKeys).toContain('shared-alert');
    expect(alertKeys).not.toContain('perps-alert');
  });

  it('uses perps insufficient pay-token alerts for perps deposit transactions', () => {
    const sharedAlert = {
      key: 'shared-alert',
      message: 'shared',
      severity: Severity.Info,
    } as Alert;
    const perpsAlert = {
      key: 'perps-alert',
      message: 'perps',
      severity: Severity.Info,
    } as Alert;
    useInsufficientPayTokenBalanceAlertMock.mockReturnValue([sharedAlert]);
    usePerpsDepositInsufficientPayTokenBalanceAlertMock.mockReturnValue([
      perpsAlert,
    ]);

    const transaction = {
      ...genUnapprovedContractInteractionConfirmation({
        chainId: CHAIN_IDS.MAINNET,
      }),
      type: TransactionType.perpsDeposit,
    };
    const state = getMockConfirmStateForTransaction(transaction);

    const { result } = renderHookWithConfirmContextProvider(
      useConfirmationAlerts,
      state,
    );

    const alertKeys = result.current.map((alert) => alert.key);
    expect(alertKeys).toContain('perps-alert');
    expect(alertKeys).not.toContain('shared-alert');
  });
});
