import { DefaultRootState, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom-v5-compat';
import { SetURLSearchParams } from 'react-router-dom-v5-compat/dist/react-router-dom';

import mockState from '../../../../../test/data/mock-state.json';
import { EVM_ASSET, MOCK_NFT1155 } from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { getAssetsBySelectedAccountGroup } from '../../../../selectors/assets';
import { Asset } from '../../types/send';
import { SendPages } from '../../constants/send';
import * as SendContext from '../../context/send';
import { useSendQueryParams } from './useSendQueryParams';
import { useSendNfts } from './useSendNfts';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: jest.fn().mockReturnValue([{ get: () => null }]),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('./useSendNfts', () => {
  return {
    useSendNfts: jest.fn().mockReturnValue([]),
  };
});

function renderHook(args: DefaultRootState = {}) {
  const { result } = renderHookWithProvider(useSendQueryParams, {
    ...mockState,
    metamask: { ...mockState.metamask, ...args },
  });
  return result.current;
}

describe('useSendQueryParams', () => {
  const useSendNftsMocked = jest.mocked(useSendNfts);
  const mockUseSelector = jest.mocked(useSelector);

  beforeEach(() => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getAssetsBySelectedAccountGroup) {
        return [];
      }
      return undefined;
    });
  });

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

  it('use tokens returned by useSendAssetsMocked hook', () => {
    const token = {
      ...EVM_ASSET,
      chainId: '0x5',
      assetId: EVM_ASSET.address,
    };
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getAssetsBySelectedAccountGroup) {
        return [token];
      }
      return undefined;
    });

    const mockUpdateAsset = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateAsset: mockUpdateAsset,
      updateCurrentPage: jest.fn(),
    } as unknown as SendContext.SendContextType);
    const mockUseSearchParams = jest.mocked(useSearchParams);
    mockUseSearchParams.mockReturnValue([
      {
        get: (param: string) => {
          if (param === 'asset') {
            return token.address;
          }
          if (param === 'chainId') {
            return token.chainId;
          }
          return undefined;
        },
      },
    ] as unknown as [URLSearchParams, SetURLSearchParams]);
    renderHook();
    expect(mockUpdateAsset).toHaveBeenCalledWith(token);
  });

  it('use nft returned by useSendNfts hook', () => {
    const nft = {
      ...MOCK_NFT1155,
      chainId: '0x5',
      assetId: MOCK_NFT1155.address,
    };
    useSendNftsMocked.mockReturnValue([nft as Asset]);
    const mockUpdateAsset = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateAsset: mockUpdateAsset,
      updateCurrentPage: jest.fn(),
    } as unknown as SendContext.SendContextType);
    const mockUseSearchParams = jest.mocked(useSearchParams);
    mockUseSearchParams.mockReturnValue([
      {
        get: (param: string) => {
          if (param === 'asset') {
            return nft.address;
          }
          if (param === 'chainId') {
            return nft.chainId;
          }
          if (param === 'tokenId') {
            return nft.tokenId;
          }
          return undefined;
        },
      },
    ] as unknown as [URLSearchParams, SetURLSearchParams]);
    renderHook();
    expect(mockUpdateAsset).toHaveBeenCalledWith(nft);
  });

  it('does not update asset if it is already defined in send context', () => {
    const mockUpdateAsset = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateAsset: mockUpdateAsset,
      updateCurrentPage: jest.fn(),
      asset: EVM_ASSET,
    } as unknown as SendContext.SendContextType);
    renderHook();
    expect(mockUpdateAsset).not.toHaveBeenCalled();
  });

  it('update amount if it is present in the params', () => {
    const token = {
      ...EVM_ASSET,
      chainId: '0x5',
      assetId: EVM_ASSET.address,
    };
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getAssetsBySelectedAccountGroup) {
        return [token];
      }
      return undefined;
    });

    const mockUpdateValue = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateAsset: jest.fn(),
      updateValue: mockUpdateValue,
      updateCurrentPage: jest.fn(),
    } as unknown as SendContext.SendContextType);
    const mockUseSearchParams = jest.mocked(useSearchParams);
    mockUseSearchParams.mockReturnValue([
      {
        get: (param: string) => {
          if (param === 'asset') {
            return token.address;
          }
          if (param === 'chainId') {
            return token.chainId;
          }
          if (param === 'amount') {
            return '10';
          }
          if (param === 'maxValueMode') {
            return 'true';
          }
          return undefined;
        },
      },
    ] as unknown as [URLSearchParams, SetURLSearchParams]);
    renderHook();
    expect(mockUpdateValue).toHaveBeenCalledWith('10', true);
  });

  it('does not update amount if it is already defined in send context', () => {
    const mockUpdateValue = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateValue: mockUpdateValue,
      updateCurrentPage: jest.fn(),
      value: '10',
    } as unknown as SendContext.SendContextType);
    renderHook();
    expect(mockUpdateValue).not.toHaveBeenCalled();
  });

  it('update recipient if it is present in the params', () => {
    const mockUpdateTo = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateTo: mockUpdateTo,
      updateCurrentPage: jest.fn(),
    } as unknown as SendContext.SendContextType);

    const mockUseSearchParams = jest.mocked(useSearchParams);
    mockUseSearchParams.mockReturnValue([
      {
        get: (param: string) => {
          return param === 'recipient' ? 'abc' : undefined;
        },
      },
    ] as unknown as [URLSearchParams, SetURLSearchParams]);
    renderHook();
    expect(mockUpdateTo).toHaveBeenCalledWith('abc');
  });

  it('does not update recipient if it is already defined in send context', () => {
    const mockUpdateTo = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateTo: mockUpdateTo,
      updateCurrentPage: jest.fn(),
      to: 'acb',
    } as unknown as SendContext.SendContextType);
    renderHook();
    expect(mockUpdateTo).not.toHaveBeenCalled();
  });

  it('update hex data if it is present in the params', () => {
    const mockUpdateHexData = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateHexData: mockUpdateHexData,
      updateCurrentPage: jest.fn(),
    } as unknown as SendContext.SendContextType);

    const mockUseSearchParams = jest.mocked(useSearchParams);
    mockUseSearchParams.mockReturnValue([
      {
        get: (param: string) => {
          return param === 'hexData' ? '0x1' : undefined;
        },
      },
    ] as unknown as [URLSearchParams, SetURLSearchParams]);
    renderHook();
    expect(mockUpdateHexData).toHaveBeenCalledWith('0x1');
  });
});
