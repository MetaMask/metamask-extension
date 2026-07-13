import {
  isCaipChainId,
  parseCaipAssetType,
  parseCaipChainId,
  type Hex,
} from '@metamask/utils';
import { decimalToPrefixedHex } from '../../../../../../shared/lib/conversion.utils';
import { isEvmChainId } from '../../../../../../shared/lib/asset-utils';
import type { TokenWithFiatAmount } from '../../types';
import type { DefiProtocolDetailsPosition } from './group-defi-protocol-details';

function toTokenCellChainId(
  chainId: DefiProtocolDetailsPosition['chainId'],
): TokenWithFiatAmount['chainId'] {
  if (isCaipChainId(chainId) && isEvmChainId(chainId)) {
    return decimalToPrefixedHex(
      parseCaipChainId(chainId).reference,
    ) as Hex;
  }

  return chainId as TokenWithFiatAmount['chainId'];
}

/**
 * Maps a v6 DeFi protocol position to the token cell shape.
 *
 * @param position - Grouped DeFi position from the v6 balances API.
 * @returns Token data used by the DeFi details position cell.
 */
export function mapDefiProtocolDetailsPositionV2ToToken(
  position: DefiProtocolDetailsPosition,
): TokenWithFiatAmount {
  const { assetReference } = parseCaipAssetType(position.assetId);

  return {
    address: assetReference as TokenWithFiatAmount['address'],
    title: position.name,
    symbol: position.name,
    tokenFiatAmount: position.tokenFiatAmount,
    image: position.tokenImage,
    balance: position.normalizedBalance.toString(),
    secondary: null,
    string: position.normalizedBalance.toString(),
    decimals: position.decimals,
    chainId: toTokenCellChainId(position.chainId),
    assetId: position.assetId,
  } as TokenWithFiatAmount;
}
