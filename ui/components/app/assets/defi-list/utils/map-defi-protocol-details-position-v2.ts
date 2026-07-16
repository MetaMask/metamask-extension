import {
  isCaipChainId,
  parseCaipAssetType,
  parseCaipChainId,
  type Hex,
} from '@metamask/utils';
import type { DeFiUnderlyingPosition } from '@metamask/assets-controllers';
import { decimalToPrefixedHex } from '../../../../../../shared/lib/conversion.utils';
import { isEvmChainId } from '../../../../../../shared/lib/asset-utils';
import { toChecksumHexAddress } from '../../../../../../shared/lib/hexstring-utils';
import type { TokenWithFiatAmount } from '../../types';

function toTokenCellChainId(
  chainId: DeFiUnderlyingPosition['chainId'],
): TokenWithFiatAmount['chainId'] {
  if (isCaipChainId(chainId) && isEvmChainId(chainId)) {
    return decimalToPrefixedHex(parseCaipChainId(chainId).reference) as Hex;
  }

  return chainId as TokenWithFiatAmount['chainId'];
}

function toTokenCellAddress(
  position: DeFiUnderlyingPosition,
): TokenWithFiatAmount['address'] {
  const { assetReference, assetNamespace } = parseCaipAssetType(
    position.assetId,
  );

  if (assetNamespace === 'slip44') {
    return assetReference as TokenWithFiatAmount['address'];
  }

  return (toChecksumHexAddress(assetReference) ??
    assetReference) as TokenWithFiatAmount['address'];
}

/**
 * Returns the human-readable balance for a DeFi underlying position.
 *
 * @param position - Underlying position from `DeFiPositionsControllerV2` state.
 * @returns Parsed balance amount, or 0 when invalid.
 */
function getNormalizedBalance(position: DeFiUnderlyingPosition): number {
  const normalizedBalance = Number.parseFloat(position.balance);

  return Number.isFinite(normalizedBalance) ? normalizedBalance : 0;
}

/**
 * Maps a DeFi underlying position (from `DeFiPositionsControllerV2` state) to
 * the token cell shape.
 *
 * @param position - Underlying position from the details-page section.
 * @returns Token data used by the DeFi details position cell.
 */
export function mapDefiProtocolDetailsPositionV2ToToken(
  position: DeFiUnderlyingPosition,
): TokenWithFiatAmount {
  const { assetNamespace } = parseCaipAssetType(position.assetId);
  const isNative = assetNamespace === 'slip44';
  const normalizedBalance = getNormalizedBalance(position);

  return {
    address: toTokenCellAddress(position),
    title: position.name,
    symbol: position.symbol,
    tokenFiatAmount: position.marketValue,
    image: position.tokenImage,
    balance: normalizedBalance.toString(),
    secondary: null,
    string: normalizedBalance.toString(),
    decimals: position.decimals,
    chainId: toTokenCellChainId(position.chainId),
    assetId: position.assetId,
    isNative,
  } as TokenWithFiatAmount;
}
