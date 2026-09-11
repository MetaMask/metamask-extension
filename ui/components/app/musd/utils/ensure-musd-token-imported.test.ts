import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { toAssetId } from '../../../../../shared/lib/asset-utils';
import { MUSD_TOKEN_ADDRESS } from '../constants';
import { ensureMusdTokenImportedForChain } from './ensure-musd-token-imported';

const mockImportCustomAssetsBatch = jest.fn();

jest.mock('../../../../store/actions', () => ({
  importCustomAssetsBatch: (...args: unknown[]) =>
    mockImportCustomAssetsBatch(...args),
}));

jest.mock('../../../../../shared/lib/selectors/accounts', () => ({
  getSelectedInternalAccount: jest.fn(() => ({
    id: 'account-1',
    address: '0xabc',
  })),
}));

jest.mock('../../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../../shared/lib/environment'),
  getIsAssetsUnifiedStateIncludedInBuild: jest.fn(() => true),
}));

describe('ensureMusdTokenImportedForChain', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockImportCustomAssetsBatch.mockImplementation(
      () => async () => Promise.resolve(),
    );
    mockDispatch.mockImplementation((action: unknown) => {
      if (typeof action === 'function') {
        return (
          action as (
            d: typeof mockDispatch,
            getState: () => unknown,
          ) => Promise<unknown>
        )(mockDispatch, () => ({}));
      }
      return undefined;
    });
  });

  it('does nothing when chain has no mUSD mapping', async () => {
    await ensureMusdTokenImportedForChain('0x9999' as Hex, mockDispatch);

    expect(mockImportCustomAssetsBatch).not.toHaveBeenCalled();
  });

  it('imports mUSD for a supported chain via AssetsController', async () => {
    const assetId = toAssetId(MUSD_TOKEN_ADDRESS, CHAIN_IDS.MAINNET);

    await ensureMusdTokenImportedForChain(CHAIN_IDS.MAINNET, mockDispatch);

    expect(mockImportCustomAssetsBatch).toHaveBeenCalledWith(
      'account-1',
      [{ assetId, isHidden: false }],
      {
        [assetId as string]: {
          address: MUSD_TOKEN_ADDRESS,
          symbol: 'MUSD',
          name: 'MUSD',
          decimals: 6,
          chainId: CHAIN_IDS.MAINNET,
        },
      },
    );
  });

  it('imports mUSD when chain id uses non-canonical hex casing', async () => {
    await ensureMusdTokenImportedForChain('0X1' as Hex, mockDispatch);

    expect(mockImportCustomAssetsBatch).toHaveBeenCalled();
  });

  it('logs and resolves when import fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation();
    mockImportCustomAssetsBatch.mockImplementation(() => {
      throw new Error('import failed');
    });

    await expect(
      ensureMusdTokenImportedForChain(CHAIN_IDS.MAINNET, mockDispatch),
    ).resolves.toBeUndefined();

    expect(console.warn).toHaveBeenCalled();
    (console.warn as jest.Mock).mockRestore();
  });
});
