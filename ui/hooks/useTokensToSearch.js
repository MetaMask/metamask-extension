import BigNumber from 'bignumber.js';
import { formatIconUrlWithProxy } from '@metamask/assets-controllers';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { isSwapsDefaultTokenSymbol } from '../../shared/modules/swaps.utils';
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import { CHAIN_IDS, CURRENCY_SYMBOLS } from '../../shared/constants/network';

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
    chainId === CHAIN_IDS.SEPOLIA ? CHAIN_IDS.MAINNET : chainId;

  const tokenIconUrl =
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.MAINNET) ||
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.SEPOLIA) ||
    (symbol === CURRENCY_SYMBOLS.BNB && chainId === CHAIN_IDS.BSC) ||
    (symbol === CURRENCY_SYMBOLS.MATIC && chainId === CHAIN_IDS.POLYGON) ||
    (symbol === CURRENCY_SYMBOLS.AVALANCHE &&
      chainId === CHAIN_IDS.AVALANCHE) ||
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.OPTIMISM) ||
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.ARBITRUM) ||
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.LINEA_MAINNET) ||
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.ZKSYNC_ERA) ||
    (symbol === CURRENCY_SYMBOLS.ETH && chainId === CHAIN_IDS.BASE)
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
    image: token.image || token.iconUrl,
  };
}
