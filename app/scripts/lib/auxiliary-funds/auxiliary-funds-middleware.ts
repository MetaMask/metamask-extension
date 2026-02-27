import {
  NetworkClientId,
  NetworkController,
} from '@metamask/network-controller';
import {
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  JsonRpcResponse,
} from '@metamask/utils';
import type { RequiredAsset } from '@metamask/transaction-controller';

import { CHAIN_IDS } from '../../../../shared/constants/network';

const ARBITRUM_USDC_ADDRESS =
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const;

const HYPERLIQUID_BRIDGE_ADDRESS =
  '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7' as const;

const ERC20_TRANSFER_SELECTOR = '0xa9059cbb';
const BATCHED_DEPOSIT_WITH_PERMIT_SELECTOR = '0xb30b5bce';

type AuxiliaryFundsMiddlewareRequest<
  Params extends JsonRpcParams = JsonRpcParams,
> = Required<JsonRpcRequest<Params>> & {
  networkClientId: NetworkClientId;
  requiredAssets?: RequiredAsset[];
};

/**
 * Detects Hyperliquid bridge deposits on Arbitrum and attaches `requiredAssets`
 * to the request so the downstream MMPay pipeline can provision USDC if needed.
 *
 * Two deposit patterns are recognised:
 * 1. ERC-20 transfer on the USDC contract where the recipient is the bridge.
 * 2. batchedDepositWithPermit called directly on the Hyperliquid bridge.
 *
 * @param options0 - Options bag.
 * @param options0.getNetworkConfigurationByNetworkClientId - Resolves chain ID.
 */
export function createAuxiliaryFundsMiddleware<
  Params extends (string | { to?: string; data?: string })[],
  Result extends Json,
>({
  getNetworkConfigurationByNetworkClientId,
}: {
  getNetworkConfigurationByNetworkClientId: NetworkController['getNetworkConfigurationByNetworkClientId'];
}) {
  return (
    req: AuxiliaryFundsMiddlewareRequest<Params>,
    _res: JsonRpcResponse<Result>,
    next: () => void,
  ) => {
    try {
      if (req.method !== 'eth_sendTransaction') {
        return;
      }

      const networkConfig = getNetworkConfigurationByNetworkClientId(
        req.networkClientId,
      );
      if (networkConfig?.chainId !== CHAIN_IDS.ARBITRUM) {
        return;
      }

      const txParams = req.params[0];
      if (typeof txParams === 'string' || !txParams) {
        return;
      }

      const { to, data } = txParams;
      if (!to || !data) {
        return;
      }

      const amount = extractHyperliquidDepositAmount(to, data);
      if (!amount) {
        return;
      }

      const requiredAssets: RequiredAsset[] = [
        {
          address: ARBITRUM_USDC_ADDRESS,
          amount,
          standard: 'erc20',
        },
      ];

      req.requiredAssets = requiredAssets;
    } finally {
      next();
    }
  };
}

/**
 * Extracts the USDC deposit amount from a Hyperliquid bridge transaction.
 *
 * @param to
 * @param data
 * @returns The deposit amount as a hex string, or `null` if the tx is not a
 * recognised Hyperliquid deposit.
 */
function extractHyperliquidDepositAmount(
  to: string,
  data: string,
): `0x${string}` | null {
  const selector = data.slice(0, 10).toLowerCase();
  const toNormalised = to.toLowerCase();

  // Case 1: USDC transfer(address,uint256) where recipient is the bridge
  if (
    toNormalised === ARBITRUM_USDC_ADDRESS.toLowerCase() &&
    selector === ERC20_TRANSFER_SELECTOR
  ) {
    return extractAmountFromTransfer(data);
  }

  // Case 2: batchedDepositWithPermit called on the bridge contract
  if (
    toNormalised === HYPERLIQUID_BRIDGE_ADDRESS.toLowerCase() &&
    selector === BATCHED_DEPOSIT_WITH_PERMIT_SELECTOR
  ) {
    return extractAmountFromBatchedDeposit(data);
  }

  return null;
}

/**
 * Decodes transfer(address,uint256) calldata and verifies the recipient is
 * the Hyperliquid bridge. Returns the uint256 amount as a hex string.
 *
 * @param data - The full calldata hex string including selector.
 */
function extractAmountFromTransfer(data: string): `0x${string}` | null {
  // 4 byte selector + 32 byte address + 32 byte amount = 68 bytes = 136 hex chars + '0x'
  if (data.length < 138) {
    return null;
  }

  const recipientRaw = data.slice(10, 74);
  const recipientAddress = `0x${recipientRaw.slice(24)}`.toLowerCase();

  if (recipientAddress !== HYPERLIQUID_BRIDGE_ADDRESS.toLowerCase()) {
    return null;
  }

  const amountHex = data.slice(74, 138);
  return `0x${stripLeadingZeros(amountHex)}`;
}

/**
 * Extracts the total deposit amount from batchedDepositWithPermit(tuple[]).
 * Prototype: reads the usd field from the first tuple entry only.
 *
 * @param data - The full calldata hex string including selector.
 */
function extractAmountFromBatchedDeposit(data: string): `0x${string}` | null {
  // Minimum: selector(8) + offset(64) + length(64) + one tuple offset(64) + tuple(384)
  if (data.length < 8 + 64 + 64 + 64 + 384) {
    return null;
  }

  const withoutSelector = data.slice(10);

  // Array offset (should be 0x20 = 32)
  const arrayOffset = parseInt(withoutSelector.slice(0, 64), 16) * 2; // in hex chars
  const arrayLengthStart = arrayOffset;
  const arrayLength = parseInt(
    withoutSelector.slice(arrayLengthStart, arrayLengthStart + 64),
    16,
  );

  if (arrayLength === 0) {
    return null;
  }

  // First tuple offset (relative to array data start)
  const tupleOffsetsStart = arrayLengthStart + 64;
  const firstTupleOffset =
    parseInt(
      withoutSelector.slice(tupleOffsetsStart, tupleOffsetsStart + 64),
      16,
    ) * 2;

  // First tuple data starts at: arrayData + firstTupleOffset
  const arrayDataStart = arrayLengthStart + 64;
  const tupleStart = arrayDataStart + firstTupleOffset;

  // usd is the second field (uint64), at offset 32 bytes (64 hex chars) into the tuple
  const usdHex = withoutSelector.slice(tupleStart + 64, tupleStart + 128);
  if (!usdHex || usdHex.length < 64) {
    return null;
  }

  return `0x${stripLeadingZeros(usdHex)}`;
}

function stripLeadingZeros(hex: string): string {
  const stripped = hex.replace(/^0+/u, '');
  return stripped || '0';
}
