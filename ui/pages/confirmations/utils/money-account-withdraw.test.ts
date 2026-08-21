import {
  generateEIP7702BatchTransaction,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';

import {
  applyWithdrawCalldata,
  asFundedWithdrawUpdate,
  asWithdrawTransactionToApprove,
  getTransferAmountRawFromData,
  hasFundedWithdrawCalldata,
  isEncodedCalldata,
  withFundedBatchCalldata,
} from './money-account-withdraw';

const FROM = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' as Hex;
const TELLER_ADDRESS = '0x1111111111111111111111111111111111111111' as Hex;
const MUSD_ADDRESS = '0x3333333333333333333333333333333333333333' as Hex;
const WITHDRAW_DATA = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
const PLACEHOLDER_DATA = '0xemptyexecute';
const FUNDED_TRANSFER_DATA =
  '0xa9059cbb0000000000000000000000002222222222222222222222222222222222222222000000000000000000000000000000000000000000000000000000000000c350' as Hex;
const ZERO_TRANSFER_DATA =
  '0xa9059cbb00000000000000000000000022222222222222222222222222222222222222220000000000000000000000000000000000000000000000000000000000000000' as Hex;

const PLACEHOLDER_NESTED = [
  { to: TELLER_ADDRESS, data: '0x' as Hex },
  { to: MUSD_ADDRESS, data: '0x' as Hex },
] as TransactionMeta['nestedTransactions'];

const FUNDED_NESTED = [
  { to: TELLER_ADDRESS, data: WITHDRAW_DATA },
  { to: MUSD_ADDRESS, data: FUNDED_TRANSFER_DATA },
] as TransactionMeta['nestedTransactions'];

function buildTransaction(
  nestedTransactions?: TransactionMeta['nestedTransactions'],
): TransactionMeta {
  return {
    id: 'tx-1',
    type: TransactionType.batch,
    txParams: { from: FROM, to: FROM, data: PLACEHOLDER_DATA },
    nestedTransactions,
  } as unknown as TransactionMeta;
}

describe('money-account-withdraw', () => {
  describe('isEncodedCalldata', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [undefined, false],
      ['', false],
      ['0x', false],
      ['0x00', false],
      ['0xa9059cbb', false],
      [WITHDRAW_DATA, true],
    ])('returns %s -> %s', (data: string | undefined, expected: boolean) => {
      expect(isEncodedCalldata(data)).toBe(expected);
    });
  });

  describe('getTransferAmountRawFromData', () => {
    it('decodes the amount argument of a transfer', () => {
      expect(getTransferAmountRawFromData(FUNDED_TRANSFER_DATA)).toBe('50000');
    });

    it('decodes a zero amount', () => {
      expect(getTransferAmountRawFromData(ZERO_TRANSFER_DATA)).toBe('0');
    });

    it('returns undefined for missing data', () => {
      expect(getTransferAmountRawFromData(undefined)).toBeUndefined();
    });

    it('returns undefined when the selector is not a transfer', () => {
      expect(
        getTransferAmountRawFromData(`0xdeadbeef${'0'.repeat(128)}`),
      ).toBeUndefined();
    });

    it('returns undefined when the calldata is too short', () => {
      expect(getTransferAmountRawFromData('0xa9059cbb00')).toBeUndefined();
    });

    it('returns undefined when the amount word is not hex', () => {
      expect(
        getTransferAmountRawFromData(`0xa9059cbb${'z'.repeat(128)}`),
      ).toBeUndefined();
    });
  });

  describe('hasFundedWithdrawCalldata', () => {
    it('returns true when both nested calls encode a non-zero amount', () => {
      expect(hasFundedWithdrawCalldata(buildTransaction(FUNDED_NESTED))).toBe(
        true,
      );
    });

    it('returns false for the unencoded placeholder', () => {
      expect(
        hasFundedWithdrawCalldata(buildTransaction(PLACEHOLDER_NESTED)),
      ).toBe(false);
    });

    it('returns false when the transfer amount is zero', () => {
      expect(
        hasFundedWithdrawCalldata(
          buildTransaction([
            { to: TELLER_ADDRESS, data: WITHDRAW_DATA },
            { to: MUSD_ADDRESS, data: ZERO_TRANSFER_DATA },
          ] as TransactionMeta['nestedTransactions']),
        ),
      ).toBe(false);
    });

    it('returns false when there is no transaction', () => {
      expect(hasFundedWithdrawCalldata(undefined)).toBe(false);
    });
  });

  describe('asFundedWithdrawUpdate', () => {
    it('returns the update when it is funded', () => {
      expect(
        asFundedWithdrawUpdate({
          withdrawData: WITHDRAW_DATA,
          transferData: FUNDED_TRANSFER_DATA,
          transactionData: PLACEHOLDER_DATA,
        }),
      ).toStrictEqual({
        withdrawData: WITHDRAW_DATA,
        transferData: FUNDED_TRANSFER_DATA,
        transactionData: PLACEHOLDER_DATA,
      });
    });

    it('defaults transactionData to undefined when absent', () => {
      expect(
        asFundedWithdrawUpdate({
          withdrawData: WITHDRAW_DATA,
          transferData: FUNDED_TRANSFER_DATA,
        }),
      ).toStrictEqual({
        withdrawData: WITHDRAW_DATA,
        transferData: FUNDED_TRANSFER_DATA,
        transactionData: undefined,
      });
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      ['false', false],
      ['null', null],
      ['a string', 'nope'],
      ['a partial object', { withdrawData: WITHDRAW_DATA }],
      [
        'unencoded withdraw data',
        { withdrawData: '0x', transferData: FUNDED_TRANSFER_DATA },
      ],
      [
        'a zero transfer',
        { withdrawData: WITHDRAW_DATA, transferData: ZERO_TRANSFER_DATA },
      ],
      [
        'an undecodable transfer',
        { withdrawData: WITHDRAW_DATA, transferData: '0x' },
      ],
    ])('returns undefined for %s', (_label: string, value: unknown) => {
      expect(asFundedWithdrawUpdate(value)).toBeUndefined();
    });
  });

  describe('asWithdrawTransactionToApprove', () => {
    it('clones the transaction and retypes it as a withdraw', () => {
      const transaction = buildTransaction(FUNDED_NESTED);

      const result = asWithdrawTransactionToApprove(transaction);

      expect(result).not.toBe(transaction);
      expect(result.type).toBe(TransactionType.moneyAccountWithdraw);
      expect(transaction.type).toBe(TransactionType.batch);
    });
  });

  describe('withFundedBatchCalldata', () => {
    it('rebuilds the parent execute calldata from the nested calls', () => {
      const result = withFundedBatchCalldata(buildTransaction(FUNDED_NESTED));

      const expected = generateEIP7702BatchTransaction(
        FROM,
        FUNDED_NESTED ?? [],
      );
      expect(result?.txParams.to).toBe(expected.to ?? FROM);
      expect(result?.txParams.data).toBe(expected.data);
      expect(result?.txParams.data).not.toBe(PLACEHOLDER_DATA);
      expect(result?.type).toBe(TransactionType.moneyAccountWithdraw);
    });

    it('returns null when the nested calls are not funded', () => {
      expect(
        withFundedBatchCalldata(buildTransaction(PLACEHOLDER_NESTED)),
      ).toBeNull();
    });

    it('returns null when there is no transaction', () => {
      expect(withFundedBatchCalldata(undefined)).toBeNull();
    });
  });

  describe('applyWithdrawCalldata', () => {
    const update = {
      withdrawData: WITHDRAW_DATA,
      transferData: FUNDED_TRANSFER_DATA,
    };

    it('patches nested calldata and rebuilds the parent execute', () => {
      const result = applyWithdrawCalldata(
        buildTransaction(PLACEHOLDER_NESTED),
        update,
      );

      expect(result?.nestedTransactions?.[0].data).toBe(WITHDRAW_DATA);
      expect(result?.nestedTransactions?.[1].data).toBe(FUNDED_TRANSFER_DATA);
      expect(result?.txParams.data).not.toBe(PLACEHOLDER_DATA);
    });

    it('does not mutate the source transaction', () => {
      const transaction = buildTransaction(PLACEHOLDER_NESTED);

      applyWithdrawCalldata(transaction, update);

      expect(transaction.nestedTransactions?.[0].data).toBe('0x');
    });

    it('returns null when there is no transaction', () => {
      expect(applyWithdrawCalldata(undefined, update)).toBeNull();
    });

    it('returns null when the nested calls are missing', () => {
      expect(applyWithdrawCalldata(buildTransaction([]), update)).toBeNull();
    });

    it('returns null when the update is not funded', () => {
      expect(
        applyWithdrawCalldata(buildTransaction(PLACEHOLDER_NESTED), {
          withdrawData: WITHDRAW_DATA,
          transferData: ZERO_TRANSFER_DATA,
        }),
      ).toBeNull();
    });
  });
});
