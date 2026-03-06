import { Nft } from '@metamask/assets-controllers';
import { CaipChainId, Hex } from '@metamask/utils';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import NftDetails from '../../components/app/assets/nfts/nft-details/nft-details';
import { ScrollContainer } from '../../contexts/scroll-container';
import { getNFTsByChainId } from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { getTokenByAccountAndAddressAndChainId } from '../../selectors/assets';
import NativeAsset from './components/native-asset';
import TokenAsset from './components/token-asset';

type LocationState = {
  token?: {
    address: string;
    symbol: string;
    name: string;
    chainId: string;
    image?: string;
    isNative?: boolean;
    decimals?: number;
  };
};

const Asset = () => {
  const params = useParams<{
    chainId: Hex;
    asset: string;
    id: string;
  }>();
  const location = useLocation();
  const locationState = location.state as LocationState | undefined;

  const { chainId, asset, id } = params;
  const decodedAsset = asset ? decodeURIComponent(asset) : undefined;

  const nfts = useSelector((state) => getNFTsByChainId(state, chainId));

  const ownedToken = useSelector((state) =>
    getTokenByAccountAndAddressAndChainId(
      state,
      undefined, // Defaults to the selected account
      decodedAsset,
      chainId as Hex | CaipChainId,
    ),
  );

  // Use token from location state as fallback when user doesn't own the token
  const token =
    ownedToken ??
    (locationState?.token
      ? {
          address: locationState.token.address as Hex,
          symbol: locationState.token.symbol,
          decimals: locationState.token.decimals ?? 18,
          image: locationState.token.image,
          isNative: locationState.token.isNative ?? false,
          name: locationState.token.name,
        }
      : null);

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

    const isInvalid = !token || !chainId;
    if (isInvalid) {
      return <Navigate to={DEFAULT_ROUTE} />;
    }

    const shouldShowToken = !token.isNative && token.address;
    if (shouldShowToken) {
      return <TokenAsset chainId={chainId} token={token} />;
    }

    return <NativeAsset chainId={chainId} token={token} />;
  })();

  return (
    <ScrollContainer className="main-container asset__container">
      {content}
    </ScrollContainer>
  );
};

export default Asset;
