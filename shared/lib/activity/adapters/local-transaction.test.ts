import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../constants/network';
import type { TransactionGroup } from '../../multichain/types';
import { mapLocalTransaction } from './local-transaction';

const from = '0x9bed78535d6a03a955f1504aadba974d9a29e292';
const to = '0x80181d3ba89220cdb80234fc7aa19d5cc56229cc';

describe('mapLocalTransaction', () => {
  it('maps a pending native send to a Send activity', () => {
    const transaction = {
      chainId: CHAIN_IDS.MAINNET,
      id: 'send-id',
      hash: '0xsend',
      status: TransactionStatus.submitted,
      time: 1716367781000,
      type: TransactionType.simpleSend,
      txParams: {
        from,
        to,
        value: '0x1',
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nonce: '0x1',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction(transactionGroup);
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'send',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1716367781000,
      metaId: 'send-id',
      data: {
        hash: '0xsend',
        from,
        to,
        token: {
          amount: '0x1',
          assetId: 'eip155:1/slip44:60',
          decimals: 18,
          direction: 'out',
          symbol: 'ETH',
        },
      },
    });
  });

  it('maps a custom network native send without bridge native asset metadata', () => {
    const customChainId = '0x53a';
    const transaction = {
      chainId: customChainId,
      id: 'custom-send-id',
      hash: '0xcustomsend',
      status: TransactionStatus.confirmed,
      time: 1779392463306,
      type: TransactionType.simpleSend,
      txParams: {
        from,
        to,
        value: '0x1',
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nativeAssetSymbol: 'ETH',
      nonce: '0x1',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction(transactionGroup);
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'send',
      chainId: 'eip155:1338',
      status: 'success',
      timestamp: 1779392463306,
      data: {
        hash: '0xcustomsend',
        from,
        to,
        token: {
          amount: '0x1',
          direction: 'out',
          symbol: 'ETH',
        },
      },
    });
  });

  it('maps a USDC transfer with transferInformation', () => {
    const tokenContractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const recipient = '0x50A9D56C2B8BA9A5c7f2C08C3d26E0499F23a706';
    const transaction = {
      chainId: CHAIN_IDS.MAINNET,
      id: 'token-send-id',
      hash: '0xtokensend',
      status: TransactionStatus.submitted,
      time: 1716367781000,
      transferInformation: {
        amount: '20000',
        contractAddress: tokenContractAddress,
        decimals: 6,
        symbol: 'USDC',
      },
      type: TransactionType.tokenMethodTransfer,
      txParams: {
        from,
        to: tokenContractAddress,
        data: '0xa9059cbb00000000000000000000000050a9d56c2b8ba9a5c7f2c08c3d26e0499f23a7060000000000000000000000000000000000000000000000000000000000004e20',
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nonce: '0x1',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction(transactionGroup);
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'send',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1716367781000,
      metaId: 'token-send-id',
      data: {
        hash: '0xtokensend',
        from,
        to: recipient,
        token: {
          amount: '20000',
          assetId: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          decimals: 6,
          direction: 'out',
          symbol: 'USDC',
        },
      },
    });
  });

  it('maps a USDT transfer without transferInformation', () => {
    const tokenContractAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';
    const recipient = '0xa6372EDD08c857870f9c245A17eE6895307957d5';
    const transaction = {
      chainId: CHAIN_IDS.MAINNET,
      id: 'usdt-send-id',
      hash: '0x41f675c4a384e5064b1d9620934b0ff5e8a84f5c84530a25d025e27fb784d303',
      status: TransactionStatus.confirmed,
      time: 1779392463306,
      type: TransactionType.tokenMethodTransfer,
      txParams: {
        from,
        to: tokenContractAddress,
        value: '0x0',
        data: '0xa9059cbb000000000000000000000000a6372edd08c857870f9c245a17ee6895307957d500000000000000000000000000000000000000000000000000000000000186a0',
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nonce: '0x1',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction(transactionGroup);
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'send',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1779392463306,
      data: {
        hash: '0x41f675c4a384e5064b1d9620934b0ff5e8a84f5c84530a25d025e27fb784d303',
        from,
        to: recipient,
        token: {
          amount: '100000',
          assetId: 'eip155:1/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7',
          decimals: 6,
          direction: 'out',
          symbol: 'USDT',
        },
      },
    });
  });

  it('leaves unknown token transfer symbols blank', () => {
    const tokenContractAddress = '0x1111111111111111111111111111111111111111';
    const transaction = {
      chainId: CHAIN_IDS.MAINNET,
      id: 'unknown-token-send-id',
      hash: '0xunknown',
      status: TransactionStatus.confirmed,
      time: 1779392463306,
      type: TransactionType.tokenMethodTransfer,
      txParams: {
        from,
        to: tokenContractAddress,
        value: '0x0',
        data: '0xa9059cbb000000000000000000000000a6372edd08c857870f9c245a17ee6895307957d500000000000000000000000000000000000000000000000000000000000186a0',
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nonce: '0x1',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction(transactionGroup);

    expect(item.type).toBe('send');
    if (item.type !== 'send') {
      throw new Error(`Expected send item, got ${item.type}`);
    }

    expect(item.data.token).toStrictEqual({
      amount: '100000',
      assetId: 'eip155:1/erc20:0x1111111111111111111111111111111111111111',
      direction: 'out',
    });
  });

  it('uses the original transaction type and primary transaction status', () => {
    const initialTransaction = {
      chainId: CHAIN_IDS.LINEA_MAINNET,
      id: 'approve-id',
      hash: '0xapprove',
      status: TransactionStatus.submitted,
      time: 1716367781000,
      transferInformation: {
        contractAddress: '0x239fd4b0c4db49fa8660e65b97619d43d0e0a79d',
        decimals: 0,
        symbol: 'TDN',
      },
      type: TransactionType.tokenMethodApprove,
      txParams: {
        from,
        to: '0x239fd4b0c4db49fa8660e65b97619d43d0e0a79d',
        data: '0xa22cb465',
      },
    };
    const primaryTransaction = {
      ...initialTransaction,
      id: 'retry-id',
      hash: '0xretry',
      status: TransactionStatus.approved,
      time: 1716367881000,
      type: TransactionType.retry,
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: true,
      initialTransaction,
      nonce: '0x2',
      primaryTransaction,
      transactions: [initialTransaction, primaryTransaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction(transactionGroup);
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'approveSpendingCap',
      chainId: 'eip155:59144',
      status: 'pending',
      timestamp: 1716367881000,
      metaId: 'retry-id',
      data: {
        hash: '0xretry',
        token: {
          assetId:
            'eip155:59144/erc20:0x239FD4B0c4DB49Fa8660E65B97619D43D0E0A79d',
          direction: 'out',
          symbol: 'TDN',
        },
      },
    });
  });

  it('maps bridge history token data to a local swap', () => {
    const transaction = {
      chainId: CHAIN_IDS.MAINNET,
      id: 'bridge-swap-id',
      hash: '0xbridgeswap',
      status: TransactionStatus.confirmed,
      time: 1779392463306,
      type: TransactionType.swap,
      txParams: {
        from,
        to: '0xaca92e438df0b2401ff60da7e4337b687a2435da',
        value: '0x0',
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nonce: '0x3',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction({
      ...transactionGroup,
      sourceToken: {
        amount: '10000000000000',
        assetId: 'eip155:1/slip44:60',
        decimals: 18,
        direction: 'out',
        symbol: 'ETH',
      },
      destinationToken: {
        amount: '19546',
        assetId: 'eip155:1/erc20:0xACa92e438df0B2401fF60Da7E4337B687a2435dA',
        decimals: 6,
        direction: 'in',
        symbol: 'MUSD',
      },
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'swap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1779392463306,
      data: {
        hash: '0xbridgeswap',
        sourceToken: {
          amount: '10000000000000',
          assetId: 'eip155:1/slip44:60',
          decimals: 18,
          direction: 'out',
          symbol: 'ETH',
        },
        destinationToken: {
          amount: '19546',
          assetId: 'eip155:1/erc20:0xACa92e438df0B2401fF60Da7E4337B687a2435dA',
          decimals: 6,
          direction: 'in',
          symbol: 'MUSD',
        },
      },
    });
  });

  it('uses a bridge history activity status override', () => {
    const transaction = {
      chainId: CHAIN_IDS.MAINNET,
      id: 'bridge-id',
      hash: '0xbridge',
      status: TransactionStatus.confirmed,
      time: 1779392463306,
      type: TransactionType.bridge,
      txParams: {
        from,
        to,
        value: '0x0',
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nonce: '0x3',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction({
      ...transactionGroup,
      activityStatus: 'failed',
    });

    expect(item.status).toBe('failed');
  });

  it('maps swap metadata token symbols to a Swap activity', () => {
    const transaction = {
      chainId: CHAIN_IDS.BASE,
      id: 'swap-id',
      hash: '0xswap',
      status: TransactionStatus.confirmed,
      time: 1716367781000,
      swapMetaData: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_from: 'ETH',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_to: 'USDC',
      },
      type: TransactionType.swap,
      txParams: {
        from,
        to: '0x9dda6ef3d919c9bc8885d5560999a3640431e8e6',
        value: '0x246139ca8000',
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nonce: '0x3',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction(transactionGroup);
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'swap',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1716367781000,
      metaId: 'swap-id',
      data: {
        hash: '0xswap',
        sourceToken: {
          assetId: 'eip155:8453/slip44:60',
          direction: 'out',
          symbol: 'ETH',
        },
        destinationToken: {
          direction: 'in',
          symbol: 'USDC',
        },
      },
    });
  });

  it('maps a native value contract interaction with an outgoing token', () => {
    const transaction = {
      chainId: CHAIN_IDS.MAINNET,
      id: 'contract-interaction-id',
      hash: '0xcontract',
      status: TransactionStatus.confirmed,
      time: 1716367781000,
      type: TransactionType.contractInteraction,
      txParams: {
        from,
        to,
        value: '0x3782dace9d900000',
        data: '0xd0e30db0',
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nonce: '0x4',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction(transactionGroup);
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'contractInteraction',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1716367781000,
      data: {
        hash: '0xcontract',
        from,
        to,
        token: {
          amount: '0x3782dace9d900000',
          assetId: 'eip155:1/slip44:60',
          decimals: 18,
          direction: 'out',
          symbol: 'ETH',
        },
        methodId: '0xd0e30db0',
        transactionType: TransactionType.contractInteraction,
      },
    });
  });
});
