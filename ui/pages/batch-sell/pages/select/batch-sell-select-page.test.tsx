import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import * as useBridgingModule from '../../../../hooks/bridge/useBridging';
import { buildBatchSellAsset } from '../../../../../test/data/batch-sell';
import { BatchSellSelectPage } from './batch-sell-select-page';

const CHAIN_ID = 'eip155:1' as CaipChainId;
const NATIVE_ASSET_ID = 'eip155:1/slip44:60' as CaipAssetType;
const ERC20_TOKEN_ADDRESS =
  '0xdAC17F958D2ee523a2206206994597C13D831ec7' as `0x${string}`;
const ERC20_ASSET_ID = `eip155:1/erc20:${ERC20_TOKEN_ADDRESS}` as CaipAssetType;
const STABLECOIN_ASSET_ID =
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType;

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
  openBridgeExperience: jest.fn(),
  navigateToBatchSellConfirmPage: jest.fn(),
  openModal: jest.fn(),
  closeModal: jest.fn(),
};

// Router & i18n: minimal stubs so hooks resolve.
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ state: null, pathname: '/batch-sell/select' }),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

// Hooks under integration: forwarded to `mockFns` so tests can assert on them.
// `useBridging` has a default export, so we auto-mock the module and re-bind
// it inside `beforeEach` via `jest.spyOn` (see below).
jest.mock('../../../../hooks/bridge/useBridging');

jest.mock('../../../../hooks/batch-sell/useBatchSellNavigation', () => ({
  useBatchSellNavigation: () => ({
    navigateToBatchSellConfirmPage: mockFns.navigateToBatchSellConfirmPage,
  }),
}));

jest.mock('../../hooks/useBatchSellInfoModal', () => ({
  useBatchSellInfoModal: () => ({
    openModal: mockFns.openModal,
    closeModal: mockFns.closeModal,
  }),
}));

jest.mock('../../providers/batch-sell-selection-provider', () => ({
  useBatchSellSelection: () => ({
    selectedNetworkChainId: CHAIN_ID,
    selectedAssetsId: mockHarness.initialAssetsId,
    assetsOrderByBalance: 'desc' as const,
    setSelectedNetworkChainId: jest.fn(),
    setSelectedAssetsId: jest.fn(),
    setAssetsOrderByBalance: jest.fn(),
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
// because every test exercises the < MIN_SELECTED_ALLOWED_TOKENS branch.
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
 * Renders the page, clicks the (mocked) Footer submit button, then invokes
 * the CTA callback that the page registers with `openModal`. Returns nothing
 * because every assertion is made against the `mockFns` jest functions.
 */
function renderAndTriggerBridgeNavigation() {
  const { getByTestId } = render(<BatchSellSelectPage />);
  fireEvent.click(getByTestId('footer-submit'));
  mockFns.openModal.mock.calls[0]?.[0]?.ctaProps?.onClick?.();
}

describe('BatchSellSelectPage – navigateToBridgePageAndPreselect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHarness.initialAssetsId = [];
    mockHarness.assetList = [makeAsset()];
    mockHarness.destStablecoins = [STABLECOIN_ASSET_ID];
    jest
      .spyOn(useBridgingModule, 'default')
      .mockReturnValue({ openBridgeExperience: mockFns.openBridgeExperience });
  });

  it('passes the first batchSellDestStablecoin as destTokenAssetId when the list is non-empty', () => {
    renderAndTriggerBridgeNavigation();

    expect(mockFns.openBridgeExperience).toHaveBeenCalledTimes(1);
    expect(mockFns.openBridgeExperience.mock.calls[0][2]).toBe(
      STABLECOIN_ASSET_ID,
    );
  });

  it('passes undefined as destTokenAssetId when batchSellDestStablecoins is empty', () => {
    mockHarness.destStablecoins = [];

    renderAndTriggerBridgeNavigation();

    expect(mockFns.openBridgeExperience).toHaveBeenCalledTimes(1);
    expect(mockFns.openBridgeExperience.mock.calls[0][2]).toBeUndefined();
  });

  it('calls closeModal before navigating to the bridge page', () => {
    renderAndTriggerBridgeNavigation();

    expect(mockFns.closeModal).toHaveBeenCalledTimes(1);
    expect(mockFns.openBridgeExperience).toHaveBeenCalledTimes(1);
    expect(mockFns.closeModal.mock.invocationCallOrder[0]).toBeLessThan(
      mockFns.openBridgeExperience.mock.invocationCallOrder[0],
    );
  });

  it('passes the source token derived from the selected native asset', () => {
    mockHarness.initialAssetsId = [NATIVE_ASSET_ID];

    renderAndTriggerBridgeNavigation();

    expect(mockFns.openBridgeExperience).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        symbol: 'ETH',
        // Native EVM assets resolve to the canonical zero address.
        address: '0x0000000000000000000000000000000000000000',
        name: 'Ether',
        chainId: CHAIN_ID,
      }),
      expect.anything(),
    );
  });

  it('passes the contract address as source token address for an ERC-20 asset', () => {
    const erc20 = makeAsset({
      assetId: ERC20_ASSET_ID,
      symbol: 'USDT',
      name: 'Tether USD',
    });
    mockHarness.assetList = [erc20];
    mockHarness.initialAssetsId = [ERC20_ASSET_ID];

    renderAndTriggerBridgeNavigation();

    expect(mockFns.openBridgeExperience).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        symbol: 'USDT',
        address: ERC20_TOKEN_ADDRESS,
        name: 'Tether USD',
        chainId: CHAIN_ID,
      }),
      expect.anything(),
    );
  });

  it('passes undefined as source token when no asset is selected', () => {
    renderAndTriggerBridgeNavigation();

    expect(mockFns.openBridgeExperience.mock.calls[0][1]).toBeUndefined();
  });
});
