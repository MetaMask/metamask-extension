import { Interface } from '@ethersproject/abi';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../constants/network';
import { WETH_CONTRACT_ADDRESS } from '../../../constants/swaps';
import { toAssetId } from '../../asset-utils';
import type { TransactionGroup } from '../../multichain/types';
import {
  buildApproveTransactionData,
  buildPermit2ApproveTransactionData,
} from '../../../../test/data/confirmations/token-approve';
import { localStateFixtures } from './fixtures/local-state';
import { mapLocalTransaction } from './local-transaction';

const from = '0x9bed78535d6a03a955f1504aadba974d9a29e292';
const to = '0x80181d3ba89220cdb80234fc7aa19d5cc56229cc';
const baseUsdc = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const baseAavePool = '0xa238dd80c259a72e81d7e4664a9801593f98d1c5';
const lineaDai = '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5';
const lineaMusd = '0xaca92e438df0b2401ff60da7e4337b687a2435da';
const merklDistributor = '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae';

const MERKL_CLAIM_ABI = [
  'function claim(address[] calldata users, address[] calldata tokens, uint256[] calldata amounts, bytes32[][] calldata proofs)',
];

function encodeMerklClaimCalldata({
  users = [from],
  tokens = [lineaMusd],
  amounts = ['5000000'],
  proofs = [[]],
}: {
  users?: string[];
  tokens?: string[];
  amounts?: string[];
  proofs?: string[][];
} = {}) {
  const contractInterface = new Interface(MERKL_CLAIM_ABI);

  return contractInterface.encodeFunctionData('claim', [
    users,
    tokens,
    amounts,
    proofs,
  ]);
}

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

    expect(item).toStrictEqual({
      type: 'send',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1716367781000,
      hash: '0xsend',
      data: {
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
        value: '0xde0b6b3a7640000',
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

    expect(item).toStrictEqual({
      type: 'send',
      chainId: 'eip155:1338',
      status: 'success',
      timestamp: 1779392463306,
      hash: '0xcustomsend',
      data: {
        from,
        to,
        token: {
          amount: '0xde0b6b3a7640000',
          decimals: 18,
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

    expect(item).toStrictEqual({
      type: 'send',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1716367781000,
      hash: '0xtokensend',
      data: {
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

    expect(item).toStrictEqual({
      type: 'send',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1779392463306,
      hash: '0x41f675c4a384e5064b1d9620934b0ff5e8a84f5c84530a25d025e27fb784d303',
      data: {
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

    expect(item).toStrictEqual({
      type: 'approveSpendingCap',
      chainId: 'eip155:59144',
      status: 'pending',
      timestamp: 1716367881000,
      hash: '0xretry',
      data: {
        from,
        token: {
          assetId:
            'eip155:59144/erc20:0x239FD4B0c4DB49Fa8660E65B97619D43D0E0A79d',
          direction: 'out',
          symbol: 'TDN',
        },
      },
    });
  });

  it('resolves Permit2 approval token address from calldata', () => {
    const permit2Address = '0x000000000022D473030F116dDEE9FD8b9aFE764ad8';
    const spender = '0x80181d3ba89220cdb80234fc7aa19d5cc56229cc';
    const transaction = {
      chainId: CHAIN_IDS.LINEA_MAINNET,
      id: 'permit2-approve-id',
      hash: '0xpermit2approve',
      status: TransactionStatus.confirmed,
      time: 1716367781000,
      type: TransactionType.tokenMethodApprove,
      txParams: {
        from,
        to: permit2Address,
        data: buildPermit2ApproveTransactionData(lineaMusd, spender, 1000, 123),
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

    const item = mapLocalTransaction({
      ...transactionGroup,
      contractTokenMetadata: { symbol: 'mUSD', decimals: 18 },
    });

    expect(item).toMatchObject({
      type: 'approveSpendingCap',
      data: {
        token: {
          direction: 'out',
          symbol: 'mUSD',
          assetId: toAssetId(lineaMusd, 'eip155:59144'),
        },
      },
    });
  });

  it('falls back to transferInformation when txParams.to is not a valid address', () => {
    const spender = '0x80181d3ba89220cdb80234fc7aa19d5cc56229cc';
    const transaction = {
      chainId: CHAIN_IDS.LINEA_MAINNET,
      id: 'invalid-to-approve-id',
      hash: '0xinvalidtoapprove',
      status: TransactionStatus.confirmed,
      time: 1716367781000,
      transferInformation: {
        contractAddress: lineaMusd,
        decimals: 18,
        symbol: 'mUSD',
      },
      type: TransactionType.tokenMethodApprove,
      txParams: {
        from,
        to: '0x23',
        data: buildApproveTransactionData(spender, 1000),
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nonce: '0x5',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction(transactionGroup);

    expect(item).toMatchObject({
      type: 'approveSpendingCap',
      data: {
        token: {
          direction: 'out',
          symbol: 'mUSD',
          assetId: toAssetId(lineaMusd, 'eip155:59144'),
        },
      },
    });
  });

  it('omits the approved amount for a token approve (mirrors the API path)', () => {
    const spender = '0x80181d3ba89220cdb80234fc7aa19d5cc56229cc';
    const transaction = {
      chainId: CHAIN_IDS.LINEA_MAINNET,
      id: 'approve-amount-id',
      hash: '0xapproveamount',
      status: TransactionStatus.confirmed,
      time: 1716367781000,
      type: TransactionType.tokenMethodApprove,
      txParams: {
        from,
        to: lineaMusd,
        data: buildApproveTransactionData(spender, 1000),
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nonce: '0x8',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction({
      ...transactionGroup,
      contractTokenMetadata: { symbol: 'mUSD', decimals: 18 },
    });

    expect(item).toMatchObject({
      type: 'approveSpendingCap',
      data: {
        token: {
          direction: 'out',
          symbol: 'mUSD',
          assetId: toAssetId(lineaMusd, 'eip155:59144'),
        },
      },
    });
    expect(
      item.type === 'approveSpendingCap' ? item.data.token?.amount : 'unset',
    ).toBeUndefined();
  });

  it('maps an mUSD conversion to a Convert activity', () => {
    const transaction = {
      chainId: CHAIN_IDS.LINEA_MAINNET,
      id: 'musd-conversion-id',
      hash: '0xmusdconversion',
      status: TransactionStatus.confirmed,
      time: 1779805800000,
      type: TransactionType.musdConversion,
      txParams: {
        from,
        to: lineaMusd,
        value: '0x0',
        data: '0xa9059cbb0000000000000000000000009bed78535d6a03a955f1504aadba974d9a29e2920000000000000000000000000000000000000000000000000000000000018703',
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
        assetId: toAssetId(lineaDai, 'eip155:59144'),
        decimals: 18,
        direction: 'out',
        symbol: 'DAI',
      },
    });

    expect(item).toStrictEqual({
      type: 'convert',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1779805800000,
      hash: '0xmusdconversion',
      data: {
        from,
        sourceToken: {
          assetId: toAssetId(lineaDai, 'eip155:59144'),
          decimals: 18,
          direction: 'out',
          symbol: 'DAI',
        },
        destinationToken: {
          amount: '100099',
          assetId: toAssetId(lineaMusd, 'eip155:59144'),
          decimals: 6,
          direction: 'in',
          symbol: 'mUSD',
        },
      },
    });
  });

  it('maps a Perps withdrawal local transaction to a Perps withdraw funds activity', () => {
    const transactionGroup = localStateFixtures.perpsWithdraw
      .transactionGroup as unknown as TransactionGroup;
    const item = mapLocalTransaction(transactionGroup);

    expect(item).toMatchObject({
      type: 'perpsWithdraw',
      chainId: 'eip155:42161',
      status: 'success',
      timestamp: 1780690942752,
      hash: '0xd5dbb4421d123fd16d16485c394a68b5a28d9b5da9d9973554258a9fd2e9ebf6',
      data: {
        fiat: {
          amount: '0.714705',
        },
        networkFee: {
          amount: '0',
        },
        token: {
          assetId: toAssetId(
            '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
            'eip155:42161',
          ),
          direction: 'out',
        },
      },
    });
  });

  it('maps a Perps deposit local transaction to a Perps add funds activity', () => {
    const transactionGroup = localStateFixtures.perpsDeposit
      .transactionGroup as unknown as TransactionGroup;
    const item = mapLocalTransaction(transactionGroup);

    expect(item).toMatchObject({
      type: 'perpsAddFunds',
      chainId: 'eip155:42161',
      status: 'success',
      timestamp: 1781185241609,
      hash: '0x3073fa67020abb1931ed043d7a8b6b020aa1004c9d0dd9ebd43ca5b9c10e9503',
      data: {
        fiat: {
          amount: '1.000169',
        },
        networkFee: {
          amount: '0.04143764111397638042',
        },
        token: {
          assetId: toAssetId(
            '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
            'eip155:42161',
          ),
          direction: 'out',
        },
      },
    });
  });

  it('maps an Aave supply contract interaction to a Lending deposit activity', () => {
    const transaction = {
      chainId: CHAIN_IDS.BASE,
      id: 'aave-supply-id',
      hash: '0x093844dd6200984f0e27d3c3a76b7a63b360bfb2136213237d693afd2cd69740',
      status: TransactionStatus.confirmed,
      time: 1779892154611,
      type: TransactionType.contractInteraction,
      txParams: {
        from,
        to: baseAavePool,
        value: '0x0',
        data: '0x617ba037000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000000000000000000000000000000000000000186a00000000000000000000000009bed78535d6a03a955f1504aadba974d9a29e2920000000000000000000000000000000000000000000000000000000000000000',
      },
      simulationData: {
        tokenBalanceChanges: [
          {
            address: baseUsdc,
            difference: '0x186a0',
            isDecrease: true,
            newBalance: '0x11284f',
            previousBalance: '0x12aeef',
            standard: 'erc20',
          },
          {
            address: '0x4e65fe4dba92790696d040ac24aa414708f5c0ab',
            difference: '0x1869f',
            isDecrease: false,
            newBalance: '0x65101',
            previousBalance: '0x4ca62',
            standard: 'erc20',
          },
        ],
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nonce: '0x210',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction(transactionGroup);

    expect(item).toStrictEqual({
      type: 'lendingDeposit',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1779892154611,
      hash: '0x093844dd6200984f0e27d3c3a76b7a63b360bfb2136213237d693afd2cd69740',
      data: {
        from,
      },
    });
  });

  it('maps a withdraw contract interaction from the received token transfer', () => {
    const transaction = {
      chainId: CHAIN_IDS.BASE,
      hash: '0x26f4911467b538702c0945e4ec5e303de44c0c1c174897141d1b548ea3161795',
      status: TransactionStatus.confirmed,
      time: 1779912434153,
      type: TransactionType.contractInteraction,
      txParams: {
        from,
        to: baseAavePool,
        data: '0x69328dec000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda029130000000000000000000000000000000000000000000000000000000000030d400000000000000000000000009bed78535d6a03a955f1504aadba974d9a29e292',
      },
      txReceipt: {
        logs: [
          {
            address: baseUsdc,
            data: '0x0000000000000000000000000000000000000000000000000000000000030d40',
            topics: [
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
              '0x0000000000000000000000004e65fe4dba92790696d040ac24aa414708f5c0ab',
              '0x0000000000000000000000009bed78535d6a03a955f1504aadba974d9a29e292',
            ],
          },
        ],
      },
    };
    const transactionGroup = {
      initialTransaction: transaction,
      primaryTransaction: transaction,
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction(transactionGroup);

    expect(item).toStrictEqual({
      type: 'lendingWithdrawal',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1779912434153,
      hash: '0x26f4911467b538702c0945e4ec5e303de44c0c1c174897141d1b548ea3161795',
      data: {
        from,
        destinationToken: {
          amount: '200000',
          assetId: toAssetId(baseUsdc, 'eip155:8453'),
          decimals: 6,
          direction: 'in',
          symbol: 'USDC',
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

    expect(item).toMatchObject({
      type: 'swap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1779392463306,
      hash: '0xbridgeswap',
      data: {
        from,
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

  it('maps a local bridge network fee from the transaction receipt', () => {
    const transaction = {
      chainId: CHAIN_IDS.ARBITRUM,
      id: 'bridge-fee-id',
      hash: '0xbridgefee',
      status: TransactionStatus.confirmed,
      time: 1779392463306,
      type: TransactionType.bridge,
      txParams: {
        from,
        to,
        value: '0x0',
      },
      txReceipt: {
        gasUsed: '0x24405',
        effectiveGasPrice: '0x6fc23ac1d',
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
        amount: '99130000000000',
        assetId: 'eip155:42161/slip44:60',
        decimals: 18,
        direction: 'out',
        symbol: 'ETH',
      },
      destinationToken: {
        amount: '141592',
        assetId:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/spl-token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        direction: 'in',
        symbol: 'USDC',
      },
    });

    expect(item).toMatchObject({
      type: 'bridge',
      data: {
        fees: [
          {
            type: 'base',
            amount: String(BigInt('0x24405') * BigInt('0x6fc23ac1d')),
            assetId: 'eip155:42161/slip44:60',
            decimals: 18,
            symbol: 'ETH',
          },
        ],
      },
    });
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

    expect(item).toMatchObject({
      type: 'swap',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1716367781000,
      hash: '0xswap',
      data: {
        from,
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

  it('maps a WETH9 deposit contract interaction to a Wrap activity', () => {
    const transaction = {
      chainId: CHAIN_IDS.MAINNET,
      id: 'wrap-id',
      hash: '0xwrap',
      status: TransactionStatus.confirmed,
      time: 1716367781000,
      type: TransactionType.contractInteraction,
      txParams: {
        from,
        to: WETH_CONTRACT_ADDRESS,
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

    expect(item).toStrictEqual({
      type: 'wrap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1716367781000,
      hash: '0xwrap',
      data: {
        from,
        sourceToken: {
          amount: '0x3782dace9d900000',
          assetId: 'eip155:1/slip44:60',
          decimals: 18,
          direction: 'out',
          symbol: 'ETH',
        },
        destinationToken: {
          amount: '0x3782dace9d900000',
          assetId: toAssetId(WETH_CONTRACT_ADDRESS, 'eip155:1'),
          decimals: 18,
          direction: 'in',
          symbol: 'WETH',
        },
      },
    });
  });

  it('maps a WETH9 withdraw contract interaction to an Unwrap activity', () => {
    const unwrapAmount = '1000000000000000000';
    const unwrapAmountHex = BigInt(unwrapAmount).toString(16).padStart(64, '0');
    const transaction = {
      chainId: CHAIN_IDS.MAINNET,
      id: 'unwrap-id',
      hash: '0xunwrap',
      status: TransactionStatus.confirmed,
      time: 1716367781000,
      type: TransactionType.contractInteraction,
      txParams: {
        from,
        to: WETH_CONTRACT_ADDRESS,
        value: '0x0',
        data: `0x2e1a7d4d${unwrapAmountHex}`,
      },
    };
    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: transaction,
      nonce: '0x5',
      primaryTransaction: transaction,
      transactions: [transaction],
    } as unknown as TransactionGroup;

    const item = mapLocalTransaction(transactionGroup);

    expect(item).toStrictEqual({
      type: 'unwrap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1716367781000,
      hash: '0xunwrap',
      data: {
        from,
        sourceToken: {
          amount: unwrapAmount,
          assetId: toAssetId(WETH_CONTRACT_ADDRESS, 'eip155:1'),
          decimals: 18,
          direction: 'out',
          symbol: 'WETH',
        },
        destinationToken: {
          amount: unwrapAmount,
          assetId: 'eip155:1/slip44:60',
          decimals: 18,
          direction: 'in',
          symbol: 'ETH',
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

    expect(item).toStrictEqual({
      type: 'contractInteraction',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1716367781000,
      hash: '0xcontract',
      data: {
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

  it('maps a local contract interaction with an incoming NFT simulation change to an NFT buy', () => {
    const item = mapLocalTransaction(
      localStateFixtures.nftPurchaseErc1155
        .transactionGroup as unknown as TransactionGroup,
    );

    expect(item).toStrictEqual({
      type: 'nftBuy',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1780606867763,
      hash: '0x2fda37c5b591c30367649c3c317621429bb5c59ff6a77b0a8cd48b56897168bc',
      data: {
        from,
        token: {
          direction: 'in',
        },
      },
    });
  });

  it('maps musdClaim to claimMusdBonus with from address', () => {
    const transaction = {
      chainId: CHAIN_IDS.LINEA_MAINNET,
      id: 'musd-claim-id',
      hash: '0xmusdclaim',
      status: TransactionStatus.submitted,
      time: 1778633325000,
      type: TransactionType.musdClaim,
      txParams: {
        from,
        to: merklDistributor,
        value: '0x0',
        data: encodeMerklClaimCalldata(),
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

    expect(item).toMatchObject({
      type: 'claimMusdBonus',
      chainId: 'eip155:59144',
      status: 'pending',
      timestamp: 1778633325000,
      hash: '0xmusdclaim',
      data: {
        from,
      },
    });
  });
});
