import { DefaultRootState } from 'react-redux';

import { Numeric } from '../../../../../shared/modules/Numeric';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
  SOLANA_ASSET,
} from '../../../../../test/data/send/assets';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import * as SendContext from '../../context/send';
import { useMaxAmount } from './useMaxAmount';
import { useBalance } from './useBalance';

jest.mock('./useBalance');

const MOCK_ADDRESS_1 = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

function renderHook(state?: DefaultRootState) {
  const { result } = renderHookWithProvider(useMaxAmount, state ?? mockState);
  return result.current;
}

const useBalanceMock = jest.mocked(useBalance);

describe('useMaxAmount', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('return correct max amount for native assets', () => {
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
    const result = renderHook({
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

  it('not throw error if gas fee estimates is not available', () => {
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
    const result = renderHook({
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

  it('return 0 if balance of native asset is less than gas needed', () => {
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
    const result = renderHook({
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

  it('return correct max amount for ERC20 assets', () => {
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
    const result = renderHook();
    expect(result.getMaxAmount()).toEqual('48573');
  });

  it('return correct max amount for solana assets', () => {
    useBalanceMock.mockReturnValue({
      balance: '10.00',
      decimals: 6,
      rawBalanceNumeric: new Numeric('1007248', 10),
    });
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    expect(result.getMaxAmount()).toEqual('1.007248');
  });
});
