/* eslint-disable @typescript-eslint/naming-convention */
import { sha256 } from 'ethereum-cryptography/sha256';
import { bytesToHex } from 'ethereum-cryptography/utils';
import { base58AddressToHex } from '../../../seeder/tron/assets';
import { TRON_ACCOUNT_ADDRESS } from './common-tron';

export type TronTxStatus = 'Confirmed' | 'Pending' | 'Failed';

const STATUS_TO_CONTRACT_RET: Record<TronTxStatus, string> = {
  Confirmed: 'SUCCESS',
  Pending: '',
  Failed: 'OUT_OF_ENERGY',
};

// SunSwap router is a real, checksum-valid Tron address used as a stand-in for
// any DEX/bridge contract. Tron seeder asserts base58 checksums when converting
// to hex (see seeder/tron/assets.ts:base58AddressToHex), so fixtures cannot use
// arbitrary placeholder strings here.
const SUNSWAP_ROUTER_ADDRESS = 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax';
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

const TRC20_INFO = {
  USDT: {
    address: USDT_CONTRACT_ADDRESS,
    decimals: 6,
    name: 'Tether USD',
  },
  USDD: {
    address: 'TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz',
    decimals: 18,
    name: 'Decentralized USD',
  },
  HTX: {
    address: 'TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6',
    decimals: 18,
    name: 'HTX',
  },
} as const;

export type Trc20Symbol = keyof typeof TRC20_INFO;

function deterministicTxId(seed: string): string {
  return bytesToHex(sha256(Buffer.from(seed, 'utf8')));
}

function ret(status: TronTxStatus, fee = 2_799_500) {
  if (status === 'Pending') {
    return [];
  }
  return [{ contractRet: STATUS_TO_CONTRACT_RET[status], fee }];
}

function ts(timestamp?: number): number {
  return timestamp ?? Date.now() - 60_000;
}

function ownerHex(address: string): string {
  return base58AddressToHex(address);
}

// Required by the snap's TransactionInfoStruct (raw_data must include
// ref_block_bytes, ref_block_hash, expiration). Without these, every parsed
// response throws and the snap stores zero transactions.
function rawDataMeta(timestamp: number) {
  return {
    ref_block_bytes: '0000',
    ref_block_hash: '0000000000000000',
    expiration: timestamp + 60_000,
    timestamp,
  };
}

export function trxSendTx(opts: {
  amountSun: number;
  to: string;
  status: TronTxStatus;
  timestamp?: number;
}) {
  const txID = deterministicTxId(`trxSend:${opts.amountSun}:${opts.to}`);
  const blockTimestamp = ts(opts.timestamp);
  return {
    ret: ret(opts.status),
    txID,
    blockNumber: opts.status === 'Pending' ? undefined : 77_000_000,
    block_timestamp: blockTimestamp,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              amount: opts.amountSun,
              owner_address: ownerHex(TRON_ACCOUNT_ADDRESS),
              to_address: ownerHex(opts.to),
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        },
      ],
      ...rawDataMeta(blockTimestamp),
    },
  };
}

export function trxReceiveTx(opts: {
  amountSun: number;
  from: string;
  status: TronTxStatus;
  timestamp?: number;
}) {
  const txID = deterministicTxId(`trxReceive:${opts.amountSun}:${opts.from}`);
  const blockTimestamp = ts(opts.timestamp);
  return {
    ret: ret(opts.status),
    txID,
    blockNumber: opts.status === 'Pending' ? undefined : 77_000_000,
    block_timestamp: blockTimestamp,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              amount: opts.amountSun,
              owner_address: ownerHex(opts.from),
              to_address: ownerHex(TRON_ACCOUNT_ADDRESS),
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        },
      ],
      ...rawDataMeta(blockTimestamp),
    },
  };
}

export function trc20TransferTx(opts: {
  symbol: Trc20Symbol;
  amount: string;
  from: string;
  to: string;
  status: TronTxStatus;
  timestamp?: number;
}) {
  const txId = deterministicTxId(
    `trc20:${opts.symbol}:${opts.amount}:${opts.from}:${opts.to}`,
  );
  return {
    transaction_id: txId,
    token_info: { symbol: opts.symbol, ...TRC20_INFO[opts.symbol] },
    block_timestamp: ts(opts.timestamp),
    from: opts.from,
    to: opts.to,
    type: 'Transfer',
    value: opts.amount,
    final_result: STATUS_TO_CONTRACT_RET[opts.status],
  };
}

