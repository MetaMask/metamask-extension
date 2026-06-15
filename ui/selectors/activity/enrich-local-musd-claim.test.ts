import { Interface } from '@ethersproject/abi';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mapLocalTransaction } from '../../../shared/lib/activity/adapters/local-transaction';
import { toAssetId } from '../../../shared/lib/asset-utils';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import type { TransactionGroup } from '../../../shared/lib/multichain/types';
import {
  DISTRIBUTOR_CLAIM_ABI,
  MERKL_DISTRIBUTOR_ADDRESS,
  MUSD_TOKEN_ADDRESS,
} from '../../components/app/musd/constants';
import {
  enrichLocalMusdClaimActivity,
  resolveMusdClaimAmount,
} from './enrich-local-musd-claim';

const MOCK_USER = '0x1234567890abcdef1234567890abcdef12345678';
const from = '0x9bed78535d6a03a955f1504aadba974d9a29e292';
const lineaMusd = MUSD_TOKEN_ADDRESS;
const merklDistributor = MERKL_DISTRIBUTOR_ADDRESS;

const ERC20_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function encodeClaimData(
  amount: string,
  user = from,
  token = lineaMusd,
): string {
  const iface = new Interface(DISTRIBUTOR_CLAIM_ABI);
  return iface.encodeFunctionData('claim', [
    [user],
    [token],
    [amount],
    [['0x0000000000000000000000000000000000000000000000000000000000000001']],
  ]);
}

function padAddress(addr: string): string {
  return `0x${addr.slice(2).padStart(64, '0')}`.toLowerCase();
}

type MusdClaimTransactionFixture = {
  chainId: TransactionMeta['chainId'];
  id: string;
  hash?: string;
  status: TransactionMeta['status'];
  time?: number;
  type: TransactionType.musdClaim;
  txParams: NonNullable<TransactionMeta['txParams']>;
  transferInformation?: TransactionMeta['transferInformation'];
  txReceipt?: TransactionMeta['txReceipt'];
};

function mapMusdClaimGroup(
  transaction: MusdClaimTransactionFixture,
): ReturnType<typeof enrichLocalMusdClaimActivity> {
  const fullTransaction = {
    networkClientId: 'linea-mainnet',
    ...transaction,
  } as TransactionGroup['initialTransaction'];

  const transactionGroup = {
    hasCancelled: false,
    hasRetried: false,
    initialTransaction: fullTransaction,
    nonce: '0x1',
    primaryTransaction: fullTransaction,
    transactions: [fullTransaction],
  } as unknown as TransactionGroup;

  const activity = enrichLocalMusdClaimActivity(
    mapLocalTransaction(transactionGroup),
    transactionGroup,
  );
  const result = { ...activity };
  delete result.raw;
  return result;
}

describe('resolveMusdClaimAmount', () => {
  it('prefers transferInformation over calldata', () => {
    expect(
      resolveMusdClaimAmount({
        data: encodeClaimData('9000000'),
        transferInformation: { amount: '1234567' },
      }),
    ).toBe('1234567');
  });

  it('uses receipt logs when transfer information is missing', () => {
    const distributorPadded = padAddress(MERKL_DISTRIBUTOR_ADDRESS);
    const userPadded = padAddress(MOCK_USER);
    const logs = [
      {
        address: MUSD_TOKEN_ADDRESS,
        topics: [ERC20_TRANSFER_TOPIC, distributorPadded, userPadded],
        data: '0x4c4b40',
      },
    ];

    expect(
      resolveMusdClaimAmount({
        data: encodeClaimData('9000000', MOCK_USER),
        from: MOCK_USER,
        txReceipt: { logs },
      }),
    ).toBe('5000000');
  });

  it('falls back to calldata total for pending claims', () => {
    expect(
      resolveMusdClaimAmount({
        data: encodeClaimData('5000000', MOCK_USER),
        from: MOCK_USER,
      }),
    ).toBe('5000000');
  });
});

