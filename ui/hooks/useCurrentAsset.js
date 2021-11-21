import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';
import { getTokens } from '../ducks/metamask/metamask';
import { getCurrentChainId } from '../selectors';
import { ASSET_ROUTE } from '../helpers/constants/routes';
import { isEqualCaseInsensitive } from '../helpers/utils/util';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  ETH_SWAPS_TOKEN_OBJECT,
} from '../../shared/constants/swaps';

/**
 * Returns a token object for the asset that is currently being viewed.
 * Will return the default token object for the current chain when the
 * user is viewing either the primary, unfiltered, activity list or the
 * default token asset page.
 * @returns {import('./useTokenDisplayValue').Token}
 */
export function useCurrentAsset() {
  // To determine which primary currency to display for swaps transactions we need to be aware
  // of which asset, if any, we are viewing at present
  const match = useRouteMatch({
    path: `${ASSET_ROUTE}/:asset`,
    exact: true,
    strict: true,
  });
  const tokenAddress = match?.params?.asset;
  const knownTokens = useSelector(getTokens);
  const token =
    tokenAddress &&
    knownTokens.find(({ address }) =>
      isEqualCaseInsensitive(address, tokenAddress),
    );
  const chainId = useSelector(getCurrentChainId);

  return (
    token ??
    (SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId] || ETH_SWAPS_TOKEN_OBJECT)
  );
}
