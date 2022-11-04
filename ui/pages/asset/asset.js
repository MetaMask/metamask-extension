import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import CollectibleDetails from '../../components/app/collectible-details/collectible-details';
import { getCollectibles, getTokens } from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

import NativeAsset from './components/native-asset';
import TokenAsset from './components/token-asset';

const Asset = () => {
  const nativeCurrency = useSelector((state) => state.metamask.nativeCurrency);
  const tokens = useSelector(getTokens);
  const collectibles = useSelector(getCollectibles);
  const { asset, id } = useParams();

  const token = tokens.find(({ address }) =>
    isEqualCaseInsensitive(address, asset),
  );

  const collectible = collectibles.find(
    ({ address, tokenId }) =>
      isEqualCaseInsensitive(address, asset) && id === tokenId.toString(),
  );

  useEffect(() => {
    const el = document.querySelector('.app');
    el.scroll(0, 0);
  }, []);

  let content;
  if (collectible) {
    content = <CollectibleDetails collectible={collectible} />;
  } else if (token) {
    content = <TokenAsset token={token} />;
  } else if (asset === nativeCurrency) {
    content = <NativeAsset nativeCurrency={nativeCurrency} />;
  } else {
    content = <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  return <div className="main-container asset__container">{content}</div>;
};

export default Asset;
