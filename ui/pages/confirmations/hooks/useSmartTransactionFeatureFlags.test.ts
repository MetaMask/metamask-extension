import { act } from 'react-dom/test-utils';
import { useDispatch } from 'react-redux';
import { CHAIN_IDS, TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  fetchSmartTransactionsLiveness,
  setSwapsFeatureFlags,
  setSmartTransactionsRefreshInterval,
} from '../../../store/actions';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { mockNetworkState } from '../../../../test/stub/networks';
import { fetchSwapsFeatureFlags } from '../../swaps/swaps.util';
import { useSmartTransactionFeatureFlags } from './useSmartTransactionFeatureFlags';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setSwapsFeatureFlags: jest.fn(),
  fetchSmartTransactionsLiveness: jest.fn(),
  setSmartTransactionsRefreshInterval: jest.fn(),
}));

jest.mock('../../swaps/swaps.util', () => ({
  ...jest.requireActual('../../swaps/swaps.util'),
  fetchSwapsFeatureFlags: jest.fn(),
}));

async function runHook({
  smartTransactionsOptInStatus,
  chainId,
  confirmation,
}: {
  smartTransactionsOptInStatus: boolean;
  chainId: Hex;
  confirmation?: Partial<TransactionMeta>;
}) {
  const transaction =
    (confirmation as TransactionMeta) ??
    genUnapprovedContractInteractionConfirmation({
      chainId,
    });

  const state = getMockConfirmStateForTransaction(transaction, {
    metamask: {
      ...mockNetworkState({ chainId, id: 'Test' }),
      selectedNetworkClientId: 'Test',
      preferences: {
        smartTransactionsOptInStatus,
      },
    },
  });

  renderHookWithConfirmContextProvider(
    () => useSmartTransactionFeatureFlags(),
    state,
  );

  await act(async () => {
    // Intentionally empty
  });
}

describe('useSmartTransactionFeatureFlags', () => {
  const setSwapsFeatureFlagsMock = jest.mocked(setSwapsFeatureFlags);
  const setSmartTransactionsRefreshIntervalMock = jest.mocked(
    setSmartTransactionsRefreshInterval,
  );
  const fetchSwapsFeatureFlagsMock = jest.mocked(fetchSwapsFeatureFlags);
  const fetchSmartTransactionsLivenessMock = jest.mocked(
    fetchSmartTransactionsLiveness,
  );
  const useDispatchMock = jest.mocked(useDispatch);

  beforeEach(() => {
    jest.resetAllMocks();
    useDispatchMock.mockReturnValue(jest.fn());
    fetchSwapsFeatureFlagsMock.mockResolvedValue({});
    fetchSmartTransactionsLivenessMock.mockReturnValue(() => Promise.resolve());
  });

  it('updates feature flags', async () => {
    await runHook({
      smartTransactionsOptInStatus: true,
      chainId: CHAIN_IDS.MAINNET,
    });

    expect(setSwapsFeatureFlagsMock).toHaveBeenCalledTimes(1);
    expect(setSwapsFeatureFlagsMock).toHaveBeenCalledWith({});
  });

  it('does not update feature flags if smart transactions disabled', async () => {
    await runHook({
      smartTransactionsOptInStatus: false,
      chainId: CHAIN_IDS.MAINNET,
    });

    expect(setSwapsFeatureFlagsMock).not.toHaveBeenCalled();
  });

  it('does not update feature flags if chain not supported', async () => {
    await runHook({
      smartTransactionsOptInStatus: true,
      chainId: CHAIN_IDS.ARBITRUM,
    });

    expect(setSwapsFeatureFlagsMock).not.toHaveBeenCalled();
  });

  it('does not update feature flags if confirmation is not transaction', async () => {
    await runHook({
      smartTransactionsOptInStatus: true,
      chainId: CHAIN_IDS.MAINNET,
      confirmation: {},
    });

    expect(setSwapsFeatureFlagsMock).not.toHaveBeenCalled();
  });

  it('updates refresh interval when feature flags include interval', async () => {
    fetchSwapsFeatureFlagsMock.mockResolvedValue({
      smartTransactions: {
        batchStatusPollingInterval: 1000,
      },
    });

    await runHook({
      smartTransactionsOptInStatus: true,
      chainId: CHAIN_IDS.MAINNET,
    });

    expect(setSmartTransactionsRefreshIntervalMock).toHaveBeenCalledTimes(1);
    expect(setSmartTransactionsRefreshIntervalMock).toHaveBeenCalledWith(1000);
  });

  it('does not update refresh interval when feature flags do not include interval', async () => {
    fetchSwapsFeatureFlagsMock.mockResolvedValue({
      smartTransactions: {},
    });

    await runHook({
      smartTransactionsOptInStatus: true,
      chainId: CHAIN_IDS.MAINNET,
    });

    expect(setSmartTransactionsRefreshIntervalMock).toHaveBeenCalledTimes(1);
    expect(setSmartTransactionsRefreshIntervalMock).toHaveBeenCalledWith(
      undefined,
    );
  });
});
