import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import NftDetails from '../../components/app/assets/nfts/nft-details/nft-details';
import { getSelectedAccountTokensAcrossChains } from '../../selectors';
import { getNativeCurrency, getNfts } from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

import NativeAsset from './components/native-asset';
import TokenAsset from './components/token-asset';

function findAssetByAddress(data: any, address?: string) {
  if (!address) {
    return null;
  }

  for (const chainId in data) {
    if (chainId in data) {
      const chainIdTokens = data[chainId];
      for (const token of chainIdTokens) {
        if (token.address === address) {
          return { chainId, ...token };
        }
      }
    }
  }
  return null;
}

/** A page representing a native, token, or NFT asset */
const Asset = () => {
  const nativeCurrency = useSelector(getNativeCurrency);
  const nfts = useSelector(getNfts);
  const selectedAccountTokensChains: Record<string, any> = useSelector(
    getSelectedAccountTokensAcrossChains,
  );
  const { asset, id } = useParams<{ asset: string; id: string }>();

  const multichainToken = findAssetByAddress(
    selectedAccountTokensChains,
    asset,
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
  } else if (multichainToken) {
    content = <TokenAsset token={multichainToken} />;
  } else if (asset === nativeCurrency) {
    content = <NativeAsset />;
  } else {
    content = <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  return <div className="main-container asset__container">{content}</div>;
};

export default Asset;
