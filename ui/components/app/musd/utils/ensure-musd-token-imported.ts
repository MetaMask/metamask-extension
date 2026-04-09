import type { Hex } from '@metamask/utils';
import { MUSD_TOKEN, MUSD_TOKEN_ADDRESS_BY_CHAIN } from '../constants';
import {
  addImportedTokens,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../../store/store';

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
  const musdAddress = MUSD_TOKEN_ADDRESS_BY_CHAIN[chainId];
  if (!musdAddress) {
    return;
  }

  try {
    const networkClientId = await findNetworkClientIdByChainId(chainId);
    await Promise.resolve(
      dispatch(
        addImportedTokens(
          [
            {
              address: musdAddress,
              symbol: MUSD_TOKEN.symbol,
              decimals: MUSD_TOKEN.decimals,
            },
          ],
          networkClientId,
        ),
      ),
    );
  } catch (err) {
    console.warn('[MUSD] Failed to add mUSD token to token list:', err);
  }
}
