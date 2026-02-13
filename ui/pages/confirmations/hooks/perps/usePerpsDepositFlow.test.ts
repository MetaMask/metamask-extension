import { act } from '@testing-library/react-hooks';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes';
import { ConfirmationLoader } from '../useConfirmationNavigation';
import { createPerpsDepositTransaction } from './createPerpsDepositTransaction';
import { usePerpsDepositFlow } from './usePerpsDepositFlow';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('./createPerpsDepositTransaction', () => ({
  createPerpsDepositTransaction: jest.fn(),
}));

const mockCreatePerpsDepositTransaction =
  createPerpsDepositTransaction as jest.MockedFunction<
    typeof createPerpsDepositTransaction
  >;

describe('usePerpsDepositFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates transaction and navigates to confirmation by default', async () => {
    mockCreatePerpsDepositTransaction.mockResolvedValue({
      transactionId: 'tx-123',
    });

    const { result } = renderHookWithProvider(
      () => usePerpsDepositFlow({ returnTo: '/perps/home' }),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockCreatePerpsDepositTransaction).toHaveBeenCalledTimes(1);
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

  it('returns transaction id without navigating when navigateOnCreate is false', async () => {
    mockCreatePerpsDepositTransaction.mockResolvedValue({
      transactionId: 'tx-456',
    });

    const { result } = renderHookWithProvider(
      () =>
        usePerpsDepositFlow({
          navigateOnCreate: false,
        }),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(triggerResult).toStrictEqual({ transactionId: 'tx-456' });
  });

  it('invokes onCreated callback with transaction id', async () => {
    mockCreatePerpsDepositTransaction.mockResolvedValue({
      transactionId: 'tx-789',
    });
    const onCreated = jest.fn();

    const { result } = renderHookWithProvider(
      () => usePerpsDepositFlow({ onCreated }),
      mockState,
    );

    await act(async () => {
      await result.current.trigger();
    });

    expect(onCreated).toHaveBeenCalledWith('tx-789');
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
      () => usePerpsDepositFlow(),
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

    expect(mockCreatePerpsDepositTransaction).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(triggerResult).toBeNull();
    consoleErrorSpy.mockRestore();
  });

  it('prevents duplicate trigger while a request is in flight', async () => {
    let resolveCreate: ((value: { transactionId: string }) => void) | undefined;
    mockCreatePerpsDepositTransaction.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const { result } = renderHookWithProvider(
      () => usePerpsDepositFlow(),
      mockState,
    );

    let firstTriggerPromise:
      | Promise<Awaited<ReturnType<typeof result.current.trigger>>>
      | undefined;

    await act(async () => {
      firstTriggerPromise = result.current.trigger();
    });

    let secondTriggerResult: Awaited<
      ReturnType<typeof result.current.trigger>
    > = null;
    await act(async () => {
      secondTriggerResult = await result.current.trigger();
    });

    expect(secondTriggerResult).toBeNull();
    expect(mockCreatePerpsDepositTransaction).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCreate?.({ transactionId: 'tx-001' });
      await firstTriggerPromise;
    });
  });
});
