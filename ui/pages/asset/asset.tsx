import { Nft } from '@metamask/assets-controllers';
import { CaipChainId, Hex, isCaipChainId } from '@metamask/utils';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
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
    decimals: number;
  };
};

/**
 * Firefox and Chrome process the asset params differently due to how they handle decoding fragments.
 * E.g. With a route of `/asset/solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/solana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Ftoken%3AXXX`
 * (where the solana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Ftoken%3AXXX is an encoded version of the asset id)
 *
 * - Chrome will decode the above path as `{chainId}/{asset}`
 * - Chrome will decode the `asset` param as solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:XXX
 * - Chrome will therefore leave the `id` param as undefined.
 *
 * - Firefox will decode the above path as `{chainId}/{asset}/{id}`
 * - Firefox will decode the `asset` param as solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
 * - Firefox will therefore leave the `id` param as token:XXX
 *
 * @param params - route params
 * @param params.chainId
 * @param params.asset
 * @param params.id
 * @returns
 */
export const processAssetParams = (
  params: Partial<{ chainId: Hex | CaipChainId; asset: string; id: string }>,
) => {
  const { chainId, asset, id } = params;
  const isCaipChain = chainId ? isCaipChainId(chainId) : false;
  const rawAsset = isCaipChain && asset && id ? `${asset}/${id}` : asset;
  const decodedAsset = rawAsset ? decodeURIComponent(rawAsset) : undefined;
  return { chainId, asset, id, decodedAsset };
};

const Asset = () => {
  const params = useParams<{
    chainId: Hex | CaipChainId;
    asset: string;
    id: string;
  }>();
  const location = useLocation();
  const locationState = location.state as LocationState | undefined;

  const { chainId, id, decodedAsset } = processAssetParams(params);

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
  const token = ownedToken ?? locationState?.token;

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
      return <TokenAsset chainId={chainId as Hex} token={token} />;
    }

    return <NativeAsset chainId={chainId as Hex} token={token} />;
  })();

  return (
    <ScrollContainer className="main-container asset__container">
      {content}
    </ScrollContainer>
  );
};

export default Asset;
