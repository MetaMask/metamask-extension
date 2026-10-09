/* eslint-disable @typescript-eslint/naming-convention */
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '../../../../../shared/constants/app';
import { MMPAY_RPC_TYPES } from '../../mmpay-rpc/types/registry';
import type { MmPayRpcTypeDefinition } from '../../mmpay-rpc/types';
import { getMmPayRpcMetricsProperties } from './mmpay-rpc';
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

describe('mmpay-rpc builder', () => {
  beforeEach(() => {
    MMPAY_RPC_TYPES.perpsDeposit = {} as MmPayRpcTypeDefinition;
  });

  afterEach(() => {
    delete MMPAY_RPC_TYPES.perpsDeposit;
  });

  it('adds mm_pay_rpc and mm_pay_rpc_origin for a dApp transaction of a wallet_mmPay type', async () => {
    expect(await getMmPayRpcMetricsProperties(buildRequest({}))).toStrictEqual({
      properties: { mm_pay_rpc: true, mm_pay_rpc_origin: ORIGIN },
      sensitiveProperties: {},
    });
  });

  it('ignores internal transactions of a wallet_mmPay type', async () => {
    expect(
      await getMmPayRpcMetricsProperties(buildRequest({ isInternal: true })),
    ).toStrictEqual(EMPTY);
  });

  it('ignores MetaMask-originated transactions of a wallet_mmPay type', async () => {
    expect(
      await getMmPayRpcMetricsProperties(
        buildRequest({ origin: ORIGIN_METAMASK }),
      ),
    ).toStrictEqual(EMPTY);
  });

  it('ignores dApp transactions of other types', async () => {
    expect(
      await getMmPayRpcMetricsProperties(
        buildRequest({ type: TransactionType.simpleSend }),
      ),
    ).toStrictEqual(EMPTY);
  });

  it('ignores types that are not registered', async () => {
    delete MMPAY_RPC_TYPES.perpsDeposit;

    expect(await getMmPayRpcMetricsProperties(buildRequest({}))).toStrictEqual(
      EMPTY,
    );
  });
});
