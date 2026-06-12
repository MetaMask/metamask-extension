import { act } from 'react-dom/test-utils';
import { useDispatch } from 'react-redux';
import { CHAIN_IDS, TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  fetchSmartTransactionsLiveness,
  setSmartTransactionsRefreshInterval,
} from '../../../store/actions';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { mockNetworkState } from '../../../../test/stub/networks';
import { useSmartTransactionFeatureFlags } from './useSmartTransactionFeatureFlags';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  fetchSmartTransactionsLiveness: jest.fn(),
  setSmartTransactionsRefreshInterval: jest.fn(),
}));

async function runHook({
  smartTransactionsOptInStatus,
  chainId,
  confirmation,
  batchStatusPollingInterval,
}: {
  smartTransactionsOptInStatus: boolean;
  chainId: Hex;
  confirmation?: Partial<TransactionMeta>;
  batchStatusPollingInterval?: number;
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
      remoteFeatureFlags: {
        smartTransactionsNetworks: {
          default: {
            extensionActive: true,
          },
          [chainId]: {
            extensionActive: true,
            batchStatusPollingInterval,
          },
        },
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
  const setSmartTransactionsRefreshIntervalMock = jest.mocked(
    setSmartTransactionsRefreshInterval,
  );
  const fetchSmartTransactionsLivenessMock = jest.mocked(
    fetchSmartTransactionsLiveness,
  );
  const useDispatchMock = jest.mocked(useDispatch);

  beforeEach(() => {
    jest.resetAllMocks();
    useDispatchMock.mockReturnValue(jest.fn());
    fetchSmartTransactionsLivenessMock.mockReturnValue(() => Promise.resolve());
  });

  it('fetches smart transactions liveness', async () => {
    await runHook({
      smartTransactionsOptInStatus: true,
      chainId: CHAIN_IDS.MAINNET,
    });

    expect(fetchSmartTransactionsLivenessMock).toHaveBeenCalledTimes(1);
  });

  it('does not fetch liveness if smart transactions disabled', async () => {
    await runHook({
      smartTransactionsOptInStatus: false,
      chainId: CHAIN_IDS.MAINNET,
    });

    expect(fetchSmartTransactionsLivenessMock).not.toHaveBeenCalled();
  });

  it('does not fetch liveness if chain not supported', async () => {
    await runHook({
      smartTransactionsOptInStatus: true,
      chainId: CHAIN_IDS.OPTIMISM, // OPTIMISM is not in the allowed STX chain IDs
    });

    expect(fetchSmartTransactionsLivenessMock).not.toHaveBeenCalled();
  });

  it('does not fetch liveness if confirmation is not transaction', async () => {
    await runHook({
      smartTransactionsOptInStatus: true,
      chainId: CHAIN_IDS.MAINNET,
      confirmation: {},
    });

    expect(fetchSmartTransactionsLivenessMock).not.toHaveBeenCalled();
  });

  it('updates refresh interval when feature flags include interval', async () => {
    await runHook({
      smartTransactionsOptInStatus: true,
      chainId: CHAIN_IDS.MAINNET,
      batchStatusPollingInterval: 5000,
    });

    expect(setSmartTransactionsRefreshIntervalMock).toHaveBeenCalledTimes(1);
    expect(setSmartTransactionsRefreshIntervalMock).toHaveBeenCalledWith(5000);
  });

  it('uses default refresh interval when feature flags do not include interval', async () => {
    await runHook({
      smartTransactionsOptInStatus: true,
      chainId: CHAIN_IDS.MAINNET,
      // batchStatusPollingInterval not set, so defaults to 1000
    });

    expect(setSmartTransactionsRefreshIntervalMock).toHaveBeenCalledTimes(1);
    expect(setSmartTransactionsRefreshIntervalMock).toHaveBeenCalledWith(1000);
  });
});
