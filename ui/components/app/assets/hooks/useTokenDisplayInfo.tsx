import { useSelector } from 'react-redux';
import { isEqualCaseInsensitive } from '@metamask/controller-utils';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { isCaipChainId } from '@metamask/utils';
import {
  getAllTokens,
  getEnabledNetworksByNamespace,
  getShowFiatInTestnets,
  getUseCurrencyRateCheck,
  selectERC20TokensByChain,
} from '../../../../selectors';
import { Token, TokenDisplayInfo, TokenWithFiatAmount } from '../types';
import {
  getImageForChainId,
  isChainIdMainnet,
  makeGetMultichainShouldShowFiatByChainId,
} from '../../../../selectors/multichain';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import { useFormatters } from '../../../../hooks/useFormatters';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../selectors/multichain-accounts/account-tree';
import { TEST_CHAINS } from '../../../../../shared/constants/network';

type UseTokenDisplayInfoProps = {
  token: TokenWithFiatAmount;
  fixCurrencyToUSD?: boolean;
};

export const useTokenDisplayInfo = ({
  token,
  fixCurrencyToUSD,
}: UseTokenDisplayInfoProps): TokenDisplayInfo => {
  const isEvm = isEvmChainId(token.chainId);
  const allTokens = useSelector(getAllTokens);
  const erc20TokensByChain = useSelector(selectERC20TokensByChain);
  const currentCurrency = useSelector(getCurrentCurrency);
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const tokenChainImage = getImageForChainId(token.chainId);
  const caipChainId = isCaipChainId(token.chainId)
    ? token.chainId
    : formatChainIdToCaip(token.chainId);
  const selectedAccount = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId),
  );

  const showFiat = useMultichainSelector(
    makeGetMultichainShouldShowFiatByChainId(token.chainId),
    selectedAccount,
  );

  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const isTestnetSelected = Boolean(
    Object.keys(enabledNetworksByNamespace).length === 1 &&
    TEST_CHAINS.includes(
      Object.keys(enabledNetworksByNamespace)[0] as `0x${string}`,
    ),
  );

  const isMainnet = !isTestnetSelected;
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  // isTestnet value is tied to the value of state.metamask.selectedNetworkClientId;
  // In some cases; the user has "all popular networks" selected or a specific popular network selected, while being on a dapp that is connected to a testnet,
  // In this case, isTestnet will be true and the secondary value displayed will be undefined.
  // I think this used to work before multichain was enabled when the tokens list depended only on a single selected network at a time
  // which used to match the value of state.metamask.selectedNetworkClientId
  // I think the tokenList page secondary values should only depend on whether the user has a popular network selected or a custom network or testnet

  const shouldShowFiat =
    showFiat && (isMainnet || (isTestnetSelected && showFiatInTestnets));
  const shouldAttemptFiat =
    useCurrencyRateCheck &&
    (isMainnet || (isTestnetSelected && showFiatInTestnets));
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
  const isFiatLoading =
    shouldAttemptFiat &&
    (token.tokenFiatAmount === null || token.tokenFiatAmount === undefined) &&
    token.balance !== undefined;

  const isEvmMainnet =
    token.chainId && isEvm ? isChainIdMainnet(token.chainId) : false;

  const isStakeable =
    token.isStakeable || (isEvmMainnet && isEvm && token.isNative);

  if (isEvm) {
    const tokenData = (
      Object.values(
        allTokens[token.chainId as `0x${string}`] ?? {},
      ).flat() as Token[]
    ).find((tokenToFind) =>
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
      tokenData?.image ||
      (token.chainId &&
        erc20TokensByChain?.[token.chainId]?.data?.[token.address.toLowerCase()]
          ?.iconUrl) ||
      token.image;

    return {
      title,
      tokenImage,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      secondary,
      isFiatLoading,
      isStakeable,
      tokenChainImage: tokenChainImage as string,
    };
  }

  // TODO BIP44 Refactor: type for secondary is wrongly set as number | null, when it is a string | null
  // Just changing it causes a number of errors all over the codebase
  // The BIP44 flag is enabled and stable, so this can be refactored to use the type from the new selector
  const nonEvmSecondary = secondary as unknown as number;

  // TODO non-evm assets. this is only the native token
  return {
    title: token.title,
    tokenImage: token.image,
    secondary: showFiat ? nonEvmSecondary : null,
    isFiatLoading,
    isStakeable: false,
    tokenChainImage: token.image as string,
  };
};

export default useTokenDisplayInfo;
