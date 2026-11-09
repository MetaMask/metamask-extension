/* eslint-disable @typescript-eslint/naming-convention */
import { createHash } from 'crypto';
import { StatusTypes } from '@metamask/bridge-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import {
  TransactionStatus,
  TransactionType,
  type Transaction as KeyringTransaction,
} from '@metamask/keyring-api';
import {
  Account,
  Asset,
  Networks,
  Operation,
  TransactionBuilder,
  type Horizon,
} from '@stellar/stellar-sdk';
import {
  DEFAULT_STELLAR_ADDRESS,
  EXPECTED_STELLAR_ADDRESSES_BY_INDEX,
} from '../../../constants';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import {
  STELLAR_CHAIN_ID,
  STELLAR_NATIVE_ASSET_ID,
  STELLAR_USDC_ISSUER,
} from './common-stellar';

export const STELLAR_RECIPIENT_ADDRESS = EXPECTED_STELLAR_ADDRESSES_BY_INDEX[1];
export const STELLAR_EXTERNAL_SENDER_ADDRESS =
  EXPECTED_STELLAR_ADDRESSES_BY_INDEX[2];

export type StellarHorizonTxStatus = 'confirmed' | 'failed';

type BuiltTx = ReturnType<TransactionBuilder['build']>;

type BuildClassicOptions = {
  source?: { accountId: string; sequence: string };
};

const DEFAULT_SOURCE = {
  accountId: DEFAULT_STELLAR_ADDRESS,
  sequence: '1234567890',
};

function buildClassicTransaction(
  buildOps: (builder: TransactionBuilder) => void,
  options: BuildClassicOptions = {},
): BuiltTx {
  const source = options.source ?? DEFAULT_SOURCE;
  const account = new Account(source.accountId, source.sequence);
  const builder = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.PUBLIC,
  });
  buildOps(builder);
  return builder.setTimeout(300).build();
}

function deterministicPagingToken(seed: string): string {
  const n = createHash('sha256').update(seed).digest().readBigUInt64BE(0);
  return String(n);
}

function toHorizonRecord(params: {
  built: BuiltTx;
  successful: boolean;
  createdAt: string;
  pagingToken: string;
}): Horizon.ServerApi.TransactionRecord {
  const hash = params.built.hash().toString('hex');
  return {
    id: hash,
    hash,
    paging_token: params.pagingToken,
    successful: params.successful,
    ledger: 42_000_000,
    created_at: params.createdAt,
    source_account: params.built.source,
    source_account_sequence: String(params.built.sequence),
    fee_account: params.built.source,
    fee_charged: params.built.fee,
    max_fee: params.built.fee,
    operation_count: params.built.operations.length,
    envelope_xdr: params.built.toEnvelope().toXDR('base64'),
    result_xdr: '',
    result_meta_xdr: '',
    fee_meta_xdr: '',
    memo_type: 'none',
    signatures: [],
  } as Horizon.ServerApi.TransactionRecord;
}

function isoFromMs(timestampMs: number): string {
  return new Date(timestampMs).toISOString();
}

/**
 * Confirmed or failed native XLM payment from the E2E Stellar account.
 *
 * @param opts - Send fixture options.
 */
export function xlmSendTx(opts: {
  amount: string;
  destination: string;
  status: StellarHorizonTxStatus;
  timestamp: number;
}): Horizon.ServerApi.TransactionRecord {
  const built = buildClassicTransaction((builder) => {
    builder.addOperation(
      Operation.payment({
        destination: opts.destination,
        asset: Asset.native(),
        amount: opts.amount,
      }),
    );
  });
  return toHorizonRecord({
    built,
    successful: opts.status === 'confirmed',
    createdAt: isoFromMs(opts.timestamp),
    pagingToken: deterministicPagingToken(
      `send:${opts.amount}:${opts.destination}:${opts.status}`,
    ),
  });
}

/**
 * Confirmed native XLM payment to the E2E Stellar account from an external sender.
 *
 * @param opts - Receive fixture options.
 */
export function xlmReceiveTx(opts: {
  amount: string;
  from: string;
  timestamp: number;
}): Horizon.ServerApi.TransactionRecord {
  const built = buildClassicTransaction(
    (builder) => {
      builder.addOperation(
        Operation.payment({
          destination: DEFAULT_STELLAR_ADDRESS,
          asset: Asset.native(),
          amount: opts.amount,
        }),
      );
    },
    { source: { accountId: opts.from, sequence: '9876543210' } },
  );
  return toHorizonRecord({
    built,
    successful: true,
    createdAt: isoFromMs(opts.timestamp),
    pagingToken: deterministicPagingToken(`recv:${opts.amount}:${opts.from}`),
  });
}

