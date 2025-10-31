import { Nft } from '@metamask/assets-controllers';
import { CaipChainId, Hex } from '@metamask/utils';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom-v5-compat';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import NftDetails from '../../components/app/assets/nfts/nft-details/nft-details';
import { getNFTsByChainId } from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { getTokenByAccountAndAddressAndChainId } from '../../selectors/assets';
import NativeAsset from './components/native-asset';
import TokenAsset from './components/token-asset';

type AssetProps = {
  params: {
    chainId?: Hex;
    asset?: string;
    id?: string;
  };
};

/**
 * A page representing a native, token, or NFT asset
 *
 * @param options0 - Component props
 * @param options0.params - Route parameters including chainId, asset, and id
 */
const Asset = ({ params }: AssetProps) => {
  const { chainId, asset, id } = params;
  const decodedAsset = asset ? decodeURIComponent(asset) : undefined;

  const nfts = useSelector((state) => getNFTsByChainId(state, chainId));

  const token = useSelector((state) =>
    getTokenByAccountAndAddressAndChainId(
      state,
      undefined, // Defaults to the selected account
      decodedAsset,
      chainId as Hex | CaipChainId,
    ),
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

  return <div className="main-container asset__container">{content}</div>;
};

export default Asset;
