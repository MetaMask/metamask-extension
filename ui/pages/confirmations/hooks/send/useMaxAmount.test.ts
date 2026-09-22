import { act, waitFor } from '@testing-library/react';
import type { MetaMaskReduxState } from '../../../../store/store';
import { estimateGas } from '../../../../store/actions';
import { UPDATE_METAMASK_STATE } from '../../../../store/actionConstants';
import { useIsNetworkGasSponsored } from '../../../../hooks/useIsNetworkGasSponsored';

import { Numeric } from '../../../../../shared/lib/Numeric';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
  SOLANA_ASSET,
} from '../../../../../test/data/send/assets';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import * as SendContext from '../../context/send';
import { getLayer1GasFees } from '../../utils/send';
import { GasFeeEstimatesType, useMaxAmount } from './useMaxAmount';
import { useBalance } from './useBalance';

jest.mock('./useBalance');
jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  estimateGas: jest.fn(),
  gasFeeStartPollingByNetworkClientId: jest.fn().mockResolvedValue('token'),
  gasFeeStopPollingByPollingToken: jest.fn(),
}));
jest.mock('../../../../hooks/useIsNetworkGasSponsored');
jest.mock('../../utils/send', () => ({
  ...jest.requireActual('../../utils/send'),
  getLayer1GasFees: jest.fn(),
}));

const MOCK_ADDRESS_1 = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const MOCK_ADDRESS_2 = '0x2f318c334780961fb129d2a6c30d0763d9a5c970';
const MOCK_ADDRESS_3 = '0x4dd7e92a55ea5e782ba4b7329e2bff8c5da0e8d5';

const estimateGasMock = jest.mocked(estimateGas);
const getLayer1GasFeesMock = jest.mocked(getLayer1GasFees);
const useBalanceMock = jest.mocked(useBalance);
const useIsNetworkGasSponsoredMock = jest.mocked(useIsNetworkGasSponsored);

const createState = ({
  chainId = '0x5',
  networkClientId = 'goerli',
  suggestedMaxFeePerGas = '20.44436136',
  gasFeeEstimates = {
    medium: {
      suggestedMaxFeePerGas,
    },
  },
}: {
  chainId?: string;
  gasFeeEstimates?: GasFeeEstimatesType;
  networkClientId?: string;
  suggestedMaxFeePerGas?: string;
} = {}) =>
  ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      gasFeeEstimatesByChainId: {
        ...mockState.metamask.gasFeeEstimatesByChainId,
        [chainId]: {
          gasFeeEstimates,
        },
      },
      networkConfigurationsByChainId: {
        ...mockState.metamask.networkConfigurationsByChainId,
        [chainId]: {
          chainId,
          name: 'Test network',
          nativeCurrency: 'ETH',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              type: 'custom',
              url: 'https://rpc.example.com',
              networkClientId,
            },
          ],
          blockExplorerUrls: [],
        },
      },
    },
  }) as unknown as MetaMaskReduxState;

