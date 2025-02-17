import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
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
  getMultichainShouldShowFiat,
  isChainIdMainnet,
} from '../../../../selectors/multichain';
import { formatWithThreshold } from '../util/formatWithThreshold';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { formatAmount } from '../../../../pages/confirmations/components/simulation-details/formatAmount';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';

type UseTokenDisplayInfoProps = {
  token: TokenWithFiatAmount;
};

export const useTokenDisplayInfo = ({
  token,
}: UseTokenDisplayInfoProps): TokenDisplayInfo => {
  const isEvm = useSelector(getMultichainIsEvm);
  const tokenList = useSelector(getTokenList);
  const erc20TokensByChain = useSelector(selectERC20TokensByChain);
  const currentCurrency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);
  const tokenChainImage = getImageForChainId(token.chainId);
  const selectedAccount = useSelector(getSelectedAccount);
  const showFiat = useMultichainSelector(
    getMultichainShouldShowFiat,
    selectedAccount,
  );

  const isTestnet = useSelector(getIsTestnet);

  const isMainnet = !isTestnet;
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);

  const shouldShowFiat =
    showFiat && (isMainnet || (isTestnet && showFiatInTestnets));

  const secondaryThreshold = 0.01;

  // Format for fiat balance with currency style
  const secondary =
    shouldShowFiat && token.tokenFiatAmount
      ? formatWithThreshold(
          Number(token.tokenFiatAmount),
          secondaryThreshold,
          locale,
          {
            style: 'currency',
            currency: currentCurrency.toUpperCase(),
          },
        )
      : undefined;

  const primary = formatAmount(
    locale,
    new BigNumber(Number(token.string) || '0', 10),
  );

  const isEvmMainnet =
    token.chainId && isEvm ? isChainIdMainnet(token.chainId) : false;

  const isStakeable = isEvmMainnet && isEvm && token.isNative;

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
      primary,
      secondary,
      isStakeable,
      tokenChainImage: tokenChainImage as string,
    };
  }
  // TODO non-evm assets. this is only the native token
  return {
    title: token.symbol,
    tokenImage: token.image,
    primary: '',
    secondary: token.secondary,
    isStakeable: false,
    tokenChainImage: token.image as string,
  };
};

export default useTokenDisplayInfo;
