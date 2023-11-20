import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { isEqual, uniqBy } from 'lodash';
import { formatIconUrlWithProxy } from '@metamask/assets-controllers';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import {
  getTokenExchangeRates,
  getCurrentCurrency,
  getSwapsDefaultToken,
  getCurrentChainId,
  getTokenList,
} from '../selectors';
import { getConversionRate } from '../ducks/metamask/metamask';

import { getSwapsTokens } from '../ducks/swaps/swaps';
import { isSwapsDefaultTokenSymbol } from '../../shared/modules/swaps.utils';
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import { TokenBucketPriority } from '../../shared/constants/swaps';
import { CHAIN_IDS, CURRENCY_SYMBOLS } from '../../shared/constants/network';
import { useEqualityCheck } from './useEqualityCheck';

export function getRenderableTokenData(
  token,
  contractExchangeRates,
  conversionRate,
  currentCurrency,
  chainId,
  tokenList,
) {
  const { symbol, name, address, iconUrl, string, balance, decimals } = token;
  let contractExchangeRate;
  if (isSwapsDefaultTokenSymbol(symbol, chainId)) {
    contractExchangeRate = 1;
  } else if (string && conversionRate > 0) {
    // This condition improves performance significantly, because it only gets a contract exchange rate
    // if a token amount is truthy and conversion rate is higher than 0.
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

  const chainIdForTokenIcons =
    chainId === CHAIN_IDS.GOERLI ? CHAIN_IDS.MAINNET : chainId;

  const tokenIconUrl =
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.MAINNET) ||
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.GOERLI) ||
    (symbol === CURRENCY_SYMBOLS.BNB && chainId === CHAIN_IDS.BSC) ||
    (symbol === CURRENCY_SYMBOLS.MATIC && chainId === CHAIN_IDS.POLYGON) ||
    (symbol === CURRENCY_SYMBOLS.AVALANCHE &&
      chainId === CHAIN_IDS.AVALANCHE) ||
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.OPTIMISM) ||
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.AURORA) ||
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.ARBITRUM) ||
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.LINEA_MAINNET) ||
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.ZKSYNC_ERA)
      ? iconUrl
      : formatIconUrlWithProxy({
          chainId: chainIdForTokenIcons,
          tokenAddress: address || '',
        });
  const usedIconUrl = tokenIconUrl || token?.image;

  return {
    ...token,
    primaryLabel: symbol,
    secondaryLabel: name || tokenList[address?.toLowerCase()]?.name,
    rightPrimaryLabel:
      string && `${new BigNumber(string).round(6).toString()} ${symbol}`,
    rightSecondaryLabel: formattedFiat,
    iconUrl: usedIconUrl,
    identiconAddress: usedIconUrl ? null : address,
    balance,
    decimals,
    name: name || tokenList[address?.toLowerCase()]?.name,
    rawFiat,
  };
}

export function useTokensToSearch({
  usersTokens = [],
  topTokens = {},
  shuffledTokensList,
  tokenBucketPriority = TokenBucketPriority.owned,
}) {
  const chainId = useSelector(getCurrentChainId);
  const tokenConversionRates = useSelector(getTokenExchangeRates, isEqual);
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, shallowEqual);
  const tokenList = useSelector(getTokenList, isEqual);

  const memoizedTopTokens = useEqualityCheck(topTokens);
  const memoizedUsersToken = useEqualityCheck(usersTokens);

  const defaultToken = getRenderableTokenData(
    defaultSwapsToken,
    tokenConversionRates,
    conversionRate,
    currentCurrency,
    chainId,
    tokenList,
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
        tokenList,
      );
      if (tokenBucketPriority === TokenBucketPriority.owned) {
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
    if (tokenBucketPriority === TokenBucketPriority.owned) {
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
    tokenList,
    tokenBucketPriority,
  ]);
}
