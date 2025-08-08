import { isEqual } from 'lodash';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getTokensByChainId } from '../../../ducks/metamask/metamask';
import { getAssetDetails } from '../../../helpers/utils/token-util';
import {
  hideLoadingIndication,
  showLoadingIndication,
} from '../../../store/actions';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { usePrevious } from '../../../hooks/usePrevious';
import { useTokenTracker } from '../../../hooks/useTokenBalances';
import { selectNftsByChainId } from '../../../selectors';

export function useAssetDetails(
  tokenAddress,
  userAddress,
  transactionData,
  chainId,
) {
  const dispatch = useDispatch();

  // state selectors
  const nfts = useSelector((state) => selectNftsByChainId(state, chainId));
  const tokens = useSelector(
    (state) => getTokensByChainId(state, chainId),
    isEqual,
  );
  const currentToken = tokens.find((token) =>
    isEqualCaseInsensitive(token.address, tokenAddress),
  );

  // in-hook state
  const [currentAsset, setCurrentAsset] = useState(null);
  const { tokensWithBalances } = useTokenTracker({
    tokens: currentToken ? [currentToken] : [],
  });

  // previous state checkers
  const prevTokenAddress = usePrevious(tokenAddress);
  const prevUserAddress = usePrevious(userAddress);
  const prevTransactionData = usePrevious(transactionData);
  const prevTokenBalance = usePrevious(tokensWithBalances);

  useEffect(() => {
    if (!tokenAddress && !userAddress && !transactionData) {
      return;
    }

    async function getAndSetAssetDetails() {
      dispatch(showLoadingIndication());
      const assetDetails = await getAssetDetails(
        tokenAddress,
        userAddress,
        transactionData,
        nfts,
        chainId,
      );
      setCurrentAsset(assetDetails);
      dispatch(hideLoadingIndication());
    }
    if (
      tokenAddress !== prevTokenAddress ||
      userAddress !== prevUserAddress ||
      transactionData !== prevTransactionData ||
      (prevTokenBalance && prevTokenBalance !== tokensWithBalances)
    ) {
      getAndSetAssetDetails();
    }
  }, [
    chainId,
    dispatch,
    prevTokenAddress,
    prevTransactionData,
    prevUserAddress,
    tokenAddress,
    userAddress,
    transactionData,
    nfts,
    tokensWithBalances,
    prevTokenBalance,
  ]);

  if (!tokenAddress && !userAddress && !transactionData) {
    return {};
  }

  if (currentAsset) {
    const {
      standard,
      symbol,
      image,
      name,
      balance,
      tokenId,
      toAddress,
      tokenAmount,
      decimals,
      tokenURI,
    } = currentAsset;

    return {
      toAddress,
      tokenId,
      decimals,
      tokenAmount,
      assetAddress: tokenAddress,
      assetStandard: standard,
      tokenSymbol: symbol ?? '',
      tokenImage: image,
      userBalance: balance,
      assetName: name,
      tokenURI,
    };
  }

  return {};
}
