import {
  type Hex,
  parseCaipAssetType,
  parseCaipChainId,
} from '@metamask/utils';
import {
  getNativeTokenAddress,
  type DeFiUnderlyingPosition,
} from '@metamask/assets-controllers';
import { decimalToPrefixedHex } from '../../../../../shared/lib/conversion.utils';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';
import { toChecksumHexAddress } from '../../../../../shared/lib/hexstring-utils';
import type { TokenWithFiatAmount } from '../../../../components/app/assets/types';

function toTokenCellChainId(
  chainId: DeFiUnderlyingPosition['chainId'],
): TokenWithFiatAmount['chainId'] {
  if (isEvmChainId(chainId)) {
    return decimalToPrefixedHex(parseCaipChainId(chainId).reference);
  }

  return chainId;
}

/**
 * Resolves the token-cell `address` for a DeFi underlying position.
 *
 * - Non-EVM: return the CAIP asset id unchanged.
 * - EVM slip44 (native): return the chain's native token address (or zero).
 * - EVM erc20: return the checksummed contract address.
 *
 * @param position - Underlying position from `DeFiPositionsControllerV2` state.
 * @returns Token cell address appropriate for the chain/asset type.
 */
function toTokenCellAddress(
  position: DeFiUnderlyingPosition,
): TokenWithFiatAmount['address'] {
  if (!isEvmChainId(position.chainId)) {
    return position.assetId;
  }

  const { assetReference, assetNamespace } = parseCaipAssetType(
    position.assetId,
  );
  const hexChainId = toTokenCellChainId(position.chainId) as Hex;

  if (assetNamespace === 'slip44') {
    return getNativeTokenAddress(hexChainId);
  }

  if (assetNamespace === 'erc20') {
    return toChecksumHexAddress(
      assetReference,
    ) as TokenWithFiatAmount['address'];
  }

  return position.assetId;
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
    tokenFiatAmount: position.marketValue ?? null,
    image: position.tokenImage ?? '',
    balance: normalizedBalance.toString(),
    secondary: null,
    string: normalizedBalance.toString(),
    decimals: position.decimals,
    chainId: toTokenCellChainId(position.chainId),
    assetId: position.assetId,
    isNative,
  } as TokenWithFiatAmount;
}