describe('enrichLocalMusdClaimActivity', () => {
  it('attaches mUSD token metadata from calldata for pending claims', () => {
    const activity = mapMusdClaimGroup({
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
        data: encodeClaimData('5000000'),
      },
    });

    expect(activity).toStrictEqual({
      type: 'claimMusdBonus',
      chainId: 'eip155:59144',
      status: 'pending',
      timestamp: 1778633325000,
      data: {
        hash: '0xmusdclaim',
        token: {
          amount: '5000000',
          direction: 'in',
          symbol: 'mUSD',
          decimals: 6,
          assetId: toAssetId(lineaMusd, 'eip155:59144'),
        },
      },
    });
  });

  it('uses receipt logs for the payout amount when confirmed', () => {
    const distributorPadded = padAddress(merklDistributor);
    const userPadded = padAddress(from);
    const activity = mapMusdClaimGroup({
      chainId: CHAIN_IDS.LINEA_MAINNET,
      id: 'musd-claim-receipt-id',
      hash: '0xmusdclaimreceipt',
      status: TransactionStatus.confirmed,
      time: 1778633450000,
      type: TransactionType.musdClaim,
      txParams: {
        from,
        to: merklDistributor,
        value: '0x0',
        data: encodeClaimData('9000000'),
      },
      txReceipt: {
        logs: [
          {
            address: lineaMusd,
            topics: [ERC20_TRANSFER_TOPIC, distributorPadded, userPadded],
            data: '0x4c4b40',
          },
        ],
      } as unknown as TransactionMeta['txReceipt'],
    });

    expect(activity.data).toMatchObject({
      token: {
        amount: '5000000',
        direction: 'in',
        symbol: 'mUSD',
        decimals: 6,
        assetId: toAssetId(lineaMusd, 'eip155:59144'),
      },
    });
  });

  it('uses transferInformation for the claimed amount', () => {
    const activity = mapMusdClaimGroup({
      chainId: CHAIN_IDS.LINEA_MAINNET,
      id: 'musd-claim-confirmed-id',
      hash: '0xmusdclaimconfirmed',
      status: TransactionStatus.confirmed,
      time: 1778633400000,
      type: TransactionType.musdClaim,
      transferInformation: {
        amount: '5000000',
        contractAddress: lineaMusd,
        decimals: 6,
        symbol: 'mUSD',
      },
      txParams: {
        from,
        to: merklDistributor,
        value: '0x0',
        data: encodeClaimData('5000000'),
      },
    });

    expect(activity).toStrictEqual({
      type: 'claimMusdBonus',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1778633400000,
      data: {
        hash: '0xmusdclaimconfirmed',
        token: {
          amount: '5000000',
          direction: 'in',
          symbol: 'mUSD',
          decimals: 6,
          assetId: toAssetId(lineaMusd, 'eip155:59144'),
        },
      },
    });
  });

  it('falls back to the canonical mUSD address when calldata is missing', () => {
    const activity = mapMusdClaimGroup({
      chainId: CHAIN_IDS.LINEA_MAINNET,
      id: 'musd-claim-no-data-id',
      hash: '0xmusdclaimnodata',
      status: TransactionStatus.submitted,
      time: 1778633500000,
      type: TransactionType.musdClaim,
      txParams: {
        from,
        to: merklDistributor,
        value: '0x0',
      },
    });

    expect(activity).toMatchObject({
      type: 'claimMusdBonus',
      data: {
        token: {
          direction: 'in',
          symbol: 'mUSD',
          decimals: 6,
          assetId: toAssetId(lineaMusd, 'eip155:59144'),
        },
      },
    });
  });

  it('returns non-mUSD activity items unchanged', () => {
    const transaction = {
      chainId: CHAIN_IDS.MAINNET,
      id: 'send-id',
      hash: '0xsend',
      status: TransactionStatus.submitted,
      time: 1716367781000,
      type: TransactionType.simpleSend,
      txParams: {
        from,
        to: '0x80181d3ba89220cdb80234fc7aa19d5cc56229cc',
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

    const mapped = mapLocalTransaction(transactionGroup);
    const enriched = enrichLocalMusdClaimActivity(mapped, transactionGroup);

    expect(enriched).toBe(mapped);
  });

  it('does not change API-indexed claimMusdBonus activities', () => {
    const apiActivity = {
      type: 'claimMusdBonus' as const,
      chainId: 'eip155:59144' as const,
      status: 'success' as const,
      timestamp: 1,
      raw: {
        type: 'apiEvmTransaction' as const,
        data: {},
      },
      data: {
        hash: '0xapi',
        token: {
          direction: 'in' as const,
          symbol: 'mUSD',
          amount: '1',
        },
      },
    } as unknown as ActivityListItem;

    const transactionGroup = {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: {},
      nonce: '0x0',
      primaryTransaction: {},
      transactions: [],
    } as unknown as TransactionGroup;

    expect(enrichLocalMusdClaimActivity(apiActivity, transactionGroup)).toBe(
      apiActivity,
    );
  });
});
