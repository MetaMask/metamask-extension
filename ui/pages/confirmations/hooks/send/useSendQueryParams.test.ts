import * as BridgeCtrl from '@metamask/bridge-controller';
import { DefaultRootState } from 'react-redux';
import { useSearchParams } from 'react-router-dom-v5-compat';
import { SetURLSearchParams } from 'react-router-dom-v5-compat/dist/react-router-dom';

import mockState from '../../../../../test/data/mock-state.json';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
  SOLANA_ASSET,
} from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { SendPages } from '../../constants/send';
import * as SendContext from '../../context/send';
import { useSendQueryParams } from './useSendQueryParams';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: jest.fn().mockReturnValue([{ get: () => null }]),
}));

jest.mock('../../../../store/actions', () => {
  return {
    getTokenStandardAndDetails: jest.fn(),
  };
});

jest.mock(
  '../../../../components/app/assets/hooks/useMultichainAssets',
  () => () => [
    {
      address:
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      decimals: 6,
      image:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump.png',
      isNative: false,
      isStakeable: false,
      primary: '1.007248',
      secondary: '$1.05',
      string: '',
      symbol: 'FARTCOIN',
      title: 'Fartcoin',
      tokenFiatAmount: 1.045523424,
    },
  ],
);

function renderHook(args: DefaultRootState = {}) {
  const { result } = renderHookWithProvider(useSendQueryParams, {
    ...mockState,
    metamask: { ...mockState.metamask, ...args },
  });
  return result.current;
}

describe('useSendQueryParams', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('call SendContext.updateCurrentPage with correct parameters', () => {
    const mockUpdateCurrentPage = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateCurrentPage: mockUpdateCurrentPage,
    } as unknown as SendContext.SendContextType);
    renderHook();
    expect(mockUpdateCurrentPage).toHaveBeenCalledWith(SendPages.ASSET);
  });

  it('call getNativeAssetForChainId if only chainId is present in params', () => {
    const mockUseSearchParams = jest.mocked(useSearchParams);
    mockUseSearchParams.mockReturnValue([
      {
        get: (param: string) => {
          return param === 'chainId' ? '0x1' : undefined;
        },
      },
    ] as unknown as [URLSearchParams, SetURLSearchParams]);
    const mockGetNativeAssetForChainId = jest
      .spyOn(BridgeCtrl, 'getNativeAssetForChainId')
      .mockReturnValue(EVM_NATIVE_ASSET as BridgeCtrl.BridgeAsset);
    renderHook();
    expect(mockGetNativeAssetForChainId).toHaveBeenCalledWith('0x1');
  });

  it('get asset details from state of ERC20 token is passed', () => {
    const mockUpdateAsset = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateAsset: mockUpdateAsset,
      updateCurrentPage: jest.fn(),
    } as unknown as SendContext.SendContextType);

    const mockUseSearchParams = jest.mocked(useSearchParams);
    mockUseSearchParams.mockReturnValue([
      {
        get: (param: string) => {
          return param === 'address' ? EVM_ASSET.address : undefined;
        },
      },
    ] as unknown as [URLSearchParams, SetURLSearchParams]);
    renderHook({
      allTokens: {
        '0x5': {
          '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': [EVM_ASSET],
        },
      },
    });
    expect(mockUpdateAsset).toHaveBeenCalledWith({
      ...EVM_ASSET,
      chainId: '0x5',
    });
  });

  it('use asset from multiChainAssets if present', () => {
    const mockUpdateAsset = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateAsset: mockUpdateAsset,
      updateCurrentPage: jest.fn(),
    } as unknown as SendContext.SendContextType);

    const mockUseSearchParams = jest.mocked(useSearchParams);
    mockUseSearchParams.mockReturnValue([
      {
        get: (param: string) => {
          return param === 'address' ? SOLANA_ASSET.address : undefined;
        },
      },
    ] as unknown as [URLSearchParams, SetURLSearchParams]);
    renderHook();
    expect(mockUpdateAsset).toHaveBeenCalledWith(SOLANA_ASSET);
  });
});
