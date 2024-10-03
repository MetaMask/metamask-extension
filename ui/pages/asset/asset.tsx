import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import NftDetails from '../../components/app/assets/nfts/nft-details/nft-details';
import {
  getNativeCurrency,
  getNfts,
  getTokens,
} from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

import NativeAsset from './components/native-asset';
import TokenAsset from './components/token-asset';

/** A page representing a native, token, or NFT asset */
const Asset = () => {
  const nativeCurrency = useSelector(getNativeCurrency);
  const tokens = useSelector(getTokens);
  const nfts = useSelector(getNfts);
  const { asset, id } = useParams<{ asset: string; id: string }>();

  const token = tokens.find(({ address }: { address: string }) =>
    // @ts-expect-error TODO: Fix this type error by handling undefined parameters
    isEqualCaseInsensitive(address, asset),
  );

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
  } else if (token) {
    content = <TokenAsset token={token} />;
  } else if (asset === nativeCurrency) {
    content = <NativeAsset />;
  } else {
    content = <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  return <div className="main-container asset__container">{content}</div>;
};

export default Asset;
