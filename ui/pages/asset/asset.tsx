import { Nft } from '@metamask/assets-controllers';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { CaipChainId, Hex, isCaipChainId } from '@metamask/utils';
import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
import NftDetails from '../../components/app/assets/nfts/nft-details/nft-details';
import { ScrollContainer } from '../../contexts/scroll-container';
import { getNFTsByChainId } from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { getFungibleAssetForRoute } from '../../selectors/assets';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import NativeAsset from './components/native-asset';
import TokenAsset from './components/token-asset';
import {
  getRouteAssetChainId,
  LocationStateToken,
  useRouteAssetToken,
} from './hooks/useRouteAssetToken';
import { resolveAssetRouteLookup } from './util';

type LocationState = {
  token?: LocationStateToken;
};

const Asset = () => {
  const params = useParams<{
    chainId: Hex | CaipChainId;
    asset: string;
    id: string;
  }>();
  const location = useLocation();
  const locationState = location.state as LocationState | undefined;

  const { chainId, id, decodedAsset, assetId } =
    resolveAssetRouteLookup(params);

  const nfts = useSelector((state) => getNFTsByChainId(state, chainId));

  const ownedToken = useSelector((state) =>
    getFungibleAssetForRoute(state, { assetId, chainId, decodedAsset }),
  );

  const { token, isLoading, hasError } = useRouteAssetToken({
    ownedToken,
    locationStateToken: locationState?.token,
    assetId,
  });

  const displayChainId = getRouteAssetChainId(token, chainId);

  let caipChainId: CaipChainId | undefined;
  if (displayChainId) {
    caipChainId = isCaipChainId(displayChainId)
      ? displayChainId
      : formatChainIdToCaip(displayChainId);
  }

  // Null when the selected account group has no account for this chain
  // (e.g. Solana asset deeplink while an EVM-only account is selected).
  const selectedAccountForAsset = useSelector((state) =>
    caipChainId
      ? getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId)
      : null,
  );

  const nft: Nft = nfts.find(
    ({ address, tokenId }: { address: Hex; tokenId: string }) =>
      // @ts-expect-error TODO: Fix this type error by handling undefined parameters
      isEqualCaseInsensitive(address, decodedAsset) &&
      id === tokenId.toString(),
  );

  useEffect(() => {
    const el = document.querySelector('.app');
    el?.scroll(0, 0);
  }, []);

  const renderContent = useCallback(() => {
    if (nft) {
      return <NftDetails nft={nft} nftChainId={chainId} />;
    }

    if (isLoading) {
      return null;
    }

    const isInvalid = !token || !chainId || hasError;
    if (isInvalid || !selectedAccountForAsset) {
      return <Navigate to={DEFAULT_ROUTE} />;
    }

    if (token.isNative) {
      return <NativeAsset chainId={displayChainId as Hex} token={token} />;
    }

    return <TokenAsset chainId={displayChainId as Hex} token={token} />;
  }, [
    chainId,
    displayChainId,
    hasError,
    isLoading,
    nft,
    selectedAccountForAsset,
    token,
  ]);

  return (
    <ScrollContainer
      className="main-container asset__container"
      data-testid="asset-page-scroll-container"
    >
      {renderContent()}
    </ScrollContainer>
  );
};

export default Asset;
