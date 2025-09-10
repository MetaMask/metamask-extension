import mockState from '../../../../../test/data/mock-state.json';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
  SOLANA_ASSET,
  SOLANA_NATIVE_ASSET,
} from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import * as SendContext from '../../context/send';
import { useSendType } from './useSendType';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: () => [{ get: () => null }],
}));

function renderHook() {
  const { result } = renderHookWithProvider(useSendType, mockState);
  return result.current;
}

describe('useSendType', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('return correct type for evm asset send', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
      chainId: '0x5',
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    expect(result).toEqual({
      isEvmNativeSendType: false,
      isEvmSendType: true,
      isNonEvmNativeSendType: false,
      isNonEvmSendType: false,
      isSolanaSendType: false,
    });
  });

  it('use assetId is address is undefined', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: { ...EVM_ASSET, assetId: EVM_ASSET.address, address: undefined },
      chainId: '0x5',
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    expect(result).toEqual({
      isEvmNativeSendType: false,
      isEvmSendType: true,
      isNonEvmNativeSendType: false,
      isNonEvmSendType: false,
      isSolanaSendType: false,
    });
  });

  it('return correct type for evm native asset send', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      chainId: '0x5',
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    expect(result).toEqual({
      isEvmNativeSendType: true,
      isEvmSendType: true,
      isNonEvmNativeSendType: false,
      isNonEvmSendType: false,
      isSolanaSendType: false,
    });
  });

  it('return correct type for native solana asset send', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_NATIVE_ASSET,
      chainId: SOLANA_NATIVE_ASSET.chainId,
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    expect(result).toEqual({
      isEvmNativeSendType: false,
      isEvmSendType: false,
      isNonEvmNativeSendType: true,
      isNonEvmSendType: true,
      isSolanaSendType: true,
    });
  });

  it('return correct type for solana asset send', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
      chainId: SOLANA_NATIVE_ASSET.chainId,
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    expect(result).toEqual({
      isEvmNativeSendType: false,
      isEvmSendType: false,
      isNonEvmNativeSendType: false,
      isNonEvmSendType: true,
      isSolanaSendType: true,
    });
  });
});
