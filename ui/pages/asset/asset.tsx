import { Nft } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import NftDetails from '../../components/app/assets/nfts/nft-details/nft-details';
import { getNFTsByChainId } from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { getTokenByAccountAndAddressAndChainId } from '../../selectors/assets';
import NativeAsset from './components/native-asset';
import TokenAsset from './components/token-asset';

/** A page representing a native, token, or NFT asset */
const Asset = () => {
  const params = useParams<{
    chainId: Hex;
    asset: string;
    id: string;
  }>();

  const { chainId, asset, id } = params;
  const decodedAsset = asset ? decodeURIComponent(asset) : undefined;

  const nfts = useSelector((state) => getNFTsByChainId(state, chainId));

  const token = useSelector((state) =>
    getTokenByAccountAndAddressAndChainId(
      state,
      undefined, // Defaults to the selected account
      decodedAsset,
      chainId,
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
      return <NftDetails nft={nft} />;
    }

    const isInvalid = !token || !chainId;
    if (isInvalid) {
      return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
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
