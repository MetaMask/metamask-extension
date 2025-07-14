import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { toChecksumAddress } from 'ethereumjs-util';
import { type TokenListMap } from '@metamask/assets-controllers';
import {
  formatChainIdToCaip,
  isSolanaChainId,
} from '@metamask/bridge-controller';
import { fetchAssetMetadata, toAssetId } from '../../../shared/lib/asset-utils';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { setFromToken } from '../../ducks/bridge/actions';
import { getFromChain, getFromToken } from '../../ducks/bridge/selectors';
import { getTokenList } from '../../selectors';

export const useBridgeQueryParams = (isFromTokensLoading: boolean) => {
  const dispatch = useDispatch();
  const fromChain = useSelector(getFromChain);
  const fromToken = useSelector(getFromToken);
  const fromTokens = useSelector(getTokenList) as TokenListMap;

  const { search } = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (!fromChain?.chainId || isFromTokensLoading) {
      return;
    }

    const searchParams = new URLSearchParams(search);
    const tokenAddressFromUrl = searchParams.get(BridgeQueryParams.TOKEN);
    if (!tokenAddressFromUrl) {
      return;
    }

    const removeTokenFromUrl = () => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete(BridgeQueryParams.TOKEN);
      history.replace({
        search: newParams.toString(),
      });
    };

    const handleToken = async () => {
      if (isSolanaChainId(fromChain.chainId)) {
        const tokenAddress = tokenAddressFromUrl;
        const assetId = toAssetId(
          tokenAddress,
          formatChainIdToCaip(fromChain.chainId),
        );
        if (!assetId) {
          removeTokenFromUrl();
          return;
        }

        const tokenMetadata = await fetchAssetMetadata(
          tokenAddress,
          fromChain.chainId,
        );
        if (!tokenMetadata) {
          removeTokenFromUrl();
          return;
        }

        dispatch(
          setFromToken({
            ...tokenMetadata,
            chainId: fromChain.chainId,
          }),
        );
        removeTokenFromUrl();
        return;
      }

      const matchedToken = fromTokens[tokenAddressFromUrl.toLowerCase()];

      switch (tokenAddressFromUrl) {
        case fromToken?.address:
          // If the token is already set, remove the query param
          removeTokenFromUrl();
          break;
        case matchedToken?.address:
        case matchedToken?.address
          ? toChecksumAddress(matchedToken.address)
          : undefined: {
          // If there is a match, set it as the fromToken
          dispatch(
            setFromToken({
              ...matchedToken,
              chainId: fromChain.chainId,
            }),
          );
          removeTokenFromUrl();
          break;
        }
        default:
          // Otherwise remove query param
          removeTokenFromUrl();
          break;
      }
    };

    handleToken();
  }, [fromChain, fromToken, fromTokens, search, isFromTokensLoading]);
};
