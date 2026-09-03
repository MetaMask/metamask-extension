import {
  MUSD_TOKEN_ADDRESS,
  MUSD_TOKEN_ASSET_ID_BY_CHAIN,
} from '@metamask/money-account-utils';
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
const TELLER_ADDRESS = '0x4444444444444444444444444444444444444444';
// approve(teller, 5 mUSD)
const MUSD_APPROVE_DATA =
  '0x095ea7b3000000000000000000000000444444444444444444444444444444444444444400000000000000000000000000000000000000000000000000000000004c4b40';
// transfer(recipient, 5 mUSD)
const MUSD_TRANSFER_DATA =
  '0xa9059cbb000000000000000000000000222222222222222222222222222222222222222200000000000000000000000000000000000000000000000000000000004c4b40';

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

  function buildMoneyDepositGroup(
    overrides: Partial<TransactionMeta> = {},
  ): ReturnType<typeof buildTokenTransferGroup> {
    return buildTokenTransferGroup({
      type: TransactionType.batch,
      txParams: {
        from: '0x1111111111111111111111111111111111111111',
        to: '0x1111111111111111111111111111111111111111',
        data: '0x',
        value: '0x0',
      },
      nestedTransactions: [
        {
          type: TransactionType.tokenMethodApprove,
          to: MUSD_TOKEN_ADDRESS,
          data: MUSD_APPROVE_DATA,
        },
        { type: TransactionType.moneyAccountDeposit, to: TELLER_ADDRESS },
      ],
      requiredAssets: [
        { address: MUSD_TOKEN_ADDRESS, amount: '0x4c4b40', standard: 'erc20' },
      ],
      ...overrides,
    });
  }

  function buildContractInteractionActivity(): ActivityListItem {
    return {
      type: 'contractInteraction',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: {
        from: '0x1111111111111111111111111111111111111111',
        to: '0x1111111111111111111111111111111111111111',
      },
    } as ActivityListItem;
  }

  it('maps a money account deposit batch to a moneyAccountDeposit', () => {
    const group = buildMoneyDepositGroup();

    const enriched = enrichLocalActivity(
      buildContractInteractionActivity(),
      group,
    );

    expect(enriched).toMatchObject({
      type: 'moneyAccountDeposit',
      data: {
        from: '0x1111111111111111111111111111111111111111',
        fiat: { amount: '5' },
        token: {
          direction: 'in',
          symbol: 'mUSD',
          decimals: 6,
          amount: '5000000',
          assetId: MUSD_TOKEN_ASSET_ID_BY_CHAIN[CHAIN_IDS.MAINNET],
        },
      },
    });
  });

  it('falls back to the approve calldata amount when required assets hold the placeholder', () => {
    const group = buildMoneyDepositGroup({
      requiredAssets: [
        { address: MUSD_TOKEN_ADDRESS, amount: '0x0', standard: 'erc20' },
      ],
    });

    const enriched = enrichLocalActivity(
      buildContractInteractionActivity(),
      group,
    );

    expect(enriched.type).toBe('moneyAccountDeposit');
    expect(enriched.data).toMatchObject({
      fiat: { amount: '5' },
      token: { amount: '5000000' },
    });
  });

  it('falls back to the MM Pay target fiat while the batch is still a placeholder', () => {
    const group = buildMoneyDepositGroup({
      nestedTransactions: [
        {
          type: TransactionType.tokenMethodApprove,
          to: MUSD_TOKEN_ADDRESS,
          data: REVOKE_DATA,
        },
        { type: TransactionType.moneyAccountDeposit, to: TELLER_ADDRESS },
      ],
      requiredAssets: [
        { address: MUSD_TOKEN_ADDRESS, amount: '0x0', standard: 'erc20' },
      ],
      metamaskPay: { targetFiat: '25' },
    });

    const enriched = enrichLocalActivity(
      buildContractInteractionActivity(),
      group,
    );

    expect(enriched.type).toBe('moneyAccountDeposit');
    expect(enriched.data).toMatchObject({ fiat: { amount: '25' } });
    expect(
      (enriched.data as { token?: { amount?: string } }).token,
    ).not.toHaveProperty('amount');
  });

  it('omits the amount and fiat while the batch is still a placeholder', () => {
    const group = buildMoneyDepositGroup({
      nestedTransactions: [
        {
          type: TransactionType.tokenMethodApprove,
          to: MUSD_TOKEN_ADDRESS,
          data: REVOKE_DATA,
        },
        { type: TransactionType.moneyAccountDeposit, to: TELLER_ADDRESS },
      ],
      requiredAssets: [
        { address: MUSD_TOKEN_ADDRESS, amount: '0x0', standard: 'erc20' },
      ],
    });

    const enriched = enrichLocalActivity(
      buildContractInteractionActivity(),
      group,
    );

    expect(enriched.type).toBe('moneyAccountDeposit');
    expect(enriched.data).not.toHaveProperty('fiat');
    expect(
      (enriched.data as { token?: { amount?: string } }).token,
    ).not.toHaveProperty('amount');
  });

  it('maps a money account withdraw batch to a moneyAccountWithdraw', () => {
    const group = buildTokenTransferGroup({
      type: TransactionType.batch,
      txParams: {
        from: '0x1111111111111111111111111111111111111111',
        to: '0x3333333333333333333333333333333333333333',
        data: '0x',
        value: '0x0',
      },
      nestedTransactions: [
        { type: TransactionType.moneyAccountWithdraw, data: '0x00' },
        {
          type: TransactionType.tokenMethodTransfer,
          to: MUSD_TOKEN_ADDRESS,
          data: MUSD_TRANSFER_DATA,
        },
      ],
    });
    const activity = {
      type: 'contractInteraction',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: {
        from: '0x1111111111111111111111111111111111111111',
        to: '0x3333333333333333333333333333333333333333',
      },
    } as ActivityListItem;

    const enriched = enrichLocalActivity(activity, group);

    expect(enriched).toMatchObject({
      type: 'moneyAccountWithdraw',
      data: {
        from: '0x1111111111111111111111111111111111111111',
        fiat: { amount: '5' },
        token: {
          direction: 'out',
          symbol: 'mUSD',
          decimals: 6,
          amount: '5000000',
          assetId: MUSD_TOKEN_ASSET_ID_BY_CHAIN[CHAIN_IDS.MAINNET],
        },
      },
    });
  });

  it('omits the amount for a withdraw placeholder with no encoded transfer', () => {
    const group = buildTokenTransferGroup({
      type: TransactionType.batch,
      txParams: {
        from: '0x1111111111111111111111111111111111111111',
        to: '0x3333333333333333333333333333333333333333',
        data: '0x',
        value: '0x0',
      },
      nestedTransactions: [
        { type: TransactionType.moneyAccountWithdraw, data: '0x00' },
        {
          type: TransactionType.tokenMethodTransfer,
          to: MUSD_TOKEN_ADDRESS,
          data: '0x',
        },
      ],
    });

    const enriched = enrichLocalActivity(
      buildContractInteractionActivity(),
      group,
    );

    expect(enriched.type).toBe('moneyAccountWithdraw');
    expect(enriched.data).not.toHaveProperty('fiat');
    expect(enriched.data).toMatchObject({ token: { symbol: 'mUSD' } });
    expect(enriched.data).not.toMatchObject({
      token: { amount: expect.anything() },
    });
  });

  it('omits the amount for a withdraw batch with no nested transfer at all', () => {
    const group = buildTokenTransferGroup({
      type: TransactionType.batch,
      txParams: {
        from: '0x1111111111111111111111111111111111111111',
        to: '0x3333333333333333333333333333333333333333',
        data: '0x',
        value: '0x0',
      },
      nestedTransactions: [
        { type: TransactionType.moneyAccountWithdraw, data: '0x00' },
      ],
    });

    const enriched = enrichLocalActivity(
      buildContractInteractionActivity(),
      group,
    );

    expect(enriched.type).toBe('moneyAccountWithdraw');
    expect(enriched.data).not.toMatchObject({
      token: { amount: expect.anything() },
    });
  });

  it('ignores a zero-amount approve when resolving the deposit amount', () => {
    const group = buildMoneyDepositGroup({
      requiredAssets: [],
      nestedTransactions: [
        {
          type: TransactionType.tokenMethodApprove,
          to: MUSD_TOKEN_ADDRESS,
          data: `0x095ea7b3${'0'.repeat(64)}${'0'.repeat(64)}`,
        },
        { type: TransactionType.moneyAccountDeposit, to: TELLER_ADDRESS },
      ],
    } as never);

    const enriched = enrichLocalActivity(
      buildContractInteractionActivity(),
      group,
    );

    expect(enriched.type).toBe('moneyAccountDeposit');
    expect(enriched.data).not.toMatchObject({
      token: { amount: expect.anything() },
    });
  });

  it('ignores a zero required amount and falls back to the approve calldata', () => {
    const group = buildMoneyDepositGroup({
      requiredAssets: [
        { address: MUSD_TOKEN_ADDRESS, amount: '0x0', standard: 'erc20' },
      ],
    } as never);

    const enriched = enrichLocalActivity(
      buildContractInteractionActivity(),
      group,
    );

    expect(enriched.type).toBe('moneyAccountDeposit');
    expect(enriched.data).toMatchObject({ token: { amount: '5000000' } });
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
