import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import NftDetails from '../../components/app/nft-details/nft-details';
import {
  getNativeCurrency,
  getNfts,
  getTokens,
} from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

import NativeAssetV2 from './components/native-asset-v2';
import TokenAssetV2 from './components/token-asset-v2';

const Asset = () => {
  const nativeCurrency = useSelector(getNativeCurrency);
  const tokens = useSelector(getTokens);
  const nfts = useSelector(getNfts);
  const { asset, id } = useParams();

  const token = tokens.find(({ address }) =>
    isEqualCaseInsensitive(address, asset),
  );

  const nft = nfts.find(
    ({ address, tokenId }) =>
      isEqualCaseInsensitive(address, asset) && id === tokenId.toString(),
  );

  useEffect(() => {
    const el = document.querySelector('.app');
    el.scroll(0, 0);
  }, []);

  let content;
  if (nft) {
    content = <NftDetails nft={nft} />;
  } else if (token) {
    return <TokenAssetV2 token={token} />;
  } else if (asset === nativeCurrency) {
    return <NativeAssetV2 />;
  } else {
    content = <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  return <div className="main-container asset__container">{content}</div>;
};

export default Asset;
