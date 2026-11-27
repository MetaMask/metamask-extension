import type { Hex } from '@metamask/utils';
import { EthAccountType, SolAccountType } from '@metamask/keyring-api';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { toAssetId } from '../../../../../shared/lib/asset-utils';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../../shared/lib/environment';
import { getSelectedEvmInternalAccount } from '../../../../selectors';
import { MUSD_TOKEN, MUSD_TOKEN_ADDRESS } from '../constants';
import { ensureMusdTokenImportedForChain } from './ensure-musd-token-imported';

const mockImportCustomAssetsBatch = jest.fn();

jest.mock('../../../../store/actions', () => ({
  importCustomAssetsBatch: (...args: unknown[]) =>
    mockImportCustomAssetsBatch(...args),
}));

jest.mock('../../../../selectors', () => {
  const actual = jest.requireActual('../../../../selectors');
  return {
    ...actual,
    getSelectedEvmInternalAccount: jest.fn(
      actual.getSelectedEvmInternalAccount,
    ),
  };
});

jest.mock('../../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../../shared/lib/environment'),
  getIsAssetsUnifiedStateIncludedInBuild: jest.fn(() => true),
}));

jest.mock('../../../../../shared/lib/asset-utils', () => {
  const actual = jest.requireActual('../../../../../shared/lib/asset-utils');
  return {
    ...actual,
    toAssetId: jest.fn(actual.toAssetId),
  };
});

const EVM_ACCOUNT = {
  id: 'account-1',
  address: '0xabc',
  type: EthAccountType.Eoa,
  metadata: { lastSelected: 1 },
};

const SOLANA_ACCOUNT = {
  id: 'solana-account-1',
  address: 'So11111111111111111111111111111111111111112',
  type: SolAccountType.DataAccount,
  metadata: { lastSelected: 2 },
};

const buildState = (accounts: { id: string }[], selectedAccount: string) => ({
  metamask: {
    internalAccounts: {
      accounts: Object.fromEntries(
        accounts.map((account) => [account.id, account]),
      ),
      selectedAccount,
    },
  },
});

describe('ensureMusdTokenImportedForChain', () => {
  const mockDispatch = jest.fn();
  let mockState: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = buildState([EVM_ACCOUNT], EVM_ACCOUNT.id);
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
        )(mockDispatch, () => mockState);
      }
      return undefined;
    });
  });

  it('does nothing when chain has no mUSD mapping', async () => {
    await ensureMusdTokenImportedForChain('0x9999' as Hex, mockDispatch);

    expect(mockImportCustomAssetsBatch).not.toHaveBeenCalled();
  });

  it('does nothing when unified assets state is not included in the build', async () => {
    jest
      .mocked(getIsAssetsUnifiedStateIncludedInBuild)
      .mockReturnValueOnce(false);

    await ensureMusdTokenImportedForChain(CHAIN_IDS.MAINNET, mockDispatch);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockImportCustomAssetsBatch).not.toHaveBeenCalled();
  });

  it('does nothing when there is no selected account', async () => {
    mockState = buildState([], '');

    await ensureMusdTokenImportedForChain(CHAIN_IDS.MAINNET, mockDispatch);

    expect(mockImportCustomAssetsBatch).not.toHaveBeenCalled();
  });

  it('does nothing when an assetId cannot be built', async () => {
    jest.mocked(toAssetId).mockReturnValueOnce(undefined);

    await ensureMusdTokenImportedForChain(CHAIN_IDS.MAINNET, mockDispatch);

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
          symbol: MUSD_TOKEN.symbol,
          name: MUSD_TOKEN.symbol,
          decimals: 6,
          chainId: CHAIN_IDS.MAINNET,
        },
      },
    );
  });

  it('imports mUSD onto the EVM account when a non-EVM account is selected', async () => {
    mockState = buildState([EVM_ACCOUNT, SOLANA_ACCOUNT], SOLANA_ACCOUNT.id);

    await ensureMusdTokenImportedForChain(CHAIN_IDS.MAINNET, mockDispatch);

    expect(getSelectedEvmInternalAccount).toHaveBeenCalled();
    expect(mockImportCustomAssetsBatch).toHaveBeenCalledTimes(1);
    expect(mockImportCustomAssetsBatch.mock.calls[0][0]).toBe(EVM_ACCOUNT.id);
  });

  it('does nothing when only non-EVM accounts exist', async () => {
    mockState = buildState([SOLANA_ACCOUNT], SOLANA_ACCOUNT.id);

    await ensureMusdTokenImportedForChain(CHAIN_IDS.MAINNET, mockDispatch);

    expect(mockImportCustomAssetsBatch).not.toHaveBeenCalled();
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
