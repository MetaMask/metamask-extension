import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import NftDetails from '../../components/app/assets/nfts/nft-details/nft-details';
import { getSelectedAccountTokensAcrossChains } from '../../selectors';
import { getNfts } from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

import TokenAsset from './components/token-asset';
import { findAssetByAddress } from './util';
import NativeAsset from './components/native-asset';

/** A page representing a native, token, or NFT asset */
const Asset = () => {
  const nfts = useSelector(getNfts);
  const selectedAccountTokensChains: Record<string, any> = useSelector(
    getSelectedAccountTokensAcrossChains,
  );
  const params = useParams<{
    chainId: string;
    asset: string;
    id: string;
  }>();

  const { chainId, asset, id } = params;

  const token = findAssetByAddress(selectedAccountTokensChains, asset, chainId);

  const nft = nfts.find(
    ({ address, tokenId }: { address: string; tokenId: string }) =>
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
    if (token?.address) {
      content = <TokenAsset chainId={chainId} token={token} />;
    } else {
      content = <NativeAsset chainId={chainId} token={token} />;
    }
  } else {
    content = <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  return <div className="main-container asset__container">{content}</div>;
};

export default Asset;