/**
 * A TRC20 Approval lives in BOTH the rawTransactions list (TriggerSmartContract)
 * and the trc20Transactions list (with type='Approval'). The snap's
 * `fetchNewTransactionsForAccount` early-returns when no rawTransactions are
 * present, so a trc20-only Approval is never persisted — emitting both halves
 * is required for the activity row to appear.
 *
 * @param opts
 * @param opts.symbol
 * @param opts.amount
 * @param opts.spender
 * @param opts.status
 * @param opts.timestamp
 */
export function trc20ApproveTx(opts: {
  symbol: Trc20Symbol;
  amount: string;
  spender: string;
  status: TronTxStatus;
  timestamp?: number;
}): {
  raw: ReturnType<typeof buildApproveRawTx>;
  trc20: ReturnType<typeof buildApproveTrc20>;
} {
  const txID = deterministicTxId(
    `approve:${opts.symbol}:${opts.amount}:${opts.spender}`,
  );
  const blockTimestamp = ts(opts.timestamp);
  return {
    raw: buildApproveRawTx({ ...opts, txID, blockTimestamp }),
    trc20: buildApproveTrc20({ ...opts, txID, blockTimestamp }),
  };
}

function buildApproveRawTx(opts: {
  symbol: Trc20Symbol;
  status: TronTxStatus;
  txID: string;
  blockTimestamp: number;
}) {
  return {
    ret: ret(opts.status),
    txID: opts.txID,
    blockNumber: opts.status === 'Pending' ? undefined : 77_000_000,
    block_timestamp: opts.blockTimestamp,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              owner_address: ownerHex(TRON_ACCOUNT_ADDRESS),
              contract_address: ownerHex(TRC20_INFO[opts.symbol].address),
            },
            type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
          },
          type: 'TriggerSmartContract',
        },
      ],
      ...rawDataMeta(opts.blockTimestamp),
    },
  };
}

function buildApproveTrc20(opts: {
  symbol: Trc20Symbol;
  amount: string;
  spender: string;
  status: TronTxStatus;
  txID: string;
  blockTimestamp: number;
}) {
  return {
    transaction_id: opts.txID,
    token_info: { symbol: opts.symbol, ...TRC20_INFO[opts.symbol] },
    block_timestamp: opts.blockTimestamp,
    from: TRON_ACCOUNT_ADDRESS,
    to: opts.spender,
    type: 'Approval',
    value: opts.amount,
    final_result: STATUS_TO_CONTRACT_RET[opts.status],
  };
}

/**
 * A swap transaction lives in BOTH the rawTransactions list (TriggerSmartContract
 * with call_value > 0 for TRX-source) AND the trc20Transactions list (the token
 * the user receives). The snap's `mapTriggerSmartContract` requires both halves
 * to recognise a TRX↔TRC20 swap; emitting only one half makes the snap return
 * null and the activity row never appears.
 * @param opts
 * @param opts.srcSymbol
 * @param opts.srcAmount
 * @param opts.destSymbol
 * @param opts.destAmount
 * @param opts.status
 * @param opts.timestamp
 */
export function swapTx(opts: {
  srcSymbol: 'TRX' | Trc20Symbol;
  srcAmount: string;
  destSymbol: 'TRX' | Trc20Symbol;
  destAmount: string;
  status: TronTxStatus;
  timestamp?: number;
}): {
  raw: ReturnType<typeof buildSwapRawTx>;
  trc20: ReturnType<typeof buildSwapTrc20>;
} {
  const txID = deterministicTxId(
    `swap:${opts.srcSymbol}:${opts.srcAmount}:${opts.destSymbol}:${opts.destAmount}`,
  );
  const blockTimestamp = ts(opts.timestamp);
  return {
    raw: buildSwapRawTx({ ...opts, txID, blockTimestamp }),
    trc20: buildSwapTrc20({ ...opts, txID, blockTimestamp }),
  };
}

