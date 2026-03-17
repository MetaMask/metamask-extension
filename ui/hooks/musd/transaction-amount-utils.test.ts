import type { TransactionMeta } from '@metamask/transaction-controller';
import { extractTransactionAmount } from './transaction-amount-utils';

jest.mock('../../../shared/lib/transaction.utils', () => ({
  parseStandardTokenTransactionData: jest.fn(),
}));

const { parseStandardTokenTransactionData } = jest.requireMock(
  '../../../shared/lib/transaction.utils',
);

const makeTx = (overrides: Partial<TransactionMeta> = {}): TransactionMeta =>
  ({
    id: 'tx-1',
    status: 'submitted',
    txParams: { to: '0x1', from: '0x2' },
    ...overrides,
  }) as unknown as TransactionMeta;

describe('extractTransactionAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    parseStandardTokenTransactionData.mockReturnValue(undefined);
  });

  it('extracts amount from parsed ERC-20 args._value', () => {
    parseStandardTokenTransactionData.mockReturnValue({
      args: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _value: BigInt('5000000'),
      },
    });

    const tx = makeTx({ txParams: { to: '0x1', from: '0x2', data: '0xabc' } });

    expect(extractTransactionAmount(tx)).toBe('5000000');
  });

  it('falls back to txParams.value when data parsing throws', () => {
    jest.spyOn(console, 'error').mockImplementation();
    parseStandardTokenTransactionData.mockImplementation(() => {
      throw new Error('bad data');
    });

    const tx = makeTx({
      txParams: { to: '0x1', from: '0x2', data: '0xbad', value: '0x3e8' },
    });

    expect(extractTransactionAmount(tx)).toBe('1000');
  });

  it('falls back to txParams.value when data has no _value arg', () => {
    parseStandardTokenTransactionData.mockReturnValue({ args: {} });

    const tx = makeTx({
      txParams: { to: '0x1', from: '0x2', data: '0xabc', value: '0x64' },
    });

    expect(extractTransactionAmount(tx)).toBe('100');
  });

  it('returns undefined when there is no data and no value', () => {
    const tx = makeTx({ txParams: { to: '0x1', from: '0x2' } });

    expect(extractTransactionAmount(tx)).toBeUndefined();
  });

  it('returns undefined when txParams.data is absent and txParams.value is absent', () => {
    const tx = makeTx();

    expect(extractTransactionAmount(tx)).toBeUndefined();
  });

  it('handles BigInt _value correctly', () => {
    parseStandardTokenTransactionData.mockReturnValue({
      args: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _value: BigInt('123456789012345678'),
      },
    });

    const tx = makeTx({ txParams: { to: '0x1', from: '0x2', data: '0xabc' } });

    expect(extractTransactionAmount(tx)).toBe('123456789012345678');
  });
});
