import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { importCustomAssetsBatch } from '../store/actions';
import { useArcDefaultTokens } from './useArcDefaultTokens';

jest.mock('../store/actions', () => ({
  importCustomAssetsBatch: jest.fn(() => ({
    type: 'MOCK_IMPORT_CUSTOM_ASSETS_BATCH',
  })),
}));

const mockImportCustomAssetsBatch = jest.mocked(importCustomAssetsBatch);

const ARC_CHAIN_ID = '0x13b2';
const ARC_USDC_ASSET_ID =
  'eip155:5042/erc20:0x3600000000000000000000000000000000000000';

const EXPECTED_ASSETS = [{ assetId: ARC_USDC_ASSET_ID, isHidden: false }];
const EXPECTED_METADATA = {
  [ARC_USDC_ASSET_ID]: { symbol: 'USDC', name: 'USDC', decimals: 6 },
};

const evmAccount1 = {
  id: 'evm-account-1',
  address: '0x1111111111111111111111111111111111111111',
  type: 'eip155:eoa',
};
const evmAccount2 = {
  id: 'evm-account-2',
  address: '0x2222222222222222222222222222222222222222',
  type: 'eip155:eoa',
};
const solanaAccount = {
  id: 'solana-account-1',
  address: 'SoLaNaAddRessFoRTeStiNg11111111111111111111',
  type: 'solana:data-account',
};

const buildState = ({
  arcPresent = true,
  accounts = [evmAccount1],
  customAssets = {},
}: {
  arcPresent?: boolean;
  accounts?: { id: string; address: string; type: string }[];
  customAssets?: Record<string, string[]>;
} = {}) => ({
  metamask: {
    networkConfigurationsByChainId: arcPresent
      ? { [ARC_CHAIN_ID]: { chainId: ARC_CHAIN_ID, name: 'Arc' } }
      : {},
    internalAccounts: {
      accounts: accounts.reduce<Record<string, unknown>>((acc, account) => {
        acc[account.id] = account;
        return acc;
      }, {}),
      selectedAccount: accounts[0]?.id ?? '',
    },
    customAssets,
  },
});

describe('useArcDefaultTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('imports Arc USDC for an EVM account when Arc is present and the asset is missing', () => {
    renderHookWithProvider(() => useArcDefaultTokens(), buildState());

    expect(mockImportCustomAssetsBatch).toHaveBeenCalledTimes(1);
    expect(mockImportCustomAssetsBatch).toHaveBeenCalledWith(
      evmAccount1.id,
      EXPECTED_ASSETS,
      EXPECTED_METADATA,
    );
  });

  it('imports Arc USDC for every EVM account', () => {
    renderHookWithProvider(
      () => useArcDefaultTokens(),
      buildState({ accounts: [evmAccount1, evmAccount2] }),
    );

    expect(mockImportCustomAssetsBatch).toHaveBeenCalledTimes(2);
    expect(mockImportCustomAssetsBatch).toHaveBeenCalledWith(
      evmAccount1.id,
      EXPECTED_ASSETS,
      EXPECTED_METADATA,
    );
    expect(mockImportCustomAssetsBatch).toHaveBeenCalledWith(
      evmAccount2.id,
      EXPECTED_ASSETS,
      EXPECTED_METADATA,
    );
  });

  it('does nothing when the Arc network is not present', () => {
    renderHookWithProvider(
      () => useArcDefaultTokens(),
      buildState({ arcPresent: false }),
    );

    expect(mockImportCustomAssetsBatch).not.toHaveBeenCalled();
  });

  it('skips non-EVM accounts', () => {
    renderHookWithProvider(
      () => useArcDefaultTokens(),
      buildState({ accounts: [solanaAccount] }),
    );

    expect(mockImportCustomAssetsBatch).not.toHaveBeenCalled();
  });

  it('imports only for EVM accounts when EVM and non-EVM accounts are mixed', () => {
    renderHookWithProvider(
      () => useArcDefaultTokens(),
      buildState({ accounts: [evmAccount1, solanaAccount] }),
    );

    expect(mockImportCustomAssetsBatch).toHaveBeenCalledTimes(1);
    expect(mockImportCustomAssetsBatch).toHaveBeenCalledWith(
      evmAccount1.id,
      EXPECTED_ASSETS,
      EXPECTED_METADATA,
    );
  });

  it('does not import when the account already has the Arc USDC custom asset', () => {
    renderHookWithProvider(
      () => useArcDefaultTokens(),
      buildState({
        customAssets: { [evmAccount1.id]: [ARC_USDC_ASSET_ID] },
      }),
    );

    expect(mockImportCustomAssetsBatch).not.toHaveBeenCalled();
  });

  it('treats the existing custom asset case-insensitively', () => {
    renderHookWithProvider(
      () => useArcDefaultTokens(),
      buildState({
        customAssets: { [evmAccount1.id]: [ARC_USDC_ASSET_ID.toUpperCase()] },
      }),
    );

    expect(mockImportCustomAssetsBatch).not.toHaveBeenCalled();
  });

  it('does not re-dispatch for the same account on re-render', () => {
    const { rerender } = renderHookWithProvider(
      () => useArcDefaultTokens(),
      buildState(),
    );

    expect(mockImportCustomAssetsBatch).toHaveBeenCalledTimes(1);

    rerender();

    expect(mockImportCustomAssetsBatch).toHaveBeenCalledTimes(1);
  });
});
