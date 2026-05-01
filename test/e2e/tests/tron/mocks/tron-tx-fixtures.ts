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

export function trxSendTx(opts: {
  amountSun: number;
  to: string;
  status: TronTxStatus;
  timestamp?: number;
}) {
  const txID = deterministicTxId(`trxSend:${opts.amountSun}:${opts.to}`);
  return {
    ret: ret(opts.status),
    txID,
    blockNumber: 77_000_000,
    block_timestamp: ts(opts.timestamp),
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
  return {
    ret: ret(opts.status),
    txID,
    blockNumber: 77_000_000,
    block_timestamp: ts(opts.timestamp),
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
    },
  };
}

const TRC20_INFO = {
  USDT: {
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
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

export function trc20TransferTx(opts: {
  symbol: keyof typeof TRC20_INFO;
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
    // TronGrid API uses snake_case keys — disable camelcase for this object
    // eslint-disable-next-line camelcase
    transaction_id: txId,
    // eslint-disable-next-line camelcase
    token_info: { symbol: opts.symbol, ...TRC20_INFO[opts.symbol] },
    // eslint-disable-next-line camelcase
    block_timestamp: ts(opts.timestamp),
    from: opts.from,
    to: opts.to,
    type: 'Transfer',
    value: opts.amount,
    // eslint-disable-next-line camelcase
    final_result: STATUS_TO_CONTRACT_RET[opts.status],
  };
}

export function trc20ApproveTx(opts: {
  symbol: keyof typeof TRC20_INFO;
  amount: string;
  spender: string;
  status: TronTxStatus;
  timestamp?: number;
}) {
  const txId = deterministicTxId(
    `approve:${opts.symbol}:${opts.amount}:${opts.spender}`,
  );
  return {
    // eslint-disable-next-line camelcase
    transaction_id: txId,
    // eslint-disable-next-line camelcase
    token_info: { symbol: opts.symbol, ...TRC20_INFO[opts.symbol] },
    // eslint-disable-next-line camelcase
    block_timestamp: ts(opts.timestamp),
    from: TRON_ACCOUNT_ADDRESS,
    to: opts.spender,
    type: 'Approval',
    value: opts.amount,
    // eslint-disable-next-line camelcase
    final_result: STATUS_TO_CONTRACT_RET[opts.status],
  };
}

export function swapTx(opts: {
  srcSymbol: keyof typeof TRC20_INFO | 'TRX';
  srcAmount: string;
  destSymbol: keyof typeof TRC20_INFO | 'TRX';
  destAmount: string;
  status: TronTxStatus;
  timestamp?: number;
}) {
  const txID = deterministicTxId(
    `swap:${opts.srcSymbol}:${opts.srcAmount}:${opts.destSymbol}:${opts.destAmount}`,
  );
  return {
    ret: ret(opts.status),
    txID,
    blockNumber: 77_000_000,
    block_timestamp: ts(opts.timestamp),
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              owner_address: ownerHex(TRON_ACCOUNT_ADDRESS),
              contract_address: ownerHex(
                'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax', // SunSwap router
              ),
            },
            type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
          },
          type: 'TriggerSmartContract',
        },
      ],
      _meta: {
        kind: 'swap',
        srcSymbol: opts.srcSymbol,
        srcAmount: opts.srcAmount,
        destSymbol: opts.destSymbol,
        destAmount: opts.destAmount,
      },
    },
  };
}

export function bridgeTx(opts: {
  srcSymbol: keyof typeof TRC20_INFO | 'TRX';
  srcAmount: string;
  destChain: 'eip155:1' | 'eip155:8453';
  status: TronTxStatus;
  timestamp?: number;
}) {
  const txID = deterministicTxId(
    `bridge:${opts.srcSymbol}:${opts.srcAmount}:${opts.destChain}`,
  );
  return {
    ret: ret(opts.status),
    txID,
    blockNumber: 77_000_000,
    block_timestamp: ts(opts.timestamp),
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              owner_address: ownerHex(TRON_ACCOUNT_ADDRESS),
              contract_address: ownerHex(
                'TGcKuvbwSenkbX5GzjeVsYFXmAHm8gXqgL', // bridge router
              ),
            },
            type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
          },
          type: 'TriggerSmartContract',
        },
      ],
      _meta: {
        kind: 'bridge',
        srcSymbol: opts.srcSymbol,
        srcAmount: opts.srcAmount,
        destChain: opts.destChain,
      },
    },
  };
}

export function freezeV2Tx(opts: {
  amountSun: number;
  status: TronTxStatus;
  timestamp?: number;
}) {
  const txID = deterministicTxId(`freeze:${opts.amountSun}`);
  return {
    ret: ret(opts.status),
    txID,
    blockNumber: 77_000_000,
    block_timestamp: ts(opts.timestamp),
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              owner_address: ownerHex(TRON_ACCOUNT_ADDRESS),
              frozen_balance: opts.amountSun,
              resource: 'ENERGY',
            },
            type_url: 'type.googleapis.com/protocol.FreezeBalanceV2Contract',
          },
          type: 'FreezeBalanceV2Contract',
        },
      ],
    },
  };
}

export function unfreezeV2Tx(opts: {
  amountSun: number;
  status: TronTxStatus;
  timestamp?: number;
}) {
  const txID = deterministicTxId(`unfreeze:${opts.amountSun}`);
  return {
    ret: ret(opts.status),
    txID,
    blockNumber: 77_000_000,
    block_timestamp: ts(opts.timestamp),
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              owner_address: ownerHex(TRON_ACCOUNT_ADDRESS),
              unfreeze_balance: opts.amountSun,
              resource: 'ENERGY',
            },
            type_url: 'type.googleapis.com/protocol.UnfreezeBalanceV2Contract',
          },
          type: 'UnfreezeBalanceV2Contract',
        },
      ],
    },
  };
}
