import { DefaultRootState } from 'react-redux';
import { act } from '@testing-library/react';

import { Numeric } from '../../../../../shared/lib/Numeric';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
  SOLANA_ASSET,
} from '../../../../../test/data/send/assets';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import * as SendContext from '../../context/send';
import * as SendUtils from '../../utils/send';
import { useMaxAmount } from './useMaxAmount';
import { useBalance } from './useBalance';

jest.mock('./useBalance');

const MOCK_ADDRESS_1 = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

async function renderHook(state?: DefaultRootState) {
  const { result } = renderHookWithProvider(useMaxAmount, state ?? mockState);
  // Let any async results (layer-1 gas fees, Arc gas API fetch) settle inside
  // act so they don't trigger state updates outside the React testing scope.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  return result.current;
}

const useBalanceMock = jest.mocked(useBalance);

describe('useMaxAmount', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('return correct max amount for native assets', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
    } as unknown as SendContext.SendContextType);
    useBalanceMock.mockReturnValue({
      balance: '10.00',
      decimals: 18,
      rawBalanceNumeric: new Numeric('1000000000000000000000', 10),
    });
    const result = await renderHook({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        gasFeeEstimatesByChainId: {
          '0x5': {
            gasFeeEstimates: {
              medium: {
                suggestedMaxFeePerGas: '20.44436136',
              },
            },
          },
        },
      },
    });

    expect(result.getMaxAmount()).toEqual('999.999570668411440000');
  });

  it('not throw error if gas fee estimates is not available', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
    } as unknown as SendContext.SendContextType);
    useBalanceMock.mockReturnValue({
      balance: '10.00',
      decimals: 18,
      rawBalanceNumeric: new Numeric('1000000000000000000000', 10),
    });
    const result = await renderHook({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        gasFeeEstimatesByChainId: {
          '0x5': {
            gasFeeEstimates: {},
          },
        },
      },
    });

    expect(result.getMaxAmount()).toEqual('1000');
  });

  it('return 0 if balance of native asset is less than gas needed', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
    } as unknown as SendContext.SendContextType);
    useBalanceMock.mockReturnValue({
      balance: '10.00',
      decimals: 18,
      rawBalanceNumeric: new Numeric('100000000000000', 10),
    });
    const result = await renderHook({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        gasFeeEstimatesByChainId: {
          '0x5': {
            gasFeeEstimates: {
              medium: {
                suggestedMaxFeePerGas: '20.44436136',
              },
            },
          },
        },
      },
    });

    expect(result.getMaxAmount()).toEqual('0');
  });

  it('return correct max amount for ERC20 assets', async () => {
    useBalanceMock.mockReturnValue({
      balance: '10.00',
      decimals: 16,
      rawBalanceNumeric: new Numeric('485730000000000000000', 10),
    });
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: { ...EVM_ASSET, decimals: 16 },
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
    } as unknown as SendContext.SendContextType);
    const result = await renderHook();
    expect(result.getMaxAmount()).toEqual('48573');
  });

  it('return correct max amount for solana assets', async () => {
    useBalanceMock.mockReturnValue({
      balance: '10.00',
      decimals: 6,
      rawBalanceNumeric: new Numeric('1007248', 10),
    });
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
    } as unknown as SendContext.SendContextType);
    const result = await renderHook();
    expect(result.getMaxAmount()).toEqual('1.007248');
  });

  describe('Arc mirrored USDC', () => {
    const ARC_USDC_ASSET = {
      ...EVM_ASSET,
      address: '0x3600000000000000000000000000000000000000',
      assetId: 'eip155:5042/erc20:0x3600000000000000000000000000000000000000',
      chainId: '0x13b2',
      decimals: 6,
      isNative: false,
    };

    // `from` is intentionally omitted so the optional layer-1 gas fee lookup
    // short-circuits (no background call). The gas reservation is driven by the
    // Arc gas-API fetch, falling back to `gasFeeEstimates` from state.
    const renderArcHook = async (rawBalanceNumeric: Numeric) => {
      jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
        asset: ARC_USDC_ASSET,
        chainId: '0x13b2',
      } as unknown as SendContext.SendContextType);
      useBalanceMock.mockReturnValue({
        balance: '100',
        decimals: 6,
        rawBalanceNumeric,
      });
      return await renderHook({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          gasFeeEstimatesByChainId: {
            '0x13b2': {
              gasFeeEstimates: {
                medium: {
                  suggestedMaxFeePerGas: '20.44436136',
                },
              },
            },
          },
        },
      });
    };

    it('reserves native gas from the 6-decimal USDC balance via decimal normalization', async () => {
      // 100 USDC expressed in 6-decimal minimal units.
      const result = await renderArcHook(new Numeric('100000000', 10));

      // Only the gas fee (~0.0004 USDC) is reserved. Without normalizing the
      // 18-decimal native gas fee into the token's 6 decimals, the fee would
      // dwarf the balance and incorrectly zero the result.
      const max = parseFloat(result.getMaxAmount());
      expect(max).toBeGreaterThan(99.99);
      expect(max).toBeLessThan(100);
    });

    it('returns 0 when the USDC balance is below the reserved native gas', async () => {
      // 0.0001 USDC — smaller than the reserved gas.
      const result = await renderArcHook(new Numeric('100', 10));
      expect(result.getMaxAmount()).toEqual('0');
    });

    it('reserves gas using the fee fetched directly from the gas API', async () => {
      const fetchSpy = jest
        .spyOn(SendUtils, 'fetchSuggestedMaxFeePerGas')
        .mockResolvedValue(28.5);

      const result = await renderArcHook(new Numeric('100000000', 10));

      expect(fetchSpy).toHaveBeenCalledWith('0x13b2');
      const max = parseFloat(result.getMaxAmount());
      expect(max).toBeGreaterThan(99.99);
      expect(max).toBeLessThan(100);
    });
  });
});
