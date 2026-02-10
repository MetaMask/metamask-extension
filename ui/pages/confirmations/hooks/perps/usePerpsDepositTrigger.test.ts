import { act } from '@testing-library/react-hooks';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes';
import { ConfirmationLoader } from '../useConfirmationNavigation';
import { usePerpsDepositTrigger } from './usePerpsDepositTrigger';
import { preparePerpsDepositTransaction } from './preparePerpsDepositTransaction';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('./preparePerpsDepositTransaction', () => ({
  preparePerpsDepositTransaction: jest.fn(),
}));

const mockPreparePerpsDepositTransaction =
  preparePerpsDepositTransaction as jest.MockedFunction<
    typeof preparePerpsDepositTransaction
  >;

describe('usePerpsDepositTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates transaction via prep service and navigates to confirmation', async () => {
    mockPreparePerpsDepositTransaction.mockResolvedValue({
      transactionId: 'tx-123',
    });

    const { result } = renderHookWithProvider(
      () => usePerpsDepositTrigger({ returnTo: '/perps/home' }),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockPreparePerpsDepositTransaction).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      {
        pathname: `${CONFIRM_TRANSACTION_ROUTE}/tx-123`,
        search: `loader=${ConfirmationLoader.CustomAmount}`,
      },
      {
        state: { returnTo: '/perps/home' },
      },
    );
    expect(triggerResult).toStrictEqual({ transactionId: 'tx-123' });
  });

  it('returns null when there is no selected account', async () => {
    const stateWithoutSelectedAccount = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        internalAccounts: {
          ...mockState.metamask.internalAccounts,
          selectedAccount: '',
        },
      },
    };

    const { result } = renderHookWithProvider(
      () => usePerpsDepositTrigger(),
      stateWithoutSelectedAccount,
    );

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockPreparePerpsDepositTransaction).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(triggerResult).toBeNull();
    consoleErrorSpy.mockRestore();
  });

  it('invokes onCreated callback with transaction id', async () => {
    mockPreparePerpsDepositTransaction.mockResolvedValue({
      transactionId: 'tx-789',
    });
    const onCreated = jest.fn();

    const { result } = renderHookWithProvider(
      () => usePerpsDepositTrigger({ onCreated }),
      mockState,
    );

    await act(async () => {
      await result.current.trigger();
    });

    expect(onCreated).toHaveBeenCalledWith('tx-789');
  });
});
