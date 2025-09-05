import { useSelector } from 'react-redux';
import { isEqualCaseInsensitive } from '@metamask/controller-utils';
import {
  getIsTestnet,
  getSelectedAccount,
  getShowFiatInTestnets,
  getTokenList,
  selectERC20TokensByChain,
} from '../../../../selectors';
import { TokenDisplayInfo, TokenWithFiatAmount } from '../types';
import {
  getImageForChainId,
  getMultichainIsEvm,
  isChainIdMainnet,
  makeGetMultichainShouldShowFiatByChainId,
} from '../../../../selectors/multichain';
import { formatWithThreshold } from '../util/formatWithThreshold';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import { useFormatters } from '../../../../helpers/formatters';

type UseTokenDisplayInfoProps = {
  token: TokenWithFiatAmount;
  fixCurrencyToUSD?: boolean;
};

export const useTokenDisplayInfo = ({
  token,
  fixCurrencyToUSD,
}: UseTokenDisplayInfoProps): TokenDisplayInfo => {
  const isEvm = useSelector(getMultichainIsEvm);
  const tokenList = useSelector(getTokenList) || {};
  const erc20TokensByChain = useSelector(selectERC20TokensByChain);
  const currentCurrency = useSelector(getCurrentCurrency);
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const locale = useSelector(getIntlLocale);
  const tokenChainImage = getImageForChainId(token.chainId);
  const selectedAccount = useSelector(getSelectedAccount);
  const showFiat = useMultichainSelector(
    makeGetMultichainShouldShowFiatByChainId(token.chainId),
    selectedAccount,
  );

  const isTestnet = useSelector(getIsTestnet);

  const isMainnet = !isTestnet;
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);

  const shouldShowFiat =
    showFiat && (isMainnet || (isTestnet && showFiatInTestnets));

  // Format for fiat balance with currency style
  const secondary =
    shouldShowFiat &&
    token.tokenFiatAmount !== null &&
    token.tokenFiatAmount !== undefined
      ? formatCurrencyWithMinThreshold(
          token.tokenFiatAmount,
          fixCurrencyToUSD ? 'USD' : currentCurrency,
        )
      : undefined;

  const formattedPrimary = formatWithThreshold(
    Number(isEvm ? token.string : token.primary),
    0.00001,
    locale,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 5,
    },
  );

  const isEvmMainnet =
    token.chainId && isEvm ? isChainIdMainnet(token.chainId) : false;

  const isStakeable =
    token.isStakeable || (isEvmMainnet && isEvm && token.isNative);

  if (isEvm) {
    const tokenData = Object.values(tokenList).find(
      (tokenToFind) =>
        isEqualCaseInsensitive(tokenToFind.symbol, token.symbol) &&
        isEqualCaseInsensitive(tokenToFind.address, token.address),
    );

    const title =
      tokenData?.name ||
      (token.chainId === '0x1' && token.symbol === 'ETH'
        ? 'Ethereum'
        : token.chainId &&
          erc20TokensByChain?.[token.chainId]?.data?.[
            token.address.toLowerCase()
          ]?.name) ||
      token.symbol;

    const tokenImage =
      tokenData?.iconUrl ||
      (token.chainId &&
        erc20TokensByChain?.[token.chainId]?.data?.[token.address.toLowerCase()]
          ?.iconUrl) ||
      token.image;

    return {
      title,
      tokenImage,
      primary: formattedPrimary,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      secondary,
      isStakeable,
      tokenChainImage: tokenChainImage as string,
    };
  }
  // TODO non-evm assets. this is only the native token
  return {
    title: token.title,
    tokenImage: token.image,
    primary: formattedPrimary,
    secondary: showFiat ? token.secondary : null,
    isStakeable: false,
    tokenChainImage: token.image as string,
  };
};

export default useTokenDisplayInfo;
