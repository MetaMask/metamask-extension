import type {
  Token,
  TokenListMap,
  TokenListToken,
} from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';
import { Numeric } from '../../../../../shared/modules/Numeric';
import { AssetType } from '../../../../../shared/constants/transaction';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../../shared/constants/network';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import type { AssetWithDisplayData, NativeAsset } from './types';

/**
 * Generates a list of tokens sorted in this order:
 * - native tokens with balance
 * - tokens with highest to lowest balance in selected currency
 * - selected network's native token
 * - matches URL token parameter
 * - matches search query
 * - detected tokens (without balance)
 * - popularity
 * - all other tokens
 * - blocked tokens
 */
export function* generateTokenList({
  multichainTokensWithBalance,
  nativeCurrency,
  nativeCurrencyImage,
  balanceValue,
  currentChainId,
  isEvm,
  selectedNetwork,
  allDetectedTokens,
  topTokens,
  evmTokenMetadataByAddress,
}: {
  multichainTokensWithBalance: Array<{
    isNative?: boolean;
    chainId: string;
    balance?: string;
    decimals: number;
    [key: string]: any;
  }>;
  nativeCurrency: string;
  nativeCurrencyImage: string;
  balanceValue: string;
  currentChainId: string;
  isEvm: boolean;
  selectedNetwork: { chainId: string };
  allDetectedTokens: Token[];
  topTokens?: Array<{ address: Hex }>;
  evmTokenMetadataByAddress: TokenListMap;
}): Generator<any> {
  // Yield multichain tokens with balances
  for (const token of multichainTokensWithBalance) {
    yield token.isNative
      ? {
          ...token,
          image:
            CHAIN_ID_TOKEN_IMAGE_MAP[
              token.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
            ],
          type: AssetType.native,
        }
      : {
          ...token,
          // The Send flow requires the balance to be in Hex
          balance: Numeric.from(token.balance ?? '0', 10)
            .shiftedBy(-1 * token.decimals)
            .toPrefixedHexString(),
        };
  }

  // Yield the native token for the selected chain
  const nativeToken: AssetWithDisplayData<NativeAsset> = {
    address: '' as any,
    symbol: nativeCurrency,
    decimals: 18,
    image: nativeCurrencyImage as any,
    balance: balanceValue,
    string: undefined,
    chainId: selectedNetwork.chainId as any,
    type: AssetType.native,
  };

  if (isEvm) {
    yield nativeToken;
  }

  for (const token of allDetectedTokens) {
    yield { ...token, chainId: currentChainId };
  }

  // Return early when SOLANA is selected since blocked and top tokens are not available
  // All available solana tokens are in the multichainTokensWithBalance results
  if (selectedNetwork?.chainId === MultichainNetworks.SOLANA) {
    return;
  }

  // For EVM tokens only
  // topTokens are sorted by popularity
  for (const topToken of topTokens ?? []) {
    const token: TokenListToken = evmTokenMetadataByAddress?.[topToken.address];
    if (token) {
      yield { ...token, chainId: currentChainId };
    }
  }

  for (const token of Object.values(evmTokenMetadataByAddress)) {
    yield { ...token, chainId: currentChainId };
  }
}
