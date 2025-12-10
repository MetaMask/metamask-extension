import { GasFeeToken, TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { act } from '@testing-library/react';

import { NATIVE_TOKEN_ADDRESS } from '../../../../shared/constants/transaction';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import { updateSelectedGasFeeToken } from '../../../store/controller-actions/transaction-controller';
import { forceUpdateMetamaskState } from '../../../store/actions';
import { GAS_FEE_TOKEN_MOCK } from '../../../../test/data/confirmations/gas';
import { useAutomaticGasFeeTokenSelect } from './useAutomaticGasFeeTokenSelect';
import { useIsGaslessSupported } from './gas/useIsGaslessSupported';
import { useHasInsufficientBalance } from './useHasInsufficientBalance';

jest.mock('../../../store/controller-actions/transaction-controller');
jest.mock('./useHasInsufficientBalance');
jest.mock('../../../../shared/modules/selectors');
jest.mock('./gas/useIsGaslessSupported');

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  forceUpdateMetamaskState: jest.fn(),
}));

function runHook({
  gasFeeTokens,
  selectedGasFeeToken,
}: {
  gasFeeTokens?: GasFeeToken[];
  selectedGasFeeToken?: Hex;
} = {}) {
  const state = getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      gasFeeTokens: gasFeeTokens ?? [GAS_FEE_TOKEN_MOCK],
      selectedGasFeeToken,
    }),
  );

  const result = renderHookWithConfirmContextProvider(
    useAutomaticGasFeeTokenSelect,
    state,
  );

  return { ...result, state };
}

async function flushAsyncUpdates() {
  await act(async () => {
    await flushPromises();
  });
}

describe('useAutomaticGasFeeTokenSelect', () => {
  const updateSelectedGasFeeTokenMock = jest.mocked(updateSelectedGasFeeToken);
  const forceUpdateMetamaskStateMock = jest.mocked(forceUpdateMetamaskState);
  const useIsGaslessSupportedMock = jest.mocked(useIsGaslessSupported);

  const useHasInsufficientBalanceMock = jest.mocked(useHasInsufficientBalance);

  beforeEach(() => {
    jest.resetAllMocks();
    useHasInsufficientBalanceMock.mockReturnValue({
      hasInsufficientBalance: true,
      nativeCurrency: 'ETH',
    });
    updateSelectedGasFeeTokenMock.mockResolvedValue();
    forceUpdateMetamaskStateMock.mockResolvedValue();

    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: true,
      pending: false,
    });
  });

  it('selects first gas fee token', async () => {
    const { store } = runHook();

    await flushAsyncUpdates();

    if (!store) {
      throw new Error('Expected store to be defined');
    }

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(1);
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledWith(
      expect.any(String),
      GAS_FEE_TOKEN_MOCK.tokenAddress,
    );
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(1);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledWith(store.dispatch);
  });

  it('does not select first gas fee token if gas fee token already selected', async () => {
    runHook({ selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress });

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(0);
  });

  it('does not select first gas fee token if no gas fee tokens', async () => {
    runHook({ gasFeeTokens: [] });

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(0);
  });

  it('selects first gas fee token on rerender when selection becomes eligible', async () => {
    const { rerender, state, store } = runHook({
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    });

    if (!store) {
      throw new Error('Expected store to be defined');
    }

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(0);

    const transactionMeta = state.metamask
      .transactions[0] as unknown as TransactionMeta;

    act(() => {
      transactionMeta.selectedGasFeeToken = undefined;
    });

    rerender();

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(1);
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledWith(
      expect.any(String),
      GAS_FEE_TOKEN_MOCK.tokenAddress,
    );
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(1);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledWith(store.dispatch);
  });

  it('does not select first gas fee token if gasless not supported', async () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: false,
      isSmartTransaction: false,
      pending: false,
    });

    runHook();

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(0);
  });

  it('does not select first gas fee token if sufficient balance', async () => {
    useHasInsufficientBalanceMock.mockReturnValue({
      hasInsufficientBalance: false,
      nativeCurrency: 'ETH',
    });

    runHook();

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(0);
  });

  it('selects first gas fee token when insufficient balance appears after first render', async () => {
    let balanceInfo = {
      hasInsufficientBalance: false,
      nativeCurrency: 'ETH',
    };
    useHasInsufficientBalanceMock.mockImplementation(() => balanceInfo);

    const { rerender, store } = runHook({
      selectedGasFeeToken: undefined,
    });

    if (!store) {
      throw new Error('Expected store to be defined');
    }

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(0);

    balanceInfo = {
      hasInsufficientBalance: true,
      nativeCurrency: 'ETH',
    };

    rerender();

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(1);
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledWith(
      expect.any(String),
      GAS_FEE_TOKEN_MOCK.tokenAddress,
    );
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(1);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledWith(store.dispatch);
  });

  it('does not select first gas fee token after firstCheck is set to false', async () => {
    const { rerender, state, store } = runHook();

    if (!store) {
      throw new Error('Expected store to be defined');
    }

    await flushAsyncUpdates();

    // Simulate a rerender with new state that would otherwise trigger selection
    act(() => {
      (
        state.metamask.transactions[0] as unknown as TransactionMeta
      ).selectedGasFeeToken = undefined;
    });

    rerender();

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(1); // Only first run
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(1);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledWith(store.dispatch);
  });

  it('does not select if transactionId is falsy', async () => {
    const state = getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
        selectedGasFeeToken: undefined,
      }),
    );
    // Remove transactionId
    state.metamask.transactions = [];
    renderHookWithConfirmContextProvider(useAutomaticGasFeeTokenSelect, state);

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(0);
  });

  it('does not select if gasFeeTokens is falsy', async () => {
    runHook({ gasFeeTokens: [] });

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(0);
  });

  it('does not select first gas fee token if 7702 and future native token', async () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: false,
      pending: false,
    });

    runHook({
      gasFeeTokens: [
        {
          ...GAS_FEE_TOKEN_MOCK,
          tokenAddress: NATIVE_TOKEN_ADDRESS,
        },
      ],
    });

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(0);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(0);
  });

  it('selects second gas fee token if 7702 and future native token', async () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: false,
      pending: false,
    });

    const { store } = runHook({
      gasFeeTokens: [
        {
          ...GAS_FEE_TOKEN_MOCK,
          tokenAddress: NATIVE_TOKEN_ADDRESS,
        },
        GAS_FEE_TOKEN_MOCK,
      ],
    });

    if (!store) {
      throw new Error('Expected store to be defined');
    }

    await flushAsyncUpdates();

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(1);
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledWith(
      expect.any(String),
      GAS_FEE_TOKEN_MOCK.tokenAddress,
    );
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledTimes(1);
    expect(forceUpdateMetamaskStateMock).toHaveBeenCalledWith(store.dispatch);
  });
});
