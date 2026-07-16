import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import type { TransactionGroup } from '../../../shared/lib/multichain/types';
import { enrichLocalActivity } from './enrich-local-activity';

const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
const RECIPIENT = '0x2222222222222222222222222222222222222222';
const TRANSFER_DATA =
  '0xa9059cbb00000000000000000000000022222222222222222222222222222222222222220000000000000000000000000000000000000000000000008ac7230489e80000';
const REVOKE_DATA =
  '0x095ea7b300000000000000000000000022222222222222222222222222222222222222220000000000000000000000000000000000000000000000000000000000000000';

function buildTokenTransferGroup(
  overrides: Partial<TransactionMeta> = {},
): TransactionGroup & {
  contractTokenMetadata?: { symbol?: string; decimals?: number };
} {
  const transaction = {
    id: '1',
    chainId: CHAIN_IDS.MAINNET,
    status: TransactionStatus.confirmed,
    type: TransactionType.tokenMethodTransfer,
    time: Date.now(),
    txParams: {
      from: '0x1111111111111111111111111111111111111111',
      to: DAI_ADDRESS,
      data: TRANSFER_DATA,
      value: '0x0',
    },
    ...overrides,
  } as TransactionMeta;

  return {
    nonce: '0x1',
    hasCancelled: false,
    hasRetried: false,
    initialTransaction: transaction,
    primaryTransaction: transaction,
    transactions: [transaction],
    contractTokenMetadata: { symbol: 'DAI', decimals: 18 },
  };
}

describe('enrichLocalActivity', () => {
  it('fills token send amount and recipient from calldata', () => {
    const group = buildTokenTransferGroup();
    const activity = {
      type: 'send',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: {
        from: '0x1111111111111111111111111111111111111111',
        to: DAI_ADDRESS,
        token: {
          direction: 'out',
          assetId: `eip155:1/erc20:${DAI_ADDRESS}`,
        },
      },
    } as ActivityListItem;

    const enriched = enrichLocalActivity(activity, group);

    expect(enriched.data).toMatchObject({
      to: RECIPIENT,
      token: {
        direction: 'out',
        symbol: 'DAI',
        decimals: 18,
        amount: '10000000000000000000',
      },
    });
  });

  it('keeps existing transferInformation amount', () => {
    const group = buildTokenTransferGroup({
      transferInformation: {
        contractAddress: DAI_ADDRESS,
        decimals: 18,
        symbol: 'DAI',
        amount: '123',
      },
    });
    const activity = {
      type: 'send',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: {
        from: '0x1111111111111111111111111111111111111111',
        to: DAI_ADDRESS,
        token: { direction: 'out' },
      },
    } as ActivityListItem;

    const enriched = enrichLocalActivity(activity, group);

    expect(enriched.data).toMatchObject({
      token: { amount: '123', symbol: 'DAI', decimals: 18 },
    });
  });

  it('maps zero-amount approve to revokeSpendingCap', () => {
    const group = buildTokenTransferGroup({
      type: TransactionType.tokenMethodApprove,
      txParams: {
        from: '0x1111111111111111111111111111111111111111',
        to: DAI_ADDRESS,
        data: REVOKE_DATA,
        value: '0x0',
      },
    });
    const activity = {
      type: 'approveSpendingCap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: {
        from: '0x1111111111111111111111111111111111111111',
        token: { direction: 'out', symbol: 'DAI' },
      },
    } as ActivityListItem;

    const enriched = enrichLocalActivity(activity, group);

    expect(enriched.type).toBe('revokeSpendingCap');
  });

  it('does not change unrelated activity items', () => {
    const group = buildTokenTransferGroup({
      type: TransactionType.simpleSend,
      txParams: {
        from: '0x1111111111111111111111111111111111111111',
        to: RECIPIENT,
        value: '0x1',
      },
    });
    const activity = {
      type: 'send',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: {
        from: '0x1111111111111111111111111111111111111111',
        to: RECIPIENT,
        token: { direction: 'out', symbol: 'ETH', amount: '1', decimals: 18 },
      },
    } as ActivityListItem;

    expect(enrichLocalActivity(activity, group)).toBe(activity);
  });
});
