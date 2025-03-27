import { Nft } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import NftDetails from '../../components/app/assets/nfts/nft-details/nft-details';
import { getNFTsByChainId } from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { getSelectedAccountTokenByAddressAndChainId } from '../../selectors/assets';
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

  const nfts = useSelector((state) => getNFTsByChainId(state, chainId));

  const token = useSelector((state) =>
    getSelectedAccountTokenByAddressAndChainId(state, asset, chainId),
  );

  const nft: Nft = nfts.find(
    ({ address, tokenId }: { address: Hex; tokenId: string }) =>
      // @ts-expect-error TODO: Fix this type error by handling undefined parameters
      isEqualCaseInsensitive(address, asset) && id === tokenId.toString(),
  );

  useEffect(() => {
    const el = document.querySelector('.app');
    el?.scroll(0, 0);
  }, []);

  let content;
  if (nft) {
    content = <NftDetails nft={nft} />;
  } else if (token && chainId) {
    if (token.isNative || !token.address) {
      content = <NativeAsset chainId={chainId} token={token} />;
    } else {
      content = <TokenAsset chainId={chainId} token={token} />;
    }
  } else {
    content = <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  return <div className="main-container asset__container">{content}</div>;
};

export default Asset;
