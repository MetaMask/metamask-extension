import { useSelector } from 'react-redux';
import { isEqualCaseInsensitive } from '@metamask/controller-utils';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { isCaipChainId } from '@metamask/utils';
import {
  getEnabledNetworksByNamespace,
  getIsMultichainAccountsState2Enabled,
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
  const tokenList = useSelector(getTokenList) || {};
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

  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
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

  // isTestnet value is tied to the value of state.metamask.selectedNetworkClientId;
  // In some cases; the user has "all popular networks" selected or a specific popular network selected, while being on a dapp that is connected to a testnet,
  // In this case, isTestnet will be true and the secondary value displayed will be undefined.
  // I think this used to work before multichain was enabled when the tokens list depended only on a single selected network at a time
  // which used to match the value of state.metamask.selectedNetworkClientId
  // I think the tokenList page secondary values should only depend on whether the user has a popular network selected or a custom network or testnet

  const shouldShowFiat =
    showFiat && (isMainnet || (isTestnetSelected && showFiatInTestnets));
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
    secondary: showFiat ? nonEvmSecondary : null,
    isStakeable: false,
    tokenChainImage: token.image as string,
  };
};

export default useTokenDisplayInfo;
