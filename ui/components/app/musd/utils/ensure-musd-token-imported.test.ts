import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { MUSD_TOKEN_ADDRESS } from '../constants';
import { ensureMusdTokenImportedForChain } from './ensure-musd-token-imported';

const mockFindNetworkClientIdByChainId = jest.fn();
const mockAddImportedTokens = jest.fn();

jest.mock('../../../../store/actions', () => ({
  addImportedTokens: (...args: unknown[]) => mockAddImportedTokens(...args),
  findNetworkClientIdByChainId: (...args: unknown[]) =>
    mockFindNetworkClientIdByChainId(...args),
}));

describe('ensureMusdTokenImportedForChain', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindNetworkClientIdByChainId.mockResolvedValue('mainnet');
    mockAddImportedTokens.mockImplementation(
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

    expect(mockFindNetworkClientIdByChainId).not.toHaveBeenCalled();
    expect(mockAddImportedTokens).not.toHaveBeenCalled();
  });

  it('imports mUSD for a supported chain', async () => {
    await ensureMusdTokenImportedForChain(CHAIN_IDS.MAINNET, mockDispatch);

    expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith(
      CHAIN_IDS.MAINNET,
    );
    expect(mockAddImportedTokens).toHaveBeenCalledWith(
      [
        {
          address: MUSD_TOKEN_ADDRESS,
          symbol: 'MUSD',
          decimals: 6,
        },
      ],
      'mainnet',
    );
  });

  it('imports mUSD when chain id uses non-canonical hex casing', async () => {
    await ensureMusdTokenImportedForChain('0X1' as Hex, mockDispatch);

    expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith('0x1');
    expect(mockAddImportedTokens).toHaveBeenCalledWith(
      [
        {
          address: MUSD_TOKEN_ADDRESS,
          symbol: 'MUSD',
          decimals: 6,
        },
      ],
      'mainnet',
    );
  });

  it('logs and resolves when import fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation();
    mockFindNetworkClientIdByChainId.mockRejectedValue(new Error('network'));

    await expect(
      ensureMusdTokenImportedForChain(CHAIN_IDS.MAINNET, mockDispatch),
    ).resolves.toBeUndefined();

    expect(console.warn).toHaveBeenCalled();
    (console.warn as jest.Mock).mockRestore();
  });
});
