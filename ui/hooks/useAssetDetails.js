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
import { getTransactionData } from '../helpers/utils/transactions.util';
import { getTokenList } from '../selectors';
import { hideLoadingIndication, showLoadingIndication } from '../store/actions';
import { usePrevious } from './usePrevious';

export function useAssetDetails(tokenAddress, userAddress, transactionData) {
  const dispatch = useDispatch();

  // state selectors
  const tokens = useSelector(getTokens);
  const collectibles = useSelector(getCollectibles);
  const tokenList = useSelector(getTokenList);

  // in-hook state
  const [currentAsset, setCurrentAsset] = useState(null);

  // previous state checkers
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
    const {
      standard,
      symbol,
      image,
      name,
      balance,
      decimals: currentAssetDecimals,
    } = currentAsset;
    const tokenData = getTransactionData(transactionData);
    assetStandard = standard;
    assetAddress = tokenAddress;
    tokenSymbol = symbol;
    tokenImage = image;
    toAddress = getTokenAddressParam(tokenData);
    if (assetStandard === ERC721 || assetStandard === ERC1155) {
      assetName = name;
      tokenId = getTokenValueParam(tokenData);
    }
    if (assetStandard === ERC20) {
      userBalance = balance;
      decimals = Number(currentAssetDecimals?.toString(10));
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
