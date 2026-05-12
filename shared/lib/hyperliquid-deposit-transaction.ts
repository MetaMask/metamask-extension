import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { encode } from '@metamask/abi-utils';
import { bytesToHex, type Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../constants/network';

const ERC20_TRANSFER_FUNCTION_SIGNATURE = '0xa9059cbb';
const USDC_DECIMALS = 6;
const USDC_ATOMIC_UNITS_PER_TOKEN = 10n ** BigInt(USDC_DECIMALS);

export const HYPERLIQUID_DEPOSIT_CHAIN_ID = CHAIN_IDS.ARBITRUM;
export const HYPERLIQUID_DEPOSIT_USDC_ADDRESS =
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Hex;
export const HYPERLIQUID_DEPOSIT_BRIDGE_ADDRESS =
  '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7' as Hex;
export const HYPERLIQUID_DEPOSIT_GAS_LIMIT = '0x186a0' as Hex;
export const HYPERLIQUID_MIN_DEPOSIT_USDC = 5;
export const HYPERLIQUID_DEPOSIT_CONFIRMATION_REQUEST_ID =
  'metamask:hyperliquidDeposit';
export const HYPERLIQUID_DEPOSIT_SIDE_PANEL_ROUTE_MESSAGE =
  'metamask:hyperliquidDepositSidePanelRouteRequested';

export type HyperliquidDepositTransactionParams = {
  from: Hex;
  to: Hex;
  value: Hex;
  data: Hex;
  gas: Hex;
};

export type HyperliquidDepositSidePanelRouteMessage = {
  type: typeof HYPERLIQUID_DEPOSIT_SIDE_PANEL_ROUTE_MESSAGE;
  payload: {
    triggerId: string;
    tabId?: number;
    windowId?: number;
  };
};

export function createHyperliquidDepositTransactionParams({
  amount,
  from,
}: {
  amount: string;
  from: Hex;
}): HyperliquidDepositTransactionParams {
  const atomicAmount = parseUsdcAmountToAtomicUnits(amount);

  return {
    from,
    to: HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
    value: '0x0',
    data: createErc20TransferData(
      HYPERLIQUID_DEPOSIT_BRIDGE_ADDRESS,
      atomicAmount,
    ),
    gas: HYPERLIQUID_DEPOSIT_GAS_LIMIT,
  };
}

export function parseUsdcAmountToAtomicUnits(amount: string): bigint {
  const normalizedAmount = amount.trim();

  if (!/^\d+(?:\.\d{1,6})?$/u.test(normalizedAmount)) {
    throw new Error('Enter a valid USDC amount with up to 6 decimals.');
  }

  const [wholePart, fractionalPart = ''] = normalizedAmount.split('.');
  const atomicAmount =
    BigInt(wholePart) * USDC_ATOMIC_UNITS_PER_TOKEN +
    BigInt(fractionalPart.padEnd(USDC_DECIMALS, '0'));

  if (atomicAmount <= 0n) {
    throw new Error('Deposit amount must be greater than 0 USDC.');
  }

  if (
    atomicAmount <
    BigInt(HYPERLIQUID_MIN_DEPOSIT_USDC) * USDC_ATOMIC_UNITS_PER_TOKEN
  ) {
    throw new Error(
      `Hyperliquid deposits must be at least ${HYPERLIQUID_MIN_DEPOSIT_USDC} USDC.`,
    );
  }

  return atomicAmount;
}

export function isHyperliquidDepositConfirmation(
  transactionMeta:
    | Pick<TransactionMeta, 'requestId' | 'type'>
    | undefined
    | null,
): boolean {
  return (
    transactionMeta?.type === TransactionType.perpsDeposit &&
    transactionMeta.requestId === HYPERLIQUID_DEPOSIT_CONFIRMATION_REQUEST_ID
  );
}

export function isHyperliquidDepositSidePanelRouteMessage(
  message: unknown,
): message is HyperliquidDepositSidePanelRouteMessage {
  return (
    Boolean(message) &&
    typeof message === 'object' &&
    'type' in message &&
    message.type === HYPERLIQUID_DEPOSIT_SIDE_PANEL_ROUTE_MESSAGE &&
    'payload' in message &&
    Boolean(message.payload) &&
    typeof message.payload === 'object' &&
    'triggerId' in message.payload &&
    typeof message.payload.triggerId === 'string'
  );
}

function createErc20TransferData(toAddress: Hex, atomicAmount: bigint): Hex {
  const encodedArguments = bytesToHex(
    encode(['address', 'uint256'], [
      toAddress,
      `0x${atomicAmount.toString(16)}`,
    ]),
  ).slice(2);

  return `${ERC20_TRANSFER_FUNCTION_SIGNATURE}${encodedArguments}` as Hex;
}
