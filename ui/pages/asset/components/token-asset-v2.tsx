import React from 'react';
import 'chartjs-adapter-moment';
import { Token } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import { getTokenList } from '../../../selectors';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { AssetType } from '../../../../shared/constants/transaction';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import AssetV2 from './asset-v2';

const TokenAssetV2 = ({ token }: { token: Token }) => {
  const tokenList = useSelector(getTokenList);
  const tokenData = Object.values(tokenList).find(
    (listToken) =>
      listToken.symbol === token.symbol &&
      isEqualCaseInsensitive(listToken.address, token.address),
  );

  const { tokensWithBalances }: { tokensWithBalances: any[] } = useTokenTracker(
    { tokens: [token], address: undefined },
  );
  const fiatValue = useTokenFiatAmount(
    token.address,
    tokensWithBalances?.[0]?.string,
    token.symbol,
    {},
    false,
  );
  return (
    <AssetV2
      asset={{
        type: AssetType.token,
        address: token.address,
        symbol: token.symbol,
        name: tokenData?.name,
        decimals: token.decimals,
        image: tokenData?.iconUrl,
        balance: tokensWithBalances?.[0]?.string,
        fiatValue,
      }}
    />
  );
};

export default TokenAssetV2;
