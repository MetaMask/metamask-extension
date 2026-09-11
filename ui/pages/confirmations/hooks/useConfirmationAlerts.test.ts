import { TransactionType } from '@metamask/transaction-controller';
import { act } from '@testing-library/react';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import {
  getMockConfirmStateForTransaction,
  getMockConfirmState,
} from '../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../test/data/mock-state.json';
import { Severity } from '../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../components/app/confirm/info/row/constants';
import * as Actions from '../../../store/actions';
import useConfirmationAlerts from './useConfirmationAlerts';
import { useNoPayTokenQuotesAlert } from './alerts/transactions/useNoPayTokenQuotesAlert';
import { AlertsName } from './alerts/constants';

jest.mock('@metamask/react-data-query', () => ({
  useQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}));

jest.mock('../../../store/background-connection', () => ({
  ...jest.requireActual('../../../store/background-connection'),
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
  callBackgroundMethod: jest.fn(),
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

async function renderAlertsHook(state: Record<string, unknown>) {
  let renderResult!: ReturnType<typeof renderHookWithConfirmContextProvider>;
  await act(async () => {
    renderResult = renderHookWithConfirmContextProvider(
      useConfirmationAlerts,
      state,
    );
    // Flush microtasks from mocked background / last-confirmation reads.
    await Promise.resolve();
  });
  return renderResult;
}

describe('useConfirmationAlerts', () => {
  beforeEach(() => {
    useNoPayTokenQuotesAlertMock.mockReturnValue([]);
    jest
      .spyOn(Actions, 'getLastInteractedConfirmationInfo')
      .mockResolvedValue(undefined);
    jest
      .spyOn(Actions, 'setLastInteractedConfirmationInfo')
      .mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty array if no alerts', async () => {
    const { result } = await renderAlertsHook(mockState);
    expect(result.current).toEqual([]);
  });

  it('strips row field associations for MM Pay transactions', async () => {
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

    const { result } = await renderAlertsHook(
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

  it('keeps row field associations for non-pay transactions', async () => {
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

    const { result } = await renderAlertsHook(getMockConfirmState());

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
