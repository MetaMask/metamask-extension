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
    expect(result.getFiatDisplayValue).toBeDefined();
    expect(result.getNativeValue).toBeDefined();
    expect(result.getNativeDisplayValue).toBeDefined();
  });

  it('use conversion rate from asset if available', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: {
        ...EVM_NATIVE_ASSET,
        fiat: {
          conversionRate: 2,
        },
      },
      chainId: '0x5',
    } as unknown as SendContext.SendContextType);

    const result = renderHook();
    expect(result.getFiatValue(10)).toEqual('20');
    expect(result.getFiatDisplayValue(10)).toEqual('$ 20');
    expect(result.getNativeValue(5000)).toEqual('2500');
    expect(result.getNativeDisplayValue(5000)).toEqual('ETH 2500');
  });

  it('return correct values for Native assets', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      chainId: '0x5',
    } as unknown as SendContext.SendContextType);

    const result = renderHook();
    expect(result.getFiatValue(10)).toEqual('5561.2');
    expect(result.getFiatDisplayValue(10)).toEqual('$ 5561.2');
    expect(result.getNativeValue(5000)).toEqual('8.990865280874631');
    expect(result.getNativeDisplayValue(5000)).toEqual('ETH 8.99086');
  });

  it('return correct values for ERC20 assets', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
      chainId: '0x5',
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
    expect(result.getFiatDisplayValue(10)).toEqual('$ 27806');
    expect(result.getNativeValue(5000)).toEqual('1.79817305617492635');
    expect(result.getNativeDisplayValue(5000)).toEqual('NEU 1.79817');
  });

  it('return correct values for solana assets', () => {
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
    expect(result.getFiatDisplayValue(10)).toEqual('$ 5');
    expect(result.getNativeValue(5000)).toEqual('10000');
    expect(result.getNativeDisplayValue(5000)).toEqual('FARTCOIN 10000');
  });
});
