import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CaipAssetType, Hex, createProjectLogger } from '@metamask/utils';

import { useAsyncResult } from '../../../../hooks/useAsync';
import {
  addToken,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { getAllTokens } from '../../../../selectors/selectors';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import { getAssetsPrice } from '../../../../selectors/assets';
import { getIsAssetsUnifyStateEnabled } from '../../../../selectors/assets-unify-state/feature-flags';
import {
  getNativeAssetId,
  toAssetId,
} from '../../../../../shared/lib/asset-utils';
import { useDispatch } from '../../../../store/hooks';

const log = createProjectLogger('add-token');

export function useAddToken({
  chainId,
  decimals,
  symbol,
  tokenAddress,
}: {
  chainId: Hex;
  decimals: number;
  symbol: string;
  tokenAddress: Hex;
}) {
  const dispatch = useDispatch();
  const allTokens = useSelector(getAllTokens);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const assetsPrice = useSelector(getAssetsPrice);
  const isAssetsUnifyStateEnabled = useSelector(getIsAssetsUnifyStateEnabled);

  const hasToken =
    allTokens?.[chainId]?.[selectedAccount?.address]?.some(
      (token: { address: string }) =>
        token.address.toLowerCase() === tokenAddress.toLowerCase(),
    ) ?? false;

  // Under unified assets state the token can stay in state without a usable
  // price, for example when the price request failed the first time it was
  // added. MetaMask Pay needs a fiat rate for both the token and the chain's
  // native asset, so treat a missing price as "not added yet" and add the token
  // again to refetch it. Otherwise the confirmation is stuck on its loading
  // skeleton for good.
  const hasPrice = useMemo(() => {
    if (!isAssetsUnifyStateEnabled) {
      return true;
    }

    const hasFungiblePrice = (assetId: CaipAssetType | undefined) => {
      const price = assetId ? assetsPrice[assetId] : undefined;
      return price?.assetPriceType === 'fungible' && price.price !== undefined;
    };

    return (
      hasFungiblePrice(toAssetId(tokenAddress, chainId)) &&
      hasFungiblePrice(getNativeAssetId(chainId))
    );
  }, [assetsPrice, chainId, isAssetsUnifyStateEnabled, tokenAddress]);

  const { error } = useAsyncResult(async () => {
    if (hasToken && hasPrice) {
      log('Token already exists', { tokenAddress, chainId });
      return;
    }

    const networkClientId = await findNetworkClientIdByChainId(chainId);

    await dispatch(
      addToken(
        {
          address: tokenAddress,
          symbol,
          decimals,
          networkClientId,
        },
        true,
      ),
    );

    log('Added token', { tokenAddress, chainId });
  }, [hasToken, hasPrice, chainId, tokenAddress, symbol, decimals, dispatch]);

  if (error) {
    log('Failed', { tokenAddress, chainId, error });
  }
}
