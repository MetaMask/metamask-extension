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
jest.mock('./components/Header', () => ({ Header: () => null }));
jest.mock('./components/NetworkToolbar', () => ({
  NetworkToolbar: () => null,
}));
jest.mock('./components/SortingToolbar', () => ({
  SortingToolbar: () => null,
}));
jest.mock('./components/AssetList', () => ({ AssetList: () => null }));
jest.mock('./components/BatchSellEmptySelectTokens', () => ({
  BatchSellEmptySelectTokens: () => <div>empty</div>,
}));
// Footer renders the submit button. We always enable it here so clicking it
// always reaches onSubmit regardless of selection count.
jest.mock('./components/Footer', () => ({
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
jest.mock('../../hooks/useBatchSellModal', () => ({
  useBatchSellModal: () => ({
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
const ASSET_ID = 'eip155:1/erc20:0xTokenAddress';
const STABLECOIN_ASSET_ID =
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType;

const mockNetworks = [
  { chainId: CHAIN_ID, name: 'Ethereum', imageUrl: 'eth.png' },
];

const mockAsset = {
  assetId: ASSET_ID,
  name: 'Ether',
  symbol: 'ETH',
  image: '',
  balance: '1.0',
  fiatBalance: '2000',
  isNative: true,
  chainId: CHAIN_ID,
  address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
};

let mockDestStablecoins: CaipAssetType[] = [STABLECOIN_ASSET_ID];
// Mutated per-test to control the asset list returned by the selector
const mockAssetList: (
  | typeof mockAsset
  | ({ address: undefined } & Omit<typeof mockAsset, 'address'>)
)[] = [mockAsset];

jest.mock('../../../../ducks/batch-sell/selectors', () => ({
  getAvailableBatchSellNetworksSelector: () => mockNetworks,
  getAvailableBatchSellAssetsForNetworkSelector: () => mockAssetList,
  selectBatchSellDestStablecoins: () => mockDestStablecoins,
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

  it('passes the source token from the selected asset when address is defined', () => {
    // Pre-select the asset so the find() in navigateToBridgePageAndPreselect resolves it
    mockInitialAssetsId.push(mockAsset.assetId);

    renderAndTriggerBridgeNavigation();

    expect(mockOpenBridgeExperience).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        symbol: mockAsset.symbol,
        address: mockAsset.address,
        name: mockAsset.name,
        chainId: mockAsset.chainId,
      }),
      expect.anything(),
    );
  });

  it('passes undefined as source token when selected asset has no address', () => {
    // Swap the asset list for one whose address is undefined
    mockAssetList.length = 0;
    mockAssetList.push({ ...mockAsset, address: undefined });
    mockInitialAssetsId.push(mockAsset.assetId);

    renderAndTriggerBridgeNavigation();

    // Second arg (sourceToken) should be undefined when no address
    expect(mockOpenBridgeExperience.mock.calls[0][1]).toBeUndefined();
  });
});
