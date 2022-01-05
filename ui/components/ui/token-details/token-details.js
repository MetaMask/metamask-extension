import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { getTokens } from '../../../ducks/metamask/metamask';
import { getSendAssetAddress } from '../../../ducks/send';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { isEqualCaseInsensitive } from '../../../helpers/utils/util';
import TokenDetailsScreen from './token-details.container';

const TokenDetails = () => {
  const tokens = useSelector(getTokens);

  const assetAddress = useSelector((state) => ({
    asset: getSendAssetAddress(state),
  }));

  const { asset: tokenAddress } = assetAddress;

  const token = tokens.find(({ address }) =>
    isEqualCaseInsensitive(address, tokenAddress),
  );

  useEffect(() => {
    const el = document.querySelector('.app');
    el.scroll(0, 0);
  }, []);

  let content;
  if (token) {
    content = <TokenDetailsScreen token={token} />;
  } else {
    content = <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  return content;
};

export default TokenDetails;
