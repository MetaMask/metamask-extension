import type { Hex } from '@metamask/utils';
import { MUSD_TOKEN, getMusdTokenAddressForChain } from '../constants';
import { importCustomAssetsBatch } from '../../../../store/actions';
import { toAssetId } from '../../../../../shared/lib/asset-utils';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import type { MetaMaskReduxDispatch } from '../../../../store/store';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../../shared/lib/environment';

/**
 * Ensures mUSD is present in the user's imported token list for `chainId` so
 * account-group asset selectors include it before the conversion confirm screen.
 *
 * Errors are logged and swallowed so the conversion flow can continue if import fails.
 *
 * @param chainId - EVM chain for the conversion (must be a supported mUSD chain).
 * @param dispatch - Redux dispatch (thunk-capable).
 */
export async function ensureMusdTokenImportedForChain(
  chainId: Hex,
  dispatch: MetaMaskReduxDispatch,
): Promise<void> {
  const musdAddress = getMusdTokenAddressForChain(chainId);
  if (!musdAddress) {
    return;
  }

  if (!getIsAssetsUnifiedStateIncludedInBuild()) {
    return;
  }

  try {
    await Promise.resolve(
      dispatch((innerDispatch, getState) => {
        const selected = getSelectedInternalAccount(getState());
        if (!selected?.id) {
          return Promise.resolve();
        }

        const assetId = toAssetId(musdAddress, chainId);
        if (!assetId) {
          return Promise.resolve();
        }

        return Promise.resolve(
          innerDispatch(
            importCustomAssetsBatch(
              selected.id,
              [{ assetId, isHidden: false }],
              {
                [assetId]: {
                  address: musdAddress,
                  symbol: MUSD_TOKEN.symbol,
                  name: MUSD_TOKEN.symbol,
                  decimals: MUSD_TOKEN.decimals,
                  chainId,
                },
              },
            ),
          ),
        );
      }),
    );
  } catch (err) {
    console.warn('[MUSD] Failed to add mUSD token to token list:', err);
  }
}
