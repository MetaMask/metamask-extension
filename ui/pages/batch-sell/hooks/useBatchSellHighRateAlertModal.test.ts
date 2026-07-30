import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { renderHook, act } from '@testing-library/react-hooks';
import * as useBridgingModule from '../../../hooks/bridge/useBridging';
import { buildBatchSellAsset } from '../../../../test/data/batch-sell';
import { MetaMetricsSwapsEventSource } from '../../../../shared/constants/metametrics';
import { useBatchSellHighRateAlertModal } from './useBatchSellHighRateAlertModal';

const CHAIN_ID = 'eip155:1' as CaipChainId;
const NATIVE_ASSET_ID = 'eip155:1/slip44:60' as CaipAssetType;
const ERC20_TOKEN_ADDRESS =
  '0xdAC17F958D2ee523a2206206994597C13D831ec' as `0x${string}`;
const ERC20_ASSET_ID = `eip155:1/erc20:${ERC20_TOKEN_ADDRESS}` as CaipAssetType;
const DEST_ASSET_ID =
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType;

const makeAsset = (overrides: Record<string, unknown> = {}) =>
  buildBatchSellAsset({
    assetId: NATIVE_ASSET_ID,
    name: 'Ether',
    symbol: 'ETH',
    chainId: CHAIN_ID,
    ...overrides,
  });

// Both objects are prefixed with `mock` so they can be referenced from
// inside `jest.mock(..)` factories (which only permit out-of-scope
// variables whose names start with `mock`).
const mockHarness = {
  selectedNetworkChainId: CHAIN_ID as CaipChainId | null,
  destStablecoins: [DEST_ASSET_ID] as CaipAssetType[],
};

const mockFns = {
  openModal: jest.fn(),
  closeModal: jest.fn(),
  openBridgeExperience: jest.fn(),
};

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('./useBatchSellInfoModal', () => ({
  useBatchSellInfoModal: () => ({
    openModal: mockFns.openModal,
    closeModal: mockFns.closeModal,
  }),
}));

jest.mock('../providers/batch-sell-selection-provider', () => ({
  useBatchSellSelection: () => ({
    selectedNetworkChainId: mockHarness.selectedNetworkChainId,
  }),
}));

jest.mock('../../../ducks/batch-sell/selectors', () => ({
  getBatchSellDestStablecoinsForNetwork: () => mockHarness.destStablecoins,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

// `useBridging` has a default export, so we auto-mock the module and
// re-bind it inside `beforeEach` via `jest.spyOn`.
jest.mock('../../../hooks/bridge/useBridging');

/**
 * Opens the modal via the hook and immediately invokes the CTA callback
 * that was registered with `openModal`, returning nothing because every
 * assertion is made against the `mockFns` jest functions.
 *
 * @param sourceAsset - The asset passed as the first argument to `openHighAlertModal`.
 * @param destAssetId - The asset id passed as the second argument to `openHighAlertModal`.
 */
function openAndClickCta(
  sourceAsset: Parameters<
    ReturnType<typeof useBatchSellHighRateAlertModal>['openHighAlertModal']
  >[0],
  destAssetId: CaipAssetType,
) {
  const { result } = renderHook(() => useBatchSellHighRateAlertModal());

  act(() => {
    result.current.openHighAlertModal(sourceAsset, destAssetId);
  });

  act(() => {
    mockFns.openModal.mock.calls[0][0].ctaProps.onClick();
  });
}

describe('useBatchSellHighRateAlertModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHarness.selectedNetworkChainId = CHAIN_ID;
    mockHarness.destStablecoins = [DEST_ASSET_ID];
    jest
      .spyOn(useBridgingModule, 'default')
      .mockReturnValue({ openBridgeExperience: mockFns.openBridgeExperience });
  });

  it('returns openHighAlertModal and closeHighAlertModal', () => {
    const { result } = renderHook(() => useBatchSellHighRateAlertModal());

    expect(typeof result.current.openHighAlertModal).toBe('function');
    expect(result.current.closeHighAlertModal).toBe(mockFns.closeModal);
  });

  describe('openHighAlertModal', () => {
    it('opens the modal with the high rate alert copy', () => {
      const { result } = renderHook(() => useBatchSellHighRateAlertModal());

      act(() => {
        result.current.openHighAlertModal(makeAsset(), DEST_ASSET_ID);
      });

      expect(mockFns.openModal).toHaveBeenCalledTimes(1);
      expect(mockFns.openModal).toHaveBeenCalledWith(
        expect.objectContaining({
          titleProps: { children: 'batchSellHighRateAlert' },
          descriptionProps: {
            children: 'batchSellHightRateAlertModalDescription',
          },
          ctaProps: expect.objectContaining({
            text: 'yesSwap',
            onClick: expect.any(Function),
          }),
        }),
      );
    });

    it('does not navigate to the bridge experience until the CTA is clicked', () => {
      const { result } = renderHook(() => useBatchSellHighRateAlertModal());

      act(() => {
        result.current.openHighAlertModal(makeAsset(), DEST_ASSET_ID);
      });

      expect(mockFns.openBridgeExperience).not.toHaveBeenCalled();
    });

    it('closes the modal before navigating to the bridge experience when the CTA is clicked', () => {
      openAndClickCta(makeAsset(), DEST_ASSET_ID);

      expect(mockFns.closeModal).toHaveBeenCalledTimes(1);
      expect(mockFns.openBridgeExperience).toHaveBeenCalledTimes(1);
      expect(mockFns.closeModal.mock.invocationCallOrder[0]).toBeLessThan(
        mockFns.openBridgeExperience.mock.invocationCallOrder[0],
      );
    });

    it('passes the swaps main-view metametrics source and the given destAssetId', () => {
      openAndClickCta(makeAsset(), DEST_ASSET_ID);

      expect(mockFns.openBridgeExperience).toHaveBeenCalledWith(
        MetaMetricsSwapsEventSource.MainView,
        expect.anything(),
        DEST_ASSET_ID,
      );
    });

    it('derives the canonical zero address as the source token for a native asset', () => {
      openAndClickCta(makeAsset(), DEST_ASSET_ID);

      expect(mockFns.openBridgeExperience).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
          name: 'Ether',
          chainId: CHAIN_ID,
        }),
        expect.anything(),
      );
    });

    it('derives the contract address as the source token for an ERC-20 asset', () => {
      const erc20 = makeAsset({
        assetId: ERC20_ASSET_ID,
        symbol: 'USDT',
        name: 'Tether USD',
      });

      openAndClickCta(erc20, DEST_ASSET_ID);

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

    it('passes undefined as the source token when no source asset is given', () => {
      openAndClickCta(undefined, DEST_ASSET_ID);

      expect(mockFns.openBridgeExperience.mock.calls[0][1]).toBeUndefined();
    });
  });
});
