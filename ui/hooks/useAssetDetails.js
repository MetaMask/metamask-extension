import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ERC1155, ERC20, ERC721 } from '../../shared/constants/transaction';
import { parseStandardTokenTransactionData } from '../../shared/modules/transaction.utils';
import { getCollectibles } from '../ducks/metamask/metamask';
import {
  calcTokenAmount,
  getAssetDetails,
  getTokenAddressParam,
  getTokenIdParam,
  getTokenValueParam,
} from '../helpers/utils/token-util';
import { hideLoadingIndication, showLoadingIndication } from '../store/actions';
import { usePrevious } from './usePrevious';

export function useAssetDetails(tokenAddress, userAddress, transactionData) {
  const dispatch = useDispatch();
  // state selectors
  const collectibles = useSelector(getCollectibles);

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
  ]);

  let assetStandard,
    assetName,
    assetAddress,
    tokenSymbol,
    decimals,
    tokenImage,
    userBalance,
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
      tokenId: _tokenId,
      toAddress: _toAddress,
      tokenAmount: _tokenAmount,
      decimals: _decimals,
    } = currentAsset;

    assetStandard = standard;
    assetAddress = tokenAddress;
    tokenSymbol = symbol ?? '';
    tokenImage = image;
    tokenId = _tokenId;
    toAddress = _toAddress;
    tokenAmount = _tokenAmount;
    decimals = _decimals;
    userBalance = balance;
    assetName = name;
  }

  return {
    toAddress,
    tokenId,
    decimals,
    tokenAmount,
    assetAddress,
    assetStandard,
    tokenSymbol,
    tokenImage,
    userBalance,
    assetName,
  };
}