function buildSwapRawTx(opts: {
  srcSymbol: 'TRX' | Trc20Symbol;
  srcAmount: string;
  status: TronTxStatus;
  txID: string;
  blockTimestamp: number;
}) {
  const callValue =
    opts.srcSymbol === 'TRX' ? Number(opts.srcAmount) * 1_000_000 : undefined;
  return {
    ret: ret(opts.status),
    txID: opts.txID,
    blockNumber: opts.status === 'Pending' ? undefined : 77_000_000,
    block_timestamp: opts.blockTimestamp,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              owner_address: ownerHex(TRON_ACCOUNT_ADDRESS),
              contract_address: ownerHex(SUNSWAP_ROUTER_ADDRESS),
              ...(callValue ? { call_value: callValue } : {}),
            },
            type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
          },
          type: 'TriggerSmartContract',
        },
      ],
      ...rawDataMeta(opts.blockTimestamp),
    },
  };
}

function buildSwapTrc20(opts: {
  destSymbol: 'TRX' | Trc20Symbol;
  destAmount: string;
  status: TronTxStatus;
  txID: string;
  blockTimestamp: number;
}) {
  // For TRX-out swaps the dest is a TRC20; for TRC20-out swaps both halves
  // would be TRC20 (currently only TRX→TRC20 is exercised by tests).
  const symbol =
    opts.destSymbol === 'TRX' ? ('USDT' as Trc20Symbol) : opts.destSymbol;
  return {
    transaction_id: opts.txID,
    token_info: { symbol, ...TRC20_INFO[symbol] },
    block_timestamp: opts.blockTimestamp,
    from: SUNSWAP_ROUTER_ADDRESS,
    to: TRON_ACCOUNT_ADDRESS,
    type: 'Transfer',
    value: opts.destAmount,
    final_result: STATUS_TO_CONTRACT_RET[opts.status],
  };
}

/**
 * A bridge transaction without `bridgeHistoryItem` should fall back to the
 * Interaction (i.e. Unknown) rendering. The snap maps a TriggerSmartContract
 * with a TRC20 transfer of type='Approval' as TransactionType.Unknown, which
 * the activity hook renders as 'Interaction'.
 * @param opts
 * @param opts.srcSymbol
 * @param opts.srcAmount
 * @param opts.destChain
 * @param opts.status
 * @param opts.timestamp
 */
export function bridgeTx(opts: {
  srcSymbol: 'TRX' | Trc20Symbol;
  srcAmount: string;
  destChain: string;
  status: TronTxStatus;
  timestamp?: number;
}): {
  raw: ReturnType<typeof buildBridgeRawTx>;
  trc20: ReturnType<typeof buildBridgeTrc20>;
} {
  const txID = deterministicTxId(
    `bridge:${opts.srcSymbol}:${opts.srcAmount}:${opts.destChain}`,
  );
  const blockTimestamp = ts(opts.timestamp);
  return {
    raw: buildBridgeRawTx({ ...opts, txID, blockTimestamp }),
    trc20: buildBridgeTrc20({ ...opts, txID, blockTimestamp }),
  };
}

function buildBridgeRawTx(opts: {
  status: TronTxStatus;
  txID: string;
  blockTimestamp: number;
}) {
  return {
    ret: ret(opts.status),
    txID: opts.txID,
    blockNumber: opts.status === 'Pending' ? undefined : 77_000_000,
    block_timestamp: opts.blockTimestamp,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              owner_address: ownerHex(TRON_ACCOUNT_ADDRESS),
              contract_address: ownerHex(SUNSWAP_ROUTER_ADDRESS),
            },
            type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
          },
          type: 'TriggerSmartContract',
        },
      ],
      ...rawDataMeta(opts.blockTimestamp),
    },
  };
}

function buildBridgeTrc20(opts: {
  srcSymbol: 'TRX' | Trc20Symbol;
  srcAmount: string;
  status: TronTxStatus;
  txID: string;
  blockTimestamp: number;
}) {
  const symbol =
    opts.srcSymbol === 'TRX' ? ('USDT' as Trc20Symbol) : opts.srcSymbol;
  return {
    transaction_id: opts.txID,
    token_info: { symbol, ...TRC20_INFO[symbol] },
    block_timestamp: opts.blockTimestamp,
    from: TRON_ACCOUNT_ADDRESS,
    to: SUNSWAP_ROUTER_ADDRESS,
    type: 'Approval',
    value: opts.srcAmount,
    final_result: STATUS_TO_CONTRACT_RET[opts.status],
  };
}