/**
 * Self path-payment strict-send (XLM → USDC). Matches
 * `SwapTransactionXdrStruct` + `isSwapTransaction` in the Stellar snap.
 *
 * @param opts - Swap fixture options.
 */
export function xlmSwapTx(opts: {
  sendAmount: string;
  destMin: string;
  timestamp: number;
}): Horizon.ServerApi.TransactionRecord {
  const usdc = new Asset('USDC', STELLAR_USDC_ISSUER);
  const built = buildClassicTransaction((builder) => {
    builder.addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: Asset.native(),
        sendAmount: opts.sendAmount,
        destination: DEFAULT_STELLAR_ADDRESS,
        destAsset: usdc,
        destMin: opts.destMin,
        path: [],
      }),
    );
  });
  return toHorizonRecord({
    built,
    successful: true,
    createdAt: isoFromMs(opts.timestamp),
    pagingToken: deterministicPagingToken(
      `swap:${opts.sendAmount}:${opts.destMin}`,
    ),
  });
}

/**
 * Builds a `BridgeStatusController.txHistory` entry that reclassifies a Stellar
 * send (keyed by Horizon tx hash / keyring `transaction.id`) as Bridged XLM.
 *
 * @param opts - Bridge history options.
 */
export function stellarBridgeHistoryItem(opts: {
  txHash: string;
  srcAmount: string;
  destAmount: string;
  timestamp?: number;
}): BridgeHistoryItem {
  const srcAsset = {
    symbol: 'XLM',
    chainId: MultichainNetworks.STELLAR,
    name: 'Stellar',
    assetId: STELLAR_NATIVE_ASSET_ID,
    decimals: 7,
    address: '',
  };
  const destAsset = {
    symbol: 'USDC',
    chainId: 1,
    name: 'USD Coin',
    assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  };

  return {
    account: DEFAULT_STELLAR_ADDRESS,
    hasApprovalTx: false,
    quote: {
      srcChainId: MultichainNetworks.STELLAR,
      destChainId: destAsset.chainId,
      srcTokenAmount: opts.srcAmount,
      destTokenAmount: opts.destAmount,
      srcAsset,
      destAsset,
      requestId: opts.txHash,
      feeData: {
        metabridge: {
          amount: '0',
          asset: srcAsset,
        },
      },
      steps: [],
      bridgeId: 'rango',
      bridges: ['rango'],
    },
    status: {
      status: StatusTypes.COMPLETE,
      srcChain: {
        chainId: MultichainNetworks.STELLAR,
        txHash: opts.txHash,
        amount: opts.srcAmount,
        token: srcAsset,
      },
      destChain: {
        chainId: destAsset.chainId,
        txHash: `0x${'cd'.repeat(32)}`,
        amount: opts.destAmount,
        token: destAsset,
      },
    },
    startTime: opts.timestamp ?? Date.now() - 60_000,
    estimatedProcessingTimeInSeconds: 60,
    slippagePercentage: 0.5,
  };
}

/**
 * Builds a keyring Send transaction for MultichainTransactionsController seeding
 * (used when Horizon cannot express Pending / Unconfirmed).
 *
 * @param opts - Keyring send options.
 */
export function stellarKeyringSendTx(opts: {
  accountId: string;
  amount: string;
  destination: string;
  status:
    | typeof TransactionStatus.Unconfirmed
    | typeof TransactionStatus.Failed;
  timestampMs: number;
  id: string;
}): KeyringTransaction {
  const timestamp = Math.floor(opts.timestampMs / 1000);
  const asset = {
    unit: 'XLM',
    type: STELLAR_NATIVE_ASSET_ID,
    amount: opts.amount,
    fungible: true as const,
  };

  return {
    type: TransactionType.Send,
    id: opts.id,
    account: opts.accountId,
    chain: STELLAR_CHAIN_ID,
    status: opts.status,
    timestamp,
    from: [
      {
        address: DEFAULT_STELLAR_ADDRESS,
        asset,
      },
    ],
    to: [
      {
        address: opts.destination,
        asset,
      },
    ],
    events: [
      {
        status: opts.status,
        timestamp,
      },
    ],
    fees: [],
  };
}
/* eslint-enable @typescript-eslint/naming-convention */