const createControlledPromise = <TValue>() => {
  let resolve!: (value: TValue) => void;
  const promise = new Promise<TValue>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

describe('useMaxAmount', () => {
  let sendContext: SendContext.SendContextType;

  beforeEach(() => {
    sendContext = {
      asset: EVM_NATIVE_ASSET,
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
      to: MOCK_ADDRESS_2,
      toResolved: MOCK_ADDRESS_2,
    } as unknown as SendContext.SendContextType;
    jest
      .spyOn(SendContext, 'useSendContext')
      .mockImplementation(() => sendContext);
    useBalanceMock.mockReturnValue({
      balance: '1000',
      decimals: 18,
      rawBalanceNumeric: new Numeric('1000000000000000000000', 10),
    });
    useIsNetworkGasSponsoredMock.mockReturnValue({
      isNetworkGasSponsored: false,
    });
    estimateGasMock.mockResolvedValue('0x5208');
    getLayer1GasFeesMock.mockResolvedValue('0x0');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reserves buffered node-estimated gas for the eventual Max transaction', async () => {
    const { result } = renderHookWithProvider(useMaxAmount, createState());

    await waitFor(() => expect(result.current.isMaxAmountAvailable).toBe(true));

    expect(estimateGasMock).toHaveBeenNthCalledWith(
      1,
      {
        data: '0x',
        from: MOCK_ADDRESS_1,
        to: MOCK_ADDRESS_2,
        value: '0x30ca024f987b900000',
      },
      'goerli',
      1.5,
    );
    expect(estimateGasMock).toHaveBeenLastCalledWith(
      {
        data: '0x',
        from: MOCK_ADDRESS_1,
        to: MOCK_ADDRESS_2,
        value: '0x3635c8274c51cc4b80',
      },
      'goerli',
      1.5,
    );
    expect(result.current.getMaxAmount()).toBe('999.99957066841144');
  });

  it('keeps Max available when gas fee estimates refresh', async () => {
    const { result, store } = renderHookWithProvider(
      useMaxAmount,
      createState({ suggestedMaxFeePerGas: '1' }),
    );

    await waitFor(() => expect(result.current.isMaxAmountAvailable).toBe(true));
    expect(result.current.getMaxAmount()).toBe('999.999979');

    act(() => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: {
          gasFeeEstimatesByChainId: {
            ...store.getState().metamask.gasFeeEstimatesByChainId,
            '0x5': {
              gasFeeEstimates: {
                medium: {
                  suggestedMaxFeePerGas: '2',
                },
              },
            },
          },
        },
      });
    });

    expect(result.current.isMaxAmountPending).toBe(false);
    expect(result.current.isMaxAmountAvailable).toBe(true);
    expect(result.current.getMaxAmount()).toBe('999.999958');
    expect(estimateGasMock).toHaveBeenCalledTimes(2);
  });

  it('reserves a node estimate above 21,000 gas', async () => {
    estimateGasMock.mockResolvedValue('0x7530');
    const { result } = renderHookWithProvider(useMaxAmount, createState());

    await waitFor(() => expect(result.current.isMaxAmountAvailable).toBe(true));

    expect(result.current.getMaxAmount()).toBe('999.9993866691592');
  });

  it('uses a below-balance value when Max is selected before entering an amount', async () => {
    const { result } = renderHookWithProvider(useMaxAmount, createState());

    await waitFor(() => expect(result.current.isMaxAmountAvailable).toBe(true));

    expect(estimateGasMock).toHaveBeenCalledWith(
      expect.objectContaining({ value: '0x30ca024f987b900000' }),
      'goerli',
      1.5,
    );
  });

  it('re-estimates when the sender, recipient, chain, or RPC changes', async () => {
    const state = createState({
      chainId: '0x6',
      networkClientId: 'secondRpc',
    });
    const { rerender } = renderHookWithProvider(useMaxAmount, state);
    await waitFor(() => expect(estimateGasMock).toHaveBeenCalledTimes(2));

    sendContext = {
      ...sendContext,
      asset: { ...EVM_NATIVE_ASSET, chainId: '0x6' },
      chainId: '0x6',
      from: MOCK_ADDRESS_3,
      toResolved: MOCK_ADDRESS_1,
    };
    rerender();

    await waitFor(() => expect(estimateGasMock).toHaveBeenCalledTimes(4));
    expect(estimateGasMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        from: MOCK_ADDRESS_3,
        to: MOCK_ADDRESS_1,
      }),
      'secondRpc',
      1.5,
    );
  });

  it('discards a stale gas estimate', async () => {
    const firstEstimate = createControlledPromise<`0x${string}`>();
    const secondEstimate = createControlledPromise<`0x${string}`>();
    estimateGasMock
      .mockReturnValueOnce(firstEstimate.promise)
      .mockReturnValueOnce(secondEstimate.promise)
      .mockResolvedValue('0x7530');
    const { result, rerender } = renderHookWithProvider(
      useMaxAmount,
      createState({ suggestedMaxFeePerGas: '1' }),
    );

    sendContext = { ...sendContext, toResolved: MOCK_ADDRESS_3 };
    rerender();
    act(() => secondEstimate.resolve('0x7530'));
    await waitFor(() => expect(result.current.isMaxAmountAvailable).toBe(true));
    expect(result.current.getMaxAmount()).toBe('999.99997');

    act(() => firstEstimate.resolve('0x5208'));
    await waitFor(() =>
      expect(result.current.getMaxAmount()).toBe('999.99997'),
    );
  });

  it('makes Max unavailable if the node estimate fails', async () => {
    estimateGasMock.mockRejectedValue(new Error('Estimate failed'));
    const { result } = renderHookWithProvider(useMaxAmount, createState());

    expect(result.current.isMaxAmountPending).toBe(true);
    await waitFor(() => expect(result.current.isMaxAmountPending).toBe(false));

    expect(result.current.isMaxAmountAvailable).toBe(false);
    expect(result.current.isMaxAmountError).toBe(true);
    expect(result.current.getMaxAmount()).toBeUndefined();
  });

  it('does not report an error while estimate inputs are missing', () => {
    sendContext = { ...sendContext, toResolved: undefined };
    const { result } = renderHookWithProvider(useMaxAmount, createState());

    expect(result.current.isMaxAmountAvailable).toBe(false);
    expect(result.current.isMaxAmountError).toBe(false);
    expect(result.current.isMaxAmountPending).toBe(false);
  });

  it('uses legacy medium gas fee estimates', async () => {
    const { result } = renderHookWithProvider(
      useMaxAmount,
      createState({ gasFeeEstimates: { medium: '1' } }),
    );

    await waitFor(() => expect(result.current.isMaxAmountAvailable).toBe(true));

    expect(result.current.getMaxAmount()).toBe('999.999979');
  });

  it('uses eth_gasPrice gas fee estimates', async () => {
    const { result } = renderHookWithProvider(
      useMaxAmount,
      createState({ gasFeeEstimates: { gasPrice: '1' } }),
    );

    await waitFor(() => expect(result.current.isMaxAmountAvailable).toBe(true));

    expect(result.current.getMaxAmount()).toBe('999.999979');
  });

  it('makes Max unavailable if fee-rate estimates are empty', () => {
    const { result } = renderHookWithProvider(
      useMaxAmount,
      createState({ gasFeeEstimates: {} }),
    );

    expect(estimateGasMock).not.toHaveBeenCalled();
    expect(result.current.isMaxAmountAvailable).toBe(false);
    expect(result.current.isMaxAmountError).toBe(false);
    expect(result.current.getMaxAmount()).toBeUndefined();
  });

  it('adds the layer 1 fee to the reserved gas fee', async () => {
    getLayer1GasFeesMock.mockResolvedValue('0x64');
    const { result } = renderHookWithProvider(
      useMaxAmount,
      createState({ suggestedMaxFeePerGas: '1' }),
    );

    await waitFor(() => expect(result.current.isMaxAmountAvailable).toBe(true));

    expect(result.current.getMaxAmount()).toBe('999.9999789999999999');
  });

  it('does not reserve gas on a sponsored network', () => {
    useIsNetworkGasSponsoredMock.mockReturnValue({
      isNetworkGasSponsored: true,
    });
    const { result } = renderHookWithProvider(
      useMaxAmount,
      createState({ gasFeeEstimates: {} }),
    );

    expect(result.current.isMaxAmountAvailable).toBe(true);
    expect(result.current.isMaxAmountPending).toBe(false);
    expect(result.current.getMaxAmount()).toBe('1000');
    expect(estimateGasMock).not.toHaveBeenCalled();
    expect(getLayer1GasFeesMock).not.toHaveBeenCalled();
  });

  it('returns the full balance for ERC20 assets', () => {
    sendContext = {
      ...sendContext,
      asset: { ...EVM_ASSET, decimals: 16 },
    };
    useBalanceMock.mockReturnValue({
      balance: '48573',
      decimals: 16,
      rawBalanceNumeric: new Numeric('485730000000000000000', 10),
    });
    const { result } = renderHookWithProvider(
      useMaxAmount,
      createState({ gasFeeEstimates: {} }),
    );

    expect(result.current.getMaxAmount()).toBe('48573');
  });

  it('returns the full balance for Solana assets', () => {
    sendContext = { ...sendContext, asset: SOLANA_ASSET, chainId: undefined };
    useBalanceMock.mockReturnValue({
      balance: '1.007248',
      decimals: 6,
      rawBalanceNumeric: new Numeric('1007248', 10),
    });
    const { result } = renderHookWithProvider(useMaxAmount, createState());

    expect(result.current.getMaxAmount()).toBe('1.007248');
  });
});
