import type { Hex } from '@metamask/utils';
import type {
  TransactionParams,
  TransactionType,
} from '@metamask/transaction-controller';

/**
 * Union of all supported MMPay dApp transaction types.
 *
 * To add a new type:
 * 1. Create a builder in `./builders/<type>.ts` exporting a {@link MmPayDefinition}.
 * 2. Register it in `./registry.ts`.
 * 3. Add the new literal to this union.
 */
export type MmPayType = 'perpsDeposit' | 'perpsWithdraw';

/**
 * Validated MMPay RPC parameters. `amount` is a human-readable USDC decimal
 * string (for example `"10"` or `"12.5"`); when omitted the resulting
 * transaction is staged with a `0x0` token amount so the user can edit it in
 * the confirmation screen.
 */
export type MmPayParams = {
  type: MmPayType;
  amount?: string;
};

/**
 * Context passed to a {@link MmPayDefinition.build} function once params have
 * been validated and converted to on-chain primitives.
 */
export type MmPayBuildContext = {
  from: Hex;
  /** Token amount in raw base units, hex-encoded. `'0x0'` when no amount was supplied. */
  amountRaw: Hex;
};

/**
 * Result of building an MMPay transaction. Ready to hand to the Transaction
 * Controller's `addTransaction` on the specified `chainId`.
 */
export type MmPayBuiltTransaction = {
  txParams: TransactionParams;
  type: TransactionType;
  chainId: Hex;
  /** When true, callers should skip the initial gas estimate (set gas later). */
  skipInitialGasEstimate?: boolean;
};

/**
 * Declarative description of one MMPay transaction type: which chain it runs
 * on, which token it moves, how to check whether it is available, and how to
 * build the final {@link MmPayBuiltTransaction} from a validated context.
 */
/** One side (source or destination) of an MMPay transfer. */
export type MmPayResultSide = {
  /** Chain the funds left from or arrived on. HyperCore is `0x539`. */
  chainId?: Hex;
  /** Transaction hash on that chain, when known. */
  hash?: Hex;
};

/**
 * Result returned by `wallet_mmPay` once the user confirms and the transfer
 * completes. Fields are omitted when the data isn't available, e.g. no hash
 * when Relay reports none.
 */
export type MmPayResult = {
  /** MetaMask transaction ID, useful for support. */
  transactionId?: string;
  /** Pay strategy that executed the transfer, e.g. `relay`. */
  provider?: string;
  /** The payment side: the token the user paid with (deposit) or HyperCore (withdraw). */
  source: MmPayResultSide;
  /** The funds' final landing side. */
  destination: MmPayResultSide;
};

/** Provider and chain details read from the Pay quote. */
export type MmPayQuoteSides = {
  provider?: string;
  sourceChainId?: Hex;
  destinationChainId?: Hex;
};

export type MmPayDefinition = {
  type: MmPayType;
  chainId: Hex;
  tokenDecimals: number;
  /**
   * Optional availability check against the current remote feature flags.
   * Return `false` to reject with a `methodNotSupported` RPC error.
   */
  isAvailable?: (remoteFeatureFlags: Record<string, unknown>) => boolean;
  build: (ctx: MmPayBuildContext) => MmPayBuiltTransaction;
};
