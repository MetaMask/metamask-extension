import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import type { CaipChainId, CaipAssetType } from '@metamask/utils';
import * as useBridgingModule from '../../../../hooks/bridge/useBridging';
import { BatchSellSelectPage } from '.';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ state: null, pathname: '/batch-sell/select' }),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../../hooks/bridge/useBridging');

const mockOpenBridgeExperience = jest.fn();

const mockNavigateToBatchSellConfirmPage = jest.fn();
jest.mock('../../../../hooks/batch-sell/useBatchSellNavigation', () => ({
  useBatchSellNavigation: () => ({
    navigateToBatchSellConfirmPage: mockNavigateToBatchSellConfirmPage,
  }),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

// Stubs for sub-components – we don't need their real rendering.
jest.mock('./components/header', () => ({ Header: () => null }));
jest.mock('./components/network-toolbar', () => ({
  NetworkToolbar: () => null,
}));
jest.mock('./components/sorting-toolbar', () => ({
  SortingToolbar: () => null,
}));
jest.mock('./components/asset-list', () => ({ AssetList: () => null }));
jest.mock('./components/batch-sell-empty-select-tokens', () => ({
  BatchSellEmptySelectTokens: () => <div>empty</div>,
}));
// Footer renders the submit button. We always enable it here so clicking it
// always reaches onSubmit regardless of selection count.
jest.mock('./components/footer', () => ({
  Footer: ({ onSubmit }: { onSubmit: () => void }) => (
    <button data-testid="footer-submit" onClick={onSubmit}>
      submit
    </button>
  ),
}));

// useBatchSellModal – capture openModal so we can trigger its CTA.
// The factory must only reference mock-prefixed variables to satisfy Jest's
// out-of-scope variable restriction.
const mockOpenModal = jest.fn();
const mockCloseModal = jest.fn();
jest.mock('../../hooks/useBatchSellInfoModal', () => ({
  useBatchSellInfoModal: () => ({
    openModal: (...args: unknown[]) => mockOpenModal(...args),
    closeModal: (...args: unknown[]) => mockCloseModal(...args),
  }),
}));

jest.mock(
  '../../../../hooks/batch-sell/useSortBatchSellAssetsByBalance',
  () => ({
    useSortBatchSellAssetsByBalance: (assets: unknown[]) => assets,
  }),
);

// Controlled by tests via mockInitialAssetsId
const mockInitialAssetsId: string[] = [];
jest.mock('./hooks/useInitialStateFromLocation', () => ({
  useInitialStateFromLocation: (
    chainIds: CaipChainId[],
  ): { networkChainId: CaipChainId | null; assetsId: string[] } => ({
    networkChainId: chainIds[0] ?? null,
    assetsId: mockInitialAssetsId,
  }),
}));

const CHAIN_ID = 'eip155:1' as CaipChainId;
// Native asset id (slip44:60) -> source token address derived as 0x0000…0000
const NATIVE_ASSET_ID = 'eip155:1/slip44:60' as CaipAssetType;
const ERC20_TOKEN_ADDRESS =
  '0xdAC17F958D2ee523a2206206994597C13D831ec7' as `0x${string}`;
const ERC20_ASSET_ID = `eip155:1/erc20:${ERC20_TOKEN_ADDRESS}` as CaipAssetType;
const STABLECOIN_ASSET_ID =
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType;

const mockNetworks = [
  { chainId: CHAIN_ID, name: 'Ethereum', imageUrl: 'eth.png' },
];

const mockAsset = {
  assetId: NATIVE_ASSET_ID,
  name: 'Ether',
  symbol: 'ETH',
  iconUrl: '',
  balance: '1.0',
  decimals: 18,
  tokenFiatAmount: 2000,
  chainId: CHAIN_ID,
};

let mockDestStablecoins: CaipAssetType[] = [STABLECOIN_ASSET_ID];
// Mutated per-test to control the asset list returned by the selector
const mockAssetList: (typeof mockAsset)[] = [mockAsset];

jest.mock('../../../../ducks/batch-sell/selectors', () => ({
  getAvailableBatchSellNetworks: () => mockNetworks,
  getAvailableBatchSellSwapAssetsForNetwork: () => mockAssetList,
  getBatchSellDestStablecoinsForNetwork: () => mockDestStablecoins,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('../../../../constants/batch-sell', () => ({
  MIN_SELECTED_ALLOWED_TOKENS: 2,
  MAX_SELECTED_ALLOWED_TOKENS: 10,
}));

describe('BatchSellSelectPage – navigateToBridgePageAndPreselect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDestStablecoins = [STABLECOIN_ASSET_ID];
    mockInitialAssetsId.length = 0;
    mockAssetList.length = 0;
    mockAssetList.push(mockAsset);
    jest
      .spyOn(useBridgingModule, 'default')
      .mockReturnValue({ openBridgeExperience: mockOpenBridgeExperience });
  });

  /**
   * Renders the page then clicks submit to trigger onSubmit. Because
   * useInitialStateFromLocation is stubbed to return [] assets, the selection
   * count is always 0 (< MIN_SELECTED), so onSubmit always opens the alert
   * modal. We then extract the CTA callback captured by mockOpenModal and call
   * it to reach navigateToBridgePageAndPreselect.
   */
  function renderAndTriggerBridgeNavigation() {
    const { getByTestId } = render(<BatchSellSelectPage />);

    fireEvent.click(getByTestId('footer-submit'));

    // Retrieve the ctaProps.onClick that was passed to openModal
    const ctaCallback: (() => void) | undefined =
      mockOpenModal.mock.calls[0]?.[0]?.ctaProps?.onClick;
    ctaCallback?.();
  }

  it('passes the first batchSellDestStablecoin as destTokenAssetId when the list is non-empty', () => {
    renderAndTriggerBridgeNavigation();

    expect(mockOpenBridgeExperience).toHaveBeenCalledTimes(1);
    // Third argument must be the first stablecoin asset id
    expect(mockOpenBridgeExperience.mock.calls[0][2]).toBe(STABLECOIN_ASSET_ID);
  });

  it('passes undefined as destTokenAssetId when batchSellDestStablecoins is empty', () => {
    mockDestStablecoins = [];

    renderAndTriggerBridgeNavigation();

    expect(mockOpenBridgeExperience).toHaveBeenCalledTimes(1);
    expect(mockOpenBridgeExperience.mock.calls[0][2]).toBeUndefined();
  });

  it('calls closeModal before navigating to the bridge page', () => {
    renderAndTriggerBridgeNavigation();

    expect(mockCloseModal).toHaveBeenCalledTimes(1);
    expect(mockOpenBridgeExperience).toHaveBeenCalledTimes(1);
    // closeModal must be called before openBridgeExperience
    const closeOrder = mockCloseModal.mock.invocationCallOrder[0];
    const openOrder = mockOpenBridgeExperience.mock.invocationCallOrder[0];
    expect(closeOrder).toBeLessThan(openOrder);
  });

  it('passes the source token derived from the selected native asset', () => {
    // Pre-select the asset so the find() in navigateToBridgePageAndPreselect resolves it
    mockInitialAssetsId.push(mockAsset.assetId);

    renderAndTriggerBridgeNavigation();

    expect(mockOpenBridgeExperience).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        symbol: mockAsset.symbol,
        // Native EVM assets resolve to the canonical zero address.
        address: '0x0000000000000000000000000000000000000000',
        name: mockAsset.name,
        chainId: mockAsset.chainId,
      }),
      expect.anything(),
    );
  });

  it('passes the contract address as source token address for an ERC-20 asset', () => {
    const erc20Asset = {
      ...mockAsset,
      assetId: ERC20_ASSET_ID,
      symbol: 'USDT',
      name: 'Tether USD',
    };
    mockAssetList.length = 0;
    mockAssetList.push(erc20Asset);
    mockInitialAssetsId.push(erc20Asset.assetId);

    renderAndTriggerBridgeNavigation();

    expect(mockOpenBridgeExperience).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        symbol: erc20Asset.symbol,
        address: ERC20_TOKEN_ADDRESS,
        name: erc20Asset.name,
        chainId: erc20Asset.chainId,
      }),
      expect.anything(),
    );
  });

  it('passes undefined as source token when no asset is selected', () => {
    // No initial assets selected -> selectedAsset resolves to undefined
    mockInitialAssetsId.length = 0;

    renderAndTriggerBridgeNavigation();

    // Second arg (sourceToken) should be undefined when no asset is found
    expect(mockOpenBridgeExperience.mock.calls[0][1]).toBeUndefined();
  });
});
