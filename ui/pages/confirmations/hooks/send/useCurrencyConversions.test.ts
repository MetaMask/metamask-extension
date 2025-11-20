import { DefaultRootState } from 'react-redux';

import mockState from '../../../../../test/data/mock-state.json';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
  MOCK_NFT1155,
  MOCK_NFT721,
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
    expect(result.conversionSupportedForAsset).toBeDefined();
    expect(result.getFiatValue).toBeDefined();
    expect(result.getFiatDisplayValue).toBeDefined();
    expect(result.getNativeValue).toBeDefined();
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
    expect(result.getFiatValue('10')).toEqual('20');
    expect(result.getFiatDisplayValue('10')).toEqual('$20.00');
    expect(result.getNativeValue('5000')).toEqual('2500');
  });

  it('conversionSupportedForAsset is false for ERC1155 asset', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: MOCK_NFT1155,
      chainId: '0x5',
      decimals: 4,
    } as unknown as SendContext.SendContextType);

    const result = renderHook();

    expect(result.conversionSupportedForAsset).toBeFalsy();
  });

  it('conversionSupportedForAsset is false for ERC721 asset', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: MOCK_NFT721,
      chainId: '0x5',
      decimals: 4,
    } as unknown as SendContext.SendContextType);

    const result = renderHook();

    expect(result.conversionSupportedForAsset).toBeFalsy();
  });

  it('conversionSupportedForAsset is false if conversion raet is not available', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: { ...EVM_ASSET, chainId: 137 },
      chainId: '0x89',
      decimals: 4,
    } as unknown as SendContext.SendContextType);

    const result = renderHook();

    expect(result.conversionSupportedForAsset).toBeFalsy();
  });
});
