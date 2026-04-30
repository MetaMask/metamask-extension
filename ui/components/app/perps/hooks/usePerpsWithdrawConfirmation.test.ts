import { act } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes';
import { ConfirmationLoader } from '../../../../pages/confirmations/hooks/useConfirmationNavigation';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { ARBITRUM_USDC } from '../../../../pages/confirmations/constants/perps';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { usePerpsWithdrawConfirmation } from './usePerpsWithdrawConfirmation';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../store/actions', () => ({
  addTransaction: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

const mockAddTransaction = addTransaction as jest.MockedFunction<
  typeof addTransaction
>;
const mockFindNetworkClientIdByChainId =
  findNetworkClientIdByChainId as jest.MockedFunction<
    typeof findNetworkClientIdByChainId
  >;

const ARBITRUM_NETWORK_CLIENT_ID = 'arbitrum-mainnet';

describe('usePerpsWithdrawConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindNetworkClientIdByChainId.mockResolvedValue(
      ARBITRUM_NETWORK_CLIENT_ID,
    );
    mockAddTransaction.mockResolvedValue({
      id: 'tx-123',
      // The hook only reads `id`; cast to satisfy the broader return type.
    } as Awaited<ReturnType<typeof addTransaction>>);
  });

  it('creates a perpsWithdraw transaction on Arbitrum and navigates to the confirmation', async () => {
    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawConfirmation(),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith(
      CHAIN_IDS.ARBITRUM,
    );
    expect(mockAddTransaction).toHaveBeenCalledTimes(1);
    const [txParams, options] = mockAddTransaction.mock.calls[0];
    expect(txParams).toMatchObject({
      to: ARBITRUM_USDC.address,
      value: '0x0',
    });
    // ERC-20 `transfer(address,uint256)` selector with a 0-amount placeholder.
    expect(txParams.data?.startsWith('0xa9059cbb')).toBe(true);
    expect(options).toStrictEqual({
      networkClientId: ARBITRUM_NETWORK_CLIENT_ID,
      type: TransactionType.perpsWithdraw,
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: `${CONFIRM_TRANSACTION_ROUTE}/tx-123`,
      search: `loader=${ConfirmationLoader.CustomAmount}`,
    });
    expect(triggerResult).toStrictEqual({ transactionId: 'tx-123' });
  });

  it('includes goBackTo param when triggered from a non-root route', async () => {
    mockAddTransaction.mockResolvedValue({
      id: 'tx-return',
    } as Awaited<ReturnType<typeof addTransaction>>);

    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawConfirmation(),
      mockState,
      '/perps/trade/BTC',
    );

    await act(async () => {
      await result.current.trigger();
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: `${CONFIRM_TRANSACTION_ROUTE}/tx-return`,
      search: `loader=${ConfirmationLoader.CustomAmount}&goBackTo=%2Fperps%2Ftrade%2FBTC`,
    });
  });

  it('returns transaction id without navigating when navigateOnCreate is false', async () => {
    mockAddTransaction.mockResolvedValue({
      id: 'tx-456',
    } as Awaited<ReturnType<typeof addTransaction>>);

    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawConfirmation({ navigateOnCreate: false }),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockAddTransaction).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(triggerResult).toStrictEqual({ transactionId: 'tx-456' });
  });

  it('invokes onCreated callback with transaction id', async () => {
    mockAddTransaction.mockResolvedValue({
      id: 'tx-789',
    } as Awaited<ReturnType<typeof addTransaction>>);
    const onCreated = jest.fn();

    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawConfirmation({ onCreated }),
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
      () => usePerpsWithdrawConfirmation(),
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

    expect(mockAddTransaction).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(triggerResult).toBeNull();
    consoleErrorSpy.mockRestore();
  });

  it('returns null and logs when addTransaction throws', async () => {
    mockAddTransaction.mockRejectedValueOnce(new Error('boom'));
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawConfirmation(),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(triggerResult).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('prevents duplicate trigger while a request is in flight', async () => {
    let resolveAddTransaction: ((value: { id: string }) => void) | undefined;
    mockAddTransaction.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAddTransaction = resolve as (value: { id: string }) => void;
        }) as ReturnType<typeof addTransaction>,
    );

    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawConfirmation(),
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
    expect(mockAddTransaction).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAddTransaction?.({ id: 'tx-001' });
      await firstTriggerPromise;
    });
  });
});
