import { Nft } from '@metamask/assets-controllers';
import { CaipChainId, Hex } from '@metamask/utils';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
import NftDetails from '../../components/app/assets/nfts/nft-details/nft-details';
import { ScrollContainer } from '../../contexts/scroll-container';
import { getNFTsByChainId } from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { getFungibleAssetForRoute } from '../../selectors/assets';
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

  const content = (() => {
    if (nft) {
      return <NftDetails nft={nft} nftChainId={chainId} />;
    }

    if (isLoading) {
      return null;
    }

    const isInvalid = !token || !chainId || hasError;
    if (isInvalid) {
      return <Navigate to={DEFAULT_ROUTE} />;
    }

    const displayChainId = getRouteAssetChainId(token, chainId) as Hex;

    if (token.isNative) {
      return <NativeAsset chainId={displayChainId} token={token} />;
    }

    return <TokenAsset chainId={displayChainId} token={token} />;
  })();

  return (
    <ScrollContainer className="main-container asset__container">
      {content}
    </ScrollContainer>
  );
};

export default Asset;
