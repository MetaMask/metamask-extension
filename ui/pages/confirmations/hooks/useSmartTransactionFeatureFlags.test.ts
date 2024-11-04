import { useSmartTransactionFeatureFlags } from './useSmartTransactionFeatureFlags';
import {
  fetchSmartTransactionsLiveness,
  setSwapsFeatureFlags,
} from '../../../store/actions';
import { act } from 'react-dom/test-utils';
import { useDispatch } from 'react-redux';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { mockNetworkState } from '../../../../test/stub/networks';
import { fetchSwapsFeatureFlags } from '../../swaps/swaps.util';
import mockState from '../../../../test/data/mock-state.json';
import { Hex } from '@metamask/utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setSwapsFeatureFlags: jest.fn(),
  fetchSmartTransactionsLiveness: jest.fn(),
}));

jest.mock('../../swaps/swaps.util', () => ({
  ...jest.requireActual('../../swaps/swaps.util'),
  fetchSwapsFeatureFlags: jest.fn(),
}));

async function runHook({
  smartTransactionsOptInStatus,
  chainId,
}: {
  smartTransactionsOptInStatus: boolean;
  chainId: Hex;
}) {
  const transaction = genUnapprovedContractInteractionConfirmation({
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

  it('updates feature flags if transaction', async () => {
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
      smartTransactionsOptInStatus: false,
      chainId: CHAIN_IDS.ARBITRUM,
    });

    expect(setSwapsFeatureFlagsMock).not.toHaveBeenCalled();
  });
});
