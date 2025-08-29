import { DefaultRootState } from 'react-redux';

import mockState from '../../../../../test/data/mock-state.json';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
  SOLANA_ASSET,
} from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import * as SendContext from '../../context/send';
import { useCurrencyConversions } from './useCurrencyConversions';

function renderHook(args: DefaultRootState = {}) {
  const { result } = renderHookWithProvider(useCurrencyConversions, {
    ...mockState,
    metamask: { ...mockState.metamask, ...args },
  });
  return result.current;
}

describe('useCurrencyConversions', () => {
  it('return fields for currency conversion', () => {
    const result = renderHook();
    expect(result.getFiatValue).toBeDefined();
    expect(result.getNativeValue).toBeDefined();
  });

  it('return correct rate for Native assets', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
    } as unknown as SendContext.SendContextType);

    const result = renderHook();
    expect(result.getFiatValue(10)).toEqual('5561.2');
  });

  it('return correct rate for ERC20 assets', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
    } as unknown as SendContext.SendContextType);

    const result = renderHook({
      marketData: {
        '0x5': {
          [EVM_ASSET.address]: {
            price: 5,
            contractPercentChange1d: 0.55,
            priceChange1d: 0.75,
          },
        },
      },
    });

    expect(result.getFiatValue(10)).toEqual('27806');
  });

  it('return correct rate for solana assets', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
    } as unknown as SendContext.SendContextType);

    const result = renderHook({
      conversionRates: {
        [SOLANA_ASSET.address]: {
          rate: '.5',
        },
      },
    });

    expect(result.getFiatValue(10)).toEqual('5');
  });
});
