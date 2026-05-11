import { useSelector } from 'react-redux';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { Hex, isCaipChainId } from '@metamask/utils';
import {
  getEnabledNetworksByNamespace,
  getShowFiatInTestnets,
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
import { useTokensData } from '../../../../hooks/useTokensData';
import { buildEvmCaip19AssetId } from '../../../../../shared/lib/multichain/buildEvmCaip19AssetId';

type UseTokenDisplayInfoProps = {
  token: TokenWithFiatAmount;
  fixCurrencyToUSD?: boolean;
};

export const useTokenDisplayInfo = ({
  token,
  fixCurrencyToUSD,
}: UseTokenDisplayInfoProps): TokenDisplayInfo => {
  const isEvm = isEvmChainId(token.chainId);

  // Fetch from the tokens API when name or image is missing (e.g. tokens added
  // via swaps that bypass the name-aware import path). Both fields are checked
  // independently because a token can have a name but no image, or an image but
  // no name. The module-level cache in useTokensData ensures at most one HTTP
  // request per unique asset ID across all token rows, and the empty-array
  // fast-path skips the effect entirely when both fields are already present.
  // token.chainId is a hex chain ID when isEvm is true.
  const evmChainId = token.chainId as Hex;
  const fallbackAssetId =
    isEvm &&
    !token.isNative &&
    (!token.name || !token.image) &&
    token.address &&
    token.chainId
      ? buildEvmCaip19AssetId(token.address, evmChainId)
      : undefined;
  const fallbackTokensByAssetId = useTokensData(
    fallbackAssetId ? [fallbackAssetId] : [],
  );
  const fallbackEntry = fallbackAssetId
    ? fallbackTokensByAssetId[fallbackAssetId]
    : undefined;

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
    // For native tokens, token.name is not populated — the upstream selector
    // sets token.title to 'Ethereum' (for ETH on mainnet) or the network name.
    // For ERC-20 tokens, prefer token.name, then the API fallback, then symbol.
    const title = token.isNative
      ? token.title || token.symbol
      : token.name || fallbackEntry?.name || token.symbol;
    const tokenImage = (token.image || fallbackEntry?.iconUrl) ?? '';

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
  // The BIP44 flag is enabled and stable, so this can be refactored to use the type from the new selector
  const nonEvmSecondary = secondary as unknown as number;

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
