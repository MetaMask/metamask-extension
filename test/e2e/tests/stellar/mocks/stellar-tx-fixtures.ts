/* eslint-disable @typescript-eslint/naming-convention */
import { createHash } from 'crypto';
import { StatusTypes } from '@metamask/bridge-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import type { CaipAssetType } from '@metamask/utils';
import {
  Account,
  Asset,
  Networks,
  Operation,
  TransactionBuilder,
  type Horizon,
} from '@stellar/stellar-sdk';
import { DEFAULT_STELLAR_ADDRESS } from '../../../constants';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import {
  STELLAR_NATIVE_ASSET_ID,
  STELLAR_USDC_ISSUER,
} from './stellar-constants';

const ETH_MAINNET_USDC_ASSET_ID =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as const;

/** Counterparty address for outbound activity / send fixture txs (not HD Account 2). */
export const STELLAR_RECIPIENT_ADDRESS =
  'GBIIXG2ZPGFMANK4XIF6MMWJXMX4F4BQHIIAJ5GOAB5DXBDQPJ6IRVJK';
/** External sender for inbound activity fixture txs (not HD Account 3). */
export const STELLAR_EXTERNAL_SENDER_ADDRESS =
  'GBDJSQAXWNQF55G6QY6AF4GWKOINELOND7A7RHZPBXBPEV3YSY5M7LVU';

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
  // Partial Horizon shape is enough for the snap's XDR/activity parsing; cast
  // through unknown because ServerApi.TransactionRecord also declares methods.
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
  } as unknown as Horizon.ServerApi.TransactionRecord;
}

function isoFromMs(timestampMs: number): string {
  return new Date(timestampMs).toISOString();
}

/**
 * Confirmed or failed native XLM payment from the E2E Stellar account.
 *
 * @param opts - Send fixture options.
 * @param opts.amount - Human-readable XLM amount (e.g. '1.5').
 * @param opts.destination - Recipient Stellar account id (G…).
 * @param opts.status - Horizon success flag (`confirmed` / `failed`).
 * @param opts.timestamp - Created-at time in ms.
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
 * @param opts.amount - Human-readable XLM amount (e.g. '1.5').
 * @param opts.from - External sender Stellar account id (G…).
 * @param opts.timestamp - Created-at time in ms.
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
 * @param opts.sendAmount - Human-readable XLM send amount.
 * @param opts.destMin - Minimum USDC destination amount.
 * @param opts.timestamp - Created-at time in ms.
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
 * @param opts.txHash - Horizon / keyring transaction id to reclassify.
 * @param opts.srcAmount - Human-readable source XLM amount.
 * @param opts.destAmount - Human-readable destination amount.
 * @param opts.timestamp - Optional start time in ms (defaults to ~1 min ago).
 */
export function stellarBridgeHistoryItem(opts: {
  txHash: string;
  srcAmount: string;
  destAmount: string;
  timestamp?: number;
}): BridgeHistoryItem {
  // BridgeHistoryItem still models EVM-oriented numeric chainIds in places;
  // Stellar activity fixtures use CAIP ids at runtime, so cast the seeded item.
  const srcAsset = {
    symbol: 'XLM',
    chainId: MultichainNetworks.STELLAR,
    name: 'Stellar',
    assetId: STELLAR_NATIVE_ASSET_ID as CaipAssetType,
    decimals: 7,
    address: '',
  };
  const destAsset = {
    symbol: 'USDC',
    chainId: 1,
    name: 'USD Coin',
    assetId: ETH_MAINNET_USDC_ASSET_ID,
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
  } as unknown as BridgeHistoryItem;
}
/* eslint-enable @typescript-eslint/naming-convention */
