/* eslint-disable @typescript-eslint/naming-convention */
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { getWalletPayMetricsProperties } from './wallet-pay';
import { createBuilderRequest } from './test-utils';

const ORIGIN = 'https://perps-terminal.metamask.com';
const EMPTY = { properties: {}, sensitiveProperties: {} };

function buildRequest(overrides: Partial<TransactionMeta>) {
  return createBuilderRequest({
    transactionMeta: {
      ...createBuilderRequest().transactionMeta,
      origin: ORIGIN,
      type: TransactionType.perpsDeposit,
      ...overrides,
    } as TransactionMeta,
  });
}

describe('wallet-pay builder', () => {
  it('adds mm_pay_rpc and mm_pay_rpc_origin for a non-internal Pay transaction', async () => {
    expect(await getWalletPayMetricsProperties(buildRequest({}))).toStrictEqual(
      {
        properties: { mm_pay_rpc: true, mm_pay_rpc_origin: ORIGIN },
        sensitiveProperties: {},
      },
    );
  });

  it('adds the properties for a nested Pay transaction', async () => {
    expect(
      (
        await getWalletPayMetricsProperties(
          buildRequest({
            type: TransactionType.batch,
            nestedTransactions: [{ type: TransactionType.perpsWithdraw }],
          }),
        )
      ).properties.mm_pay_rpc,
    ).toBe(true);
  });

  it('ignores internal Pay transactions', async () => {
    expect(
      await getWalletPayMetricsProperties(buildRequest({ isInternal: true })),
    ).toStrictEqual(EMPTY);
  });

  it('ignores non-Pay dApp transactions', async () => {
    expect(
      await getWalletPayMetricsProperties(
        buildRequest({ type: TransactionType.simpleSend }),
      ),
    ).toStrictEqual(EMPTY);
  });
});
