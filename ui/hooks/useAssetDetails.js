import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCollectibles, getTokens } from '../ducks/metamask/metamask';
import { ERC1155, ERC721, ERC20 } from '../helpers/constants/common';
import {
  calcTokenAmount,
  getAssetDetails,
  getTokenAddressParam,
  getTokenValueParam,
} from '../helpers/utils/token-util';
import { parseTransactionData } from '../helpers/utils/transactions.util';
import { getTokenList } from '../selectors';
import { hideLoadingIndication, showLoadingIndication } from '../store/actions';
import { usePrevious } from './usePrevious';

export function useAssetDetails(tokenAddress, userAddress, transactionData) {
  const dispatch = useDispatch();
  const tokens = useSelector(getTokens);
  const collectibles = useSelector(getCollectibles);
  const tokenList = useSelector(getTokenList);
  const [currentAsset, setCurrentAsset] = useState(null);
  const prevTokenAddress = usePrevious(tokenAddress);
  const prevUserAddress = usePrevious(userAddress);
  const prevTransactionData = usePrevious(transactionData);
  useEffect(() => {
    async function getAndSetAssetDetails() {
      dispatch(showLoadingIndication());
      const assetDetails = await getAssetDetails(
        tokenAddress,
        userAddress,
        transactionData,
        collectibles,
        tokens,
        tokenList,
      );
      setCurrentAsset(assetDetails);
      dispatch(hideLoadingIndication());
    }
    if (
      tokenAddress !== prevTokenAddress ||
      userAddress !== prevUserAddress ||
      transactionData !== prevTransactionData
    ) {
      getAndSetAssetDetails();
    }
  }, [
    dispatch,
    prevTokenAddress,
    prevTransactionData,
    prevUserAddress,
    tokenAddress,
    userAddress,
    transactionData,
    collectibles,
    tokens,
    tokenList,
  ]);

  let assetStandard,
    assetName,
    assetAddress,
    tokenSymbol,
    decimals,
    tokenImage,
    userBalance,
    tokenValue,
    toAddress,
    tokenAmount,
    tokenId;

  if (currentAsset) {
    const tokenData = parseTransactionData(transactionData);
    assetStandard = currentAsset?.standard;
    assetAddress = tokenAddress;
    tokenSymbol = currentAsset?.symbol;
    tokenImage = currentAsset?.image;
    toAddress = getTokenAddressParam(tokenData);
    if (assetStandard === ERC721 || assetStandard === ERC1155) {
      assetName = currentAsset?.name;
      tokenId = getTokenValueParam(tokenData);
    }
    if (assetStandard === ERC20) {
      userBalance = currentAsset?.balance;
      decimals = Number(currentAsset?.decimals.toString(10));
      tokenAmount =
        tokenData &&
        calcTokenAmount(getTokenValueParam(tokenData), decimals).toString(10);
    }
  }
  return {
    assetStandard,
    assetName,
    assetAddress,
    userBalance,
    tokenSymbol,
    decimals,
    tokenImage,
    tokenValue,
    toAddress,
    tokenAmount,
    tokenId,
  };
}
