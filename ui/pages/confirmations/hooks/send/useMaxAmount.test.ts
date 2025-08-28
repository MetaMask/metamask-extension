import { DefaultRootState } from 'react-redux';
import mockState from '../../../../../test/data/mock-state.json';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
  SOLANA_ASSET,
} from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import * as SendContext from '../../context/send';
import { useMaxAmount } from './useMaxAmount';

const MOCK_ADDRESS_1 = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

function renderHook(state?: DefaultRootState) {
  const { result } = renderHookWithProvider(useMaxAmount, state ?? mockState);
  return result.current;
}

describe('useBalance', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('return correct balance for native assets', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      from: MOCK_ADDRESS_1,
    } as unknown as SendContext.SendContextType);
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

    expect(result.getMaxAmount()).toEqual('966.98755713791800405905');
  });

  it('return correct balance for ERC20 assets', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
      from: MOCK_ADDRESS_1,
    } as unknown as SendContext.SendContextType);
    const result = renderHook({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        tokenBalances: {
          [MOCK_ADDRESS_1]: {
            '0x5': {
              '0xeDd1935e28b253C7905Cf5a944f0B5830FFA916a': '0xbdbd',
            },
          },
        },
      },
    });
    expect(result.getMaxAmount()).toEqual('48573');
  });

  it('return correct balance for solana assets', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    expect(result.getMaxAmount()).toEqual('1.007248');
  });
});
