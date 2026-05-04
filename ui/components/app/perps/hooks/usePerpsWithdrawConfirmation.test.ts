import { act } from '@testing-library/react-hooks';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { ARBITRUM_USDC } from '../../../../pages/confirmations/constants/perps';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../../../pages/confirmations/hooks/useConfirmationNavigation';
import { usePerpsWithdrawConfirmation } from './usePerpsWithdrawConfirmation';

jest.mock('../../../../store/actions', () => ({
  addTransaction: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

jest.mock(
  '../../../../pages/confirmations/hooks/useConfirmationNavigation',
  () => {
    const actual = jest.requireActual(
      '../../../../pages/confirmations/hooks/useConfirmationNavigation',
    );
    return {
      ...actual,
      useConfirmationNavigation: jest.fn(),
    };
  },
);

const addTransactionMock = jest.mocked(addTransaction);
const findNetworkClientIdByChainIdMock = jest.mocked(
  findNetworkClientIdByChainId,
);
const useConfirmationNavigationMock = jest.mocked(useConfirmationNavigation);

const MOCK_NETWORK_CLIENT_ID = 'arbitrum-mainnet';
const MOCK_TX_ID = 'withdraw-tx-id';
const MOCK_TX_META = {
  id: MOCK_TX_ID,
} as Partial<TransactionMeta> as TransactionMeta;

describe('usePerpsWithdrawConfirmation', () => {
  const navigateToTransactionMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    findNetworkClientIdByChainIdMock.mockResolvedValue(MOCK_NETWORK_CLIENT_ID);
    addTransactionMock.mockResolvedValue(MOCK_TX_META);
    const mockConfirmationNavigation = {
      confirmations: [],
      count: 0,
      getIndex: jest.fn().mockReturnValue(0),
      navigateNext: jest.fn(),
      navigateToId: jest.fn(),
      navigateToIndex: jest.fn(),
      navigateToTransaction: navigateToTransactionMock,
    } satisfies ReturnType<typeof useConfirmationNavigation>;
    useConfirmationNavigationMock.mockReturnValue(mockConfirmationNavigation);
  });

  it('creates a perpsWithdraw transaction and navigates to custom amount confirmation', async () => {
    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawConfirmation(),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(findNetworkClientIdByChainIdMock).toHaveBeenCalledWith(
      CHAIN_IDS.ARBITRUM,
    );
    expect(addTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ARBITRUM_USDC.address,
        value: '0x0',
      }),
      {
        networkClientId: MOCK_NETWORK_CLIENT_ID,
        type: TransactionType.perpsWithdraw,
      },
    );
    expect(navigateToTransactionMock).toHaveBeenCalledWith(MOCK_TX_ID, {
      loader: ConfirmationLoader.CustomAmount,
    });
    expect(triggerResult).toStrictEqual({ transactionId: MOCK_TX_ID });
  });

  it('does not navigate when navigateOnCreate is false', async () => {
    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawConfirmation({ navigateOnCreate: false }),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(addTransactionMock).toHaveBeenCalledTimes(1);
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
    expect(triggerResult).toStrictEqual({ transactionId: MOCK_TX_ID });
  });

  it('invokes onCreated with transaction id', async () => {
    const onCreated = jest.fn();

    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawConfirmation({ onCreated }),
      mockState,
    );

    await act(async () => {
      await result.current.trigger();
    });

    expect(onCreated).toHaveBeenCalledWith(MOCK_TX_ID);
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

    expect(addTransactionMock).not.toHaveBeenCalled();
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
    expect(triggerResult).toBeNull();
    consoleErrorSpy.mockRestore();
  });

  it('returns null and logs when transaction creation fails', async () => {
    addTransactionMock.mockRejectedValueOnce(new Error('tx failed'));
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
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
