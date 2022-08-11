import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { isEqual, uniqBy } from 'lodash';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import {
  getTokenExchangeRates,
  getCurrentCurrency,
  getSwapsDefaultToken,
  getCurrentChainId,
  getUseTokenDetection,
} from '../selectors';
import { getConversionRate } from '../ducks/metamask/metamask';

import { getSwapsTokens } from '../ducks/swaps/swaps';
import { isSwapsDefaultTokenSymbol } from '../../shared/modules/swaps.utils';
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import { TOKEN_BUCKET_PRIORITY } from '../../shared/constants/swaps';
import { useEqualityCheck } from './useEqualityCheck';

export function getRenderableTokenData(
  token,
  contractExchangeRates,
  conversionRate,
  currentCurrency,
  chainId,
  shuffledTokenList,
  useTokenDetection,
) {
  const { symbol, name, address, iconUrl, string, balance, decimals } = token;
  let contractExchangeRate;
  if (isSwapsDefaultTokenSymbol(symbol, chainId)) {
    contractExchangeRate = 1;
  } else if (string && conversionRate > 0) {
    // This condition improves performance significantly.
    contractExchangeRate = contractExchangeRates[toChecksumHexAddress(address)];
  }
  const formattedFiat =
    getTokenFiatAmount(
      contractExchangeRate,
      conversionRate,
      currentCurrency,
      string,
      symbol,
      true,
    ) || '';
  const rawFiat = formattedFiat
    ? getTokenFiatAmount(
        contractExchangeRate,
        conversionRate,
        currentCurrency,
        string,
        symbol,
        false,
      )
    : '';

  const tokenMetadata = shuffledTokenList.find(
    (tokenData) => tokenData.address === address?.toLowerCase(),
  );

  const tokenIconUrl = useTokenDetection
    ? tokenMetadata?.iconUrl || iconUrl
    : iconUrl || tokenMetadata?.iconUrl;
  const usedIconUrl = tokenIconUrl || token?.image;
  return {
    ...token,
    primaryLabel: symbol,
    secondaryLabel: name || tokenMetadata?.name,
    rightPrimaryLabel:
      string && `${new BigNumber(string).round(6).toString()} ${symbol}`,
    rightSecondaryLabel: formattedFiat,
    iconUrl: usedIconUrl,
    identiconAddress: usedIconUrl ? null : address,
    balance,
    decimals,
    name: name || tokenMetadata?.name,
    rawFiat,
  };
}

export function useTokensToSearch({
  usersTokens = [],
  topTokens = {},
  shuffledTokensList,
  tokenBucketPriority = TOKEN_BUCKET_PRIORITY.OWNED,
}) {
  const chainId = useSelector(getCurrentChainId);
  const tokenConversionRates = useSelector(getTokenExchangeRates, isEqual);
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);
  const useTokenDetection = useSelector(getUseTokenDetection);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, shallowEqual);

  const memoizedTopTokens = useEqualityCheck(topTokens);
  const memoizedUsersToken = useEqualityCheck(usersTokens);

  const defaultToken = getRenderableTokenData(
    defaultSwapsToken,
    tokenConversionRates,
    conversionRate,
    currentCurrency,
    chainId,
    shuffledTokensList,
    useTokenDetection,
  );
  const memoizedDefaultToken = useEqualityCheck(defaultToken);

  const swapsTokens = useSelector(getSwapsTokens, isEqual) || [];

  const tokensToSearch = swapsTokens.length
    ? swapsTokens
    : [
        memoizedDefaultToken,
        ...shuffledTokensList.filter(
          (token) => token.symbol !== memoizedDefaultToken.symbol,
        ),
      ];

  const memoizedTokensToSearch = useEqualityCheck(tokensToSearch);
  return useMemo(() => {
    const usersTokensAddressMap = memoizedUsersToken.reduce(
      (acc, token) => ({ ...acc, [token.address.toLowerCase()]: token }),
      {},
    );

    const tokensToSearchBuckets = {
      owned: [],
      top: [],
      others: [],
    };

    const memoizedSwapsAndUserTokensWithoutDuplicities = uniqBy(
      [memoizedDefaultToken, ...memoizedTokensToSearch, ...memoizedUsersToken],
      (token) => token.address.toLowerCase(),
    );

    memoizedSwapsAndUserTokensWithoutDuplicities.forEach((token) => {
      const renderableDataToken = getRenderableTokenData(
        { ...usersTokensAddressMap[token.address.toLowerCase()], ...token },
        tokenConversionRates,
        conversionRate,
        currentCurrency,
        chainId,
        shuffledTokensList,
        useTokenDetection,
      );
      if (tokenBucketPriority === TOKEN_BUCKET_PRIORITY.OWNED) {
        if (
          isSwapsDefaultTokenSymbol(renderableDataToken.symbol, chainId) ||
          usersTokensAddressMap[token.address.toLowerCase()]
        ) {
          tokensToSearchBuckets.owned.push(renderableDataToken);
        } else if (memoizedTopTokens[token.address.toLowerCase()]) {
          tokensToSearchBuckets.top[
            memoizedTopTokens[token.address.toLowerCase()].index
          ] = renderableDataToken;
        } else {
          tokensToSearchBuckets.others.push(renderableDataToken);
        }
      } else if (memoizedTopTokens[token.address.toLowerCase()]) {
        tokensToSearchBuckets.top[
          memoizedTopTokens[token.address.toLowerCase()].index
        ] = renderableDataToken;
      } else if (
        isSwapsDefaultTokenSymbol(renderableDataToken.symbol, chainId) ||
        usersTokensAddressMap[token.address.toLowerCase()]
      ) {
        tokensToSearchBuckets.owned.push(renderableDataToken);
      } else {
        tokensToSearchBuckets.others.push(renderableDataToken);
      }
    });

    tokensToSearchBuckets.owned = tokensToSearchBuckets.owned.sort(
      ({ rawFiat }, { rawFiat: secondRawFiat }) => {
        return new BigNumber(rawFiat || 0).gt(secondRawFiat || 0) ? -1 : 1;
      },
    );
    tokensToSearchBuckets.top = tokensToSearchBuckets.top.filter(Boolean);
    if (tokenBucketPriority === TOKEN_BUCKET_PRIORITY.OWNED) {
      return [
        ...tokensToSearchBuckets.owned,
        ...tokensToSearchBuckets.top,
        ...tokensToSearchBuckets.others,
      ];
    }
    return [
      ...tokensToSearchBuckets.top,
      ...tokensToSearchBuckets.owned,
      ...tokensToSearchBuckets.others,
    ];
  }, [
    memoizedTokensToSearch,
    memoizedUsersToken,
    memoizedTopTokens,
    tokenConversionRates,
    conversionRate,
    currentCurrency,
    memoizedDefaultToken,
    chainId,
    shuffledTokensList,
    tokenBucketPriority,
  ]);
}
