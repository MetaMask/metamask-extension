import { useSelector } from 'react-redux';
import { isEqualCaseInsensitive } from '@metamask/controller-utils';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { isCaipChainId } from '@metamask/utils';
import {
  getIsMultichainAccountsState2Enabled,
  getIsTestnet,
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
import { useFormatters } from '../../../../hooks/formatters';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../selectors/multichain-accounts/account-tree';

type UseTokenDisplayInfoProps = {
  token: TokenWithFiatAmount;
  fixCurrencyToUSD?: boolean;
};

export const useTokenDisplayInfo = ({
  token,
  fixCurrencyToUSD,
}: UseTokenDisplayInfoProps): TokenDisplayInfo => {
  const isEvm = isEvmChainId(token.chainId);
  const tokenList = useSelector(getTokenList) || {};
  const erc20TokensByChain = useSelector(selectERC20TokensByChain);
  const currentCurrency = useSelector(getCurrentCurrency);
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const locale = useSelector(getIntlLocale);
  const tokenChainImage = getImageForChainId(token.chainId);
  const caipChainId = isCaipChainId(token.chainId)
    ? token.chainId
    : formatChainIdToCaip(token.chainId);
  const selectedAccount = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId),
  );

  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
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
    Number((isEvm ? token.string : token.primary) || token.balance),
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

  // TODO BIP44 Refactor: type for secondary is wrongly set as number | null, when it is a string | null
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
