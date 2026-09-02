import { TransactionType } from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import {
  getMockConfirmStateForTransaction,
  getMockConfirmState,
} from '../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../test/data/mock-state.json';
import { Severity } from '../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../components/app/confirm/info/row/constants';
import useConfirmationAlerts from './useConfirmationAlerts';
import { useNoPayTokenQuotesAlert } from './alerts/transactions/useNoPayTokenQuotesAlert';
import { AlertsName } from './alerts/constants';

jest.mock('@metamask/react-data-query', () => ({
  useQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}));

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

jest.mock('./send/useAddressPoisoningDetection', () => ({
  useAddressPoisoningDetection: () => ({
    isPoisoningSuspect: false,
    bestMatch: null,
    matches: [],
    pending: false,
  }),
}));

// Mock the async simulation balance-changes fetch used by useBlockaidAlerts
// to prevent React Act warnings
jest.mock('./alerts/useSendingAssetsFiatTotal', () => ({
  useSendingAssetsFiatTotal: () => null,
}));

jest.mock('./alerts/transactions/useNoPayTokenQuotesAlert');

const useNoPayTokenQuotesAlertMock = jest.mocked(useNoPayTokenQuotesAlert);

describe('useConfirmationAlerts', () => {
  beforeEach(() => {
    useNoPayTokenQuotesAlertMock.mockReturnValue([]);
  });

  it('returns empty array if no alerts', () => {
    const { result } = renderHookWithConfirmContextProvider(
      useConfirmationAlerts,
      mockState,
    );
    expect(result.current).toEqual([]);
  });

  it('strips row field associations for MM Pay transactions', () => {
    useNoPayTokenQuotesAlertMock.mockReturnValue([
      {
        key: AlertsName.NoPayTokenQuotes,
        field: RowAlertKey.PayWith,
        message: 'No quotes available',
        reason: 'No quotes',
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);

    const confirmation = {
      ...genUnapprovedContractInteractionConfirmation(),
      type: TransactionType.batch,
      nestedTransactions: [{ type: TransactionType.moneyAccountDeposit }],
    };

    const { result } = renderHookWithConfirmContextProvider(
      useConfirmationAlerts,
      getMockConfirmStateForTransaction(confirmation),
    );

    expect(result.current).toEqual([
      {
        key: AlertsName.NoPayTokenQuotes,
        message: 'No quotes available',
        reason: 'No quotes',
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });

  it('keeps row field associations for non-pay transactions', () => {
    useNoPayTokenQuotesAlertMock.mockReturnValue([
      {
        key: AlertsName.NoPayTokenQuotes,
        field: RowAlertKey.PayWith,
        message: 'No quotes available',
        reason: 'No quotes',
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);

    const { result } = renderHookWithConfirmContextProvider(
      useConfirmationAlerts,
      getMockConfirmState(),
    );

    expect(result.current).toEqual([
      {
        key: AlertsName.NoPayTokenQuotes,
        field: RowAlertKey.PayWith,
        message: 'No quotes available',
        reason: 'No quotes',
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });
});
