import { useSelector } from 'react-redux';
import { isEqualCaseInsensitive } from '@metamask/controller-utils';
import { isCaipChainId } from '@metamask/utils';
import {
  getIsMultichainAccountsState2Enabled,
  getIsTestnet,
  getSelectedAccount,
  getShowFiatInTestnets,
  getTokenList,
  selectERC20TokensByChain,
} from '../../../../selectors';
import { TokenDisplayInfo, TokenWithFiatAmount } from '../types';
import {
  getImageForChainId,
  isChainIdMainnet,
  makeGetMultichainShouldShowFiatByChainId,
} from '../../../../selectors/multichain';
import { formatWithThreshold } from '../util/formatWithThreshold';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';

type UseTokenDisplayInfoProps = {
  token: TokenWithFiatAmount;
  fixCurrencyToUSD?: boolean;
};

export const useTokenDisplayInfo = ({
  token,
  fixCurrencyToUSD,
}: UseTokenDisplayInfoProps): TokenDisplayInfo => {
  const isEvm = !isCaipChainId(token.chainId);
  const tokenList = useSelector(getTokenList) || {};
  const erc20TokensByChain = useSelector(selectERC20TokensByChain);
  const currentCurrency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);
  const tokenChainImage = getImageForChainId(token.chainId);
  const selectedAccount = useSelector(getSelectedAccount);
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const showFiat =
    useMultichainSelector(
      makeGetMultichainShouldShowFiatByChainId(token.chainId),
      selectedAccount,
    ) || isMultichainAccountsState2Enabled;

  const isTestnet = useSelector(getIsTestnet);

  const isMainnet = !isTestnet;
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);

  const shouldShowFiat =
    showFiat && (isMainnet || (isTestnet && showFiatInTestnets));

  const secondaryThreshold = 0.01;

  // Format for fiat balance with currency style
  const secondary =
    shouldShowFiat &&
    token.tokenFiatAmount !== null &&
    token.tokenFiatAmount !== undefined
      ? formatWithThreshold(
          Number(token.tokenFiatAmount),
          secondaryThreshold,
          locale,
          {
            style: 'currency',
            currency: fixCurrencyToUSD ? 'USD' : currentCurrency.toUpperCase(),
          },
        )
      : null;

  const formattedPrimary = formatWithThreshold(
    Number((isEvm ? token.string : token.primary) ?? token.balance),
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
    token.isStakeable ||
    (isEvmMainnet &&
      isEvm &&
      (!token.type || token.type.startsWith('eip155')) &&
      token.isNative);

  if (isEvm && (!token.type || token.type.startsWith('eip155'))) {
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

  // TODO: type for secondary is wrongly set as number | null, when it is a string | null
  // Just changing it causes a number of errors all over the codebase
  // When BIP44 flag is enabled and stable, this can be refactored to use the type from the new selector
  const nonEvmSecondary = isMultichainAccountsState2Enabled
    ? (secondary as unknown as number)
    : token.secondary;

  // TODO non-evm assets. this is only the native token
  return {
    title: token.title,
    tokenImage: token.image,
    primary: formattedPrimary,
    secondary: showFiat ? nonEvmSecondary : null,
    isStakeable: false,
    tokenChainImage: token.image as string,
  };
};

export default useTokenDisplayInfo;
