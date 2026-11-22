import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { buildBatchSellAsset } from '../../../../../test/data/batch-sell';
import { BatchSellSelectPage } from './batch-sell-select-page';

const CHAIN_ID = 'eip155:1' as CaipChainId;
const NATIVE_ASSET_ID = 'eip155:1/slip44:60' as CaipAssetType;
const ERC20_ASSET_ID =
  'eip155:1/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7' as CaipAssetType;
const STABLECOIN_ASSET_ID =
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType;
const OTHER_STABLECOIN_ASSET_ID =
  'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F' as CaipAssetType;

const makeAsset = (overrides: Record<string, unknown> = {}) =>
  buildBatchSellAsset({
    assetId: NATIVE_ASSET_ID,
    name: 'Ether',
    symbol: 'ETH',
    iconUrl: '',
    balance: '1.0',
    tokenFiatAmount: 2000,
    chainId: CHAIN_ID,
    ...overrides,
  });

// State controlled per-test. Both objects are prefixed with `mock` so they
// can be referenced from inside `jest.mock(..)` factories (which only permit
// out-of-scope variables whose names start with `mock`).
const mockHarness = {
  initialAssetsId: [] as string[],
  assetList: [makeAsset()] as ReturnType<typeof makeAsset>[],
  destStablecoins: [STABLECOIN_ASSET_ID] as CaipAssetType[],
};

const mockFns = {
  navigateToBatchSellConfirmPage: jest.fn(),
  openHighAlertModal: jest.fn(),
};

// Router: minimal stub so hooks resolve.
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ state: null, pathname: '/batch-sell/select' }),
  useNavigate: () => jest.fn(),
}));

// Hooks under integration: forwarded to `mockFns` so tests can assert on them.
jest.mock('../../../../hooks/batch-sell/useBatchSellNavigation', () => ({
  useBatchSellNavigation: () => ({
    navigateToBatchSellConfirmPage: mockFns.navigateToBatchSellConfirmPage,
  }),
}));

jest.mock('../../hooks/useBatchSellHighRateAlertModal', () => ({
  useBatchSellHighRateAlertModal: () => ({
    openHighAlertModal: mockFns.openHighAlertModal,
    closeHighAlertModal: jest.fn(),
  }),
}));

jest.mock('../../providers/batch-sell-selection-provider', () => ({
  useBatchSellSelection: () => ({
    selectedNetworkChainId: CHAIN_ID,
    selectedAssetsId: mockHarness.initialAssetsId,
    assetsOrderByBalance: 'desc' as const,
    hasUserInteracted: false,
    setSelectedNetworkChainId: jest.fn(),
    setSelectedAssetsId: jest.fn(),
    setAssetsOrderByBalance: jest.fn(),
    setHasUserInteracted: jest.fn(),
  }),
}));

// Selectors: returned values come from `mockHarness`, so tests can rewrite them.
jest.mock('../../../../ducks/batch-sell/selectors', () => ({
  getAvailableBatchSellNetworks: () => [
    { chainId: CHAIN_ID, name: 'Ethereum', imageUrl: 'eth.png' },
  ],
  getAvailableBatchSellSwapAssetsForNetwork: () => mockHarness.assetList,
  getBatchSellDestStablecoinsForNetwork: () => mockHarness.destStablecoins,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

// Sub-components: rendered as nulls because their real implementations pull
// in more redux/selector wiring than this test needs. The Footer is replaced
// with a button that always fires onSubmit, regardless of selection count,
// so each test only needs to control `mockHarness.initialAssetsId`.
jest.mock('./components/header', () => ({ Header: () => null }));
jest.mock('./components/network-toolbar', () => ({
  NetworkToolbar: () => null,
}));
jest.mock('./components/sorting-toolbar', () => ({
  SortingToolbar: () => null,
}));
jest.mock('./components/asset-list', () => ({ AssetList: () => null }));
jest.mock('./components/batch-sell-empty-select-tokens', () => ({
  BatchSellEmptySelectTokens: () => null,
}));
jest.mock('./components/footer', () => ({
  Footer: ({ onSubmit }: { onSubmit: () => void }) => (
    <button data-testid="footer-submit" onClick={onSubmit}>
      submit
    </button>
  ),
}));

/**
 * Renders the page and clicks the (mocked) Footer submit button, triggering
 * `onSubmit`. Returns nothing because every assertion is made against the
 * `mockFns` jest functions.
 */
function renderAndSubmit() {
  const { getByTestId } = render(<BatchSellSelectPage />);
  fireEvent.click(getByTestId('footer-submit'));
}

describe('BatchSellSelectPage – onSubmit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHarness.initialAssetsId = [];
    mockHarness.assetList = [makeAsset()];
    mockHarness.destStablecoins = [STABLECOIN_ASSET_ID];
  });

  describe('when fewer than MIN_SELECTED_ALLOWED_TOKENS assets are selected', () => {
    it('opens the high alert modal instead of navigating to the confirm page', () => {
      renderAndSubmit();

      expect(mockFns.openHighAlertModal).toHaveBeenCalledTimes(1);
      expect(mockFns.navigateToBatchSellConfirmPage).not.toHaveBeenCalled();
    });

    it('passes the asset matching the first selected asset id as the source asset', () => {
      mockHarness.initialAssetsId = [NATIVE_ASSET_ID];

      renderAndSubmit();

      expect(mockFns.openHighAlertModal).toHaveBeenCalledWith(
        mockHarness.assetList[0],
        STABLECOIN_ASSET_ID,
      );
    });

    it('passes undefined as the source asset when no asset is selected', () => {
      renderAndSubmit();

      expect(mockFns.openHighAlertModal).toHaveBeenCalledWith(
        undefined,
        STABLECOIN_ASSET_ID,
      );
    });

    it('passes the first batchSellDestStablecoin as the destination asset id', () => {
      mockHarness.destStablecoins = [
        STABLECOIN_ASSET_ID,
        OTHER_STABLECOIN_ASSET_ID,
      ];

      renderAndSubmit();

      expect(mockFns.openHighAlertModal).toHaveBeenCalledWith(
        undefined,
        STABLECOIN_ASSET_ID,
      );
    });

    it('passes undefined as the destination asset id when batchSellDestStablecoins is empty', () => {
      mockHarness.destStablecoins = [];

      renderAndSubmit();

      expect(mockFns.openHighAlertModal).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });
  });

  describe('when at least MIN_SELECTED_ALLOWED_TOKENS assets are selected', () => {
    it('navigates to the confirm page instead of opening the high alert modal', () => {
      mockHarness.initialAssetsId = [NATIVE_ASSET_ID, ERC20_ASSET_ID];

      renderAndSubmit();

      expect(mockFns.navigateToBatchSellConfirmPage).toHaveBeenCalledTimes(1);
      expect(mockFns.openHighAlertModal).not.toHaveBeenCalled();
    });
  });
});
