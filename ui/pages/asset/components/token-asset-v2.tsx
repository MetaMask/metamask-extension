import React from 'react';
import { Token } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import { getTokenList } from '../../../selectors';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { AssetType } from '../../../../shared/constants/transaction';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import AssetV2 from './asset-v2';

const TokenAssetV2 = ({ token }: { token: Token }) => {
  const { address, symbol } = token;
  const tokenList = useSelector(getTokenList);
  const { name, iconUrl, aggregators } =
    Object.values(tokenList).find(
      (t) => t.symbol === symbol && isEqualCaseInsensitive(t.address, address),
    ) ?? {};

  const { tokensWithBalances }: { tokensWithBalances: { string: string }[] } =
    useTokenTracker({ tokens: [token], address: undefined });

  const balance = tokensWithBalances?.[0]?.string;
  const fiatDisplay = useTokenFiatAmount(address, balance, symbol, {}, false);

  return (
    <AssetV2
      asset={{
        type: AssetType.token,
        address,
        symbol,
        name,
        decimals: token.decimals,
        image: iconUrl,
        balanceDisplay:
          balance === undefined ? undefined : `${balance} ${symbol ?? ''}`,
        fiatDisplay,
        aggregators,
      }}
    />
  );
};

export default TokenAssetV2;
