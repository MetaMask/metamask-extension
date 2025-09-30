/* eslint-disable @typescript-eslint/naming-convention */
import React, { ReactChildren } from 'react';

import mockState from '../../../../../../test/data/mock-state.json';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
  MOCK_NFT1155,
} from '../../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  AssetFilterMethod,
  useSendMetricsContext,
} from '../../../context/send-metrics';
import { useSendAssets } from '../useSendAssets';
import { useSendType } from '../useSendType';
import { useAssetSelectionMetrics } from './useAssetSelectionMetrics';

const mockTrackEvent = jest.fn();
const mockSetAssetFilterMethod = jest.fn();
const mockUseSendMetricsContext = jest.mocked(useSendMetricsContext);
const mockUseSendAssets = jest.mocked(useSendAssets);
const mockUseSendType = jest.mocked(useSendType);

jest.mock('../../../context/send-metrics', () => ({
  ...jest.requireActual('../../../context/send-metrics'),
  useSendMetricsContext: jest.fn(),
}));

jest.mock('../useSendAssets');
jest.mock('../useSendType');

const Container = ({ children }: { children: ReactChildren }) => (
  <MetaMetricsContext.Provider value={mockTrackEvent}>
    {children}
  </MetaMetricsContext.Provider>
);

describe('useAssetSelectionMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSendMetricsContext.mockReturnValue({
      accountType: 'MetaMask',
      assetFilterMethod: [AssetFilterMethod.None],
      assetListSize: '5',
      amountInputMethod: 'manual',
      amountInputType: 'token',
      recipientInputMethod: 'manual',
      setAmountInputMethod: jest.fn(),
      setAmountInputType: jest.fn(),
      setAssetFilterMethod: mockSetAssetFilterMethod,
      setAssetListSize: jest.fn(),
      setRecipientInputMethod: jest.fn(),
    });

    mockUseSendAssets.mockReturnValue({
      tokens: [EVM_ASSET, EVM_NATIVE_ASSET],
      nfts: [MOCK_NFT1155],
    } as unknown as ReturnType<typeof useSendAssets>);

    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isEvmNativeSendType: false,
      isNonEvmSendType: false,
      isNonEvmNativeSendType: false,
      isSolanaSendType: false,
    });
  });

  describe('addAssetFilterMethod', () => {
    it('adds new filter method to existing array', () => {
      mockUseSendMetricsContext.mockReturnValue({
        accountType: 'MetaMask',
        assetFilterMethod: [AssetFilterMethod.Search],
        assetListSize: '5',
        amountInputMethod: 'manual',
        amountInputType: 'token',
        recipientInputMethod: 'manual',
        setAmountInputMethod: jest.fn(),
        setAmountInputType: jest.fn(),
        setAssetFilterMethod: mockSetAssetFilterMethod,
        setAssetListSize: jest.fn(),
        setRecipientInputMethod: jest.fn(),
      });

      const { result } = renderHookWithProvider(
        () => useAssetSelectionMetrics(),
        mockState,
        undefined,
        Container,
      );

      result.current.addAssetFilterMethod(AssetFilterMethod.Network);

      expect(mockSetAssetFilterMethod).toHaveBeenCalledWith([
        AssetFilterMethod.Search,
        AssetFilterMethod.Network,
      ]);
    });

    it('removes "none" filter method when adding a new one', () => {
      const { result } = renderHookWithProvider(
        () => useAssetSelectionMetrics(),
        mockState,
        undefined,
        Container,
      );

      result.current.addAssetFilterMethod(AssetFilterMethod.Search);

      expect(mockSetAssetFilterMethod).toHaveBeenCalledWith([
        AssetFilterMethod.Search,
      ]);
    });

    it('does not add duplicate filter methods', () => {
      mockUseSendMetricsContext.mockReturnValue({
        accountType: 'MetaMask',
        assetFilterMethod: [AssetFilterMethod.Search],
        assetListSize: '5',
        amountInputMethod: 'manual',
        amountInputType: 'token',
        recipientInputMethod: 'manual',
        setAmountInputMethod: jest.fn(),
        setAmountInputType: jest.fn(),
        setAssetFilterMethod: mockSetAssetFilterMethod,
        setAssetListSize: jest.fn(),
        setRecipientInputMethod: jest.fn(),
      });

      const { result } = renderHookWithProvider(
        () => useAssetSelectionMetrics(),
        mockState,
        undefined,
        Container,
      );

      result.current.addAssetFilterMethod(AssetFilterMethod.Search);

      expect(mockSetAssetFilterMethod).toHaveBeenCalledWith([
        AssetFilterMethod.Search,
      ]);
    });
  });

  describe('removeAssetFilterMethod', () => {
    it('removes filter method from array', () => {
      mockUseSendMetricsContext.mockReturnValue({
        accountType: 'MetaMask',
        assetFilterMethod: [
          AssetFilterMethod.Search,
          AssetFilterMethod.Network,
        ],
        assetListSize: '5',
        amountInputMethod: 'manual',
        amountInputType: 'token',
        recipientInputMethod: 'manual',
        setAmountInputMethod: jest.fn(),
        setAmountInputType: jest.fn(),
        setAssetFilterMethod: mockSetAssetFilterMethod,
        setAssetListSize: jest.fn(),
        setRecipientInputMethod: jest.fn(),
      });

      const { result } = renderHookWithProvider(
        () => useAssetSelectionMetrics(),
        mockState,
        undefined,
        Container,
      );

      result.current.removeAssetFilterMethod(AssetFilterMethod.Search);

      expect(mockSetAssetFilterMethod).toHaveBeenCalledWith([
        AssetFilterMethod.Network,
      ]);
    });

    it('adds "none" filter method when array becomes empty', () => {
      mockUseSendMetricsContext.mockReturnValue({
        accountType: 'MetaMask',
        assetFilterMethod: [AssetFilterMethod.Search],
        assetListSize: '5',
        amountInputMethod: 'manual',
        amountInputType: 'token',
        recipientInputMethod: 'manual',
        setAmountInputMethod: jest.fn(),
        setAmountInputType: jest.fn(),
        setAssetFilterMethod: mockSetAssetFilterMethod,
        setAssetListSize: jest.fn(),
        setRecipientInputMethod: jest.fn(),
      });

      const { result } = renderHookWithProvider(
        () => useAssetSelectionMetrics(),
        mockState,
        undefined,
        Container,
      );

      result.current.removeAssetFilterMethod(AssetFilterMethod.Search);

      expect(mockSetAssetFilterMethod).toHaveBeenCalledWith([
        AssetFilterMethod.None,
      ]);
    });

    it('does nothing when removing non-existent filter method', () => {
      mockUseSendMetricsContext.mockReturnValue({
        accountType: 'MetaMask',
        assetFilterMethod: [AssetFilterMethod.Search],
        assetListSize: '5',
        amountInputMethod: 'manual',
        amountInputType: 'token',
        recipientInputMethod: 'manual',
        setAmountInputMethod: jest.fn(),
        setAmountInputType: jest.fn(),
        setAssetFilterMethod: mockSetAssetFilterMethod,
        setAssetListSize: jest.fn(),
        setRecipientInputMethod: jest.fn(),
      });

      const { result } = renderHookWithProvider(
        () => useAssetSelectionMetrics(),
        mockState,
        undefined,
        Container,
      );

      result.current.removeAssetFilterMethod(AssetFilterMethod.Network);

      expect(mockSetAssetFilterMethod).toHaveBeenCalledWith([
        AssetFilterMethod.Search,
      ]);
    });
  });

  describe('captureAssetSelected', () => {
    it('tracks token asset selection with correct properties', () => {
      const { result } = renderHookWithProvider(
        () => useAssetSelectionMetrics(),
        mockState,
        undefined,
        Container,
      );

      result.current.captureAssetSelected(EVM_ASSET);

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'Send Asset Selected',
        category: 'Send',
        properties: {
          account_type: 'MetaMask',
          asset_type: 'token',
          asset_list_position: 1,
          asset_list_size: '5',
          chain_id: 5,
          chain_id_caip: undefined,
          filter_method: [AssetFilterMethod.None],
        },
      });
    });

    it('tracks native asset selection with correct properties', () => {
      const nativeAsset = { ...EVM_NATIVE_ASSET, isNative: true };

      const { result } = renderHookWithProvider(
        () => useAssetSelectionMetrics(),
        mockState,
        undefined,
        Container,
      );

      result.current.captureAssetSelected(nativeAsset);

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'Send Asset Selected',
        category: 'Send',
        properties: {
          account_type: 'MetaMask',
          asset_type: 'native',
          asset_list_position: 0,
          asset_list_size: '5',
          chain_id: 5,
          chain_id_caip: undefined,
          filter_method: [AssetFilterMethod.None],
        },
      });
    });

    it('tracks NFT asset selection with correct properties', () => {
      const { result } = renderHookWithProvider(
        () => useAssetSelectionMetrics(),
        mockState,
        undefined,
        Container,
      );

      result.current.captureAssetSelected(MOCK_NFT1155);

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'Send Asset Selected',
        category: 'Send',
        properties: {
          account_type: 'MetaMask',
          asset_type: 'nft',
          asset_list_position: 3,
          asset_list_size: '5',
          chain_id: 8453,
          chain_id_caip: undefined,
          filter_method: [AssetFilterMethod.None],
        },
      });
    });

    it('uses chain_id_caip for non-EVM assets', () => {
      mockUseSendType.mockReturnValue({
        isEvmSendType: false,
        isEvmNativeSendType: false,
        isNonEvmSendType: true,
        isNonEvmNativeSendType: false,
        isSolanaSendType: true,
      });

      const { result } = renderHookWithProvider(
        () => useAssetSelectionMetrics(),
        mockState,
        undefined,
        Container,
      );

      result.current.captureAssetSelected(EVM_ASSET);

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'Send Asset Selected',
        category: 'Send',
        properties: {
          account_type: 'MetaMask',
          asset_type: 'token',
          asset_list_position: 1,
          asset_list_size: '5',
          chain_id: undefined,
          chain_id_caip: 5,
          filter_method: [AssetFilterMethod.None],
        },
      });
    });

    it('calculates correct position for asset not in list', () => {
      const unknownAsset = {
        address: '0x123',
        chainId: 1,
        symbol: 'UNK',
        decimals: 18,
      };

      const { result } = renderHookWithProvider(
        () => useAssetSelectionMetrics(),
        mockState,
        undefined,
        Container,
      );

      result.current.captureAssetSelected(unknownAsset);

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'Send Asset Selected',
        category: 'Send',
        properties: {
          account_type: 'MetaMask',
          asset_type: 'token',
          asset_list_position: 0,
          asset_list_size: '5',
          chain_id: 1,
          chain_id_caip: undefined,
          filter_method: [AssetFilterMethod.None],
        },
      });
    });
  });

  it('captures metrics by calling trackEvent', () => {
    const { result } = renderHookWithProvider(
      () => useAssetSelectionMetrics(),
      mockState,
      undefined,
      Container,
    );
    result.current.captureAssetSelected(EVM_ASSET, 1);
    expect(mockTrackEvent).toHaveBeenCalled();
  });

  it('return field getting asset selection related details', () => {
    const { result } = renderHookWithProvider(
      () => useAssetSelectionMetrics(),
      mockState,
    );
    expect(result.current.addAssetFilterMethod).toBeDefined();
    expect(result.current.captureAssetSelected).toBeDefined();
    expect(result.current.removeAssetFilterMethod).toBeDefined();
    expect(result.current.setAssetListSize).toBeDefined();
  });
});
