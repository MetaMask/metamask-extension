import type { TransactionMeta } from '@metamask/transaction-controller';
import { Interface } from '@ethersproject/abi';
import {
  DISTRIBUTOR_CLAIM_ABI,
  MERKL_DISTRIBUTOR_ADDRESS,
  MUSD_TOKEN_ADDRESS,
} from '../../components/app/musd/constants';
import {
  extractTransactionAmount,
  decodeMerklClaimParams,
  getClaimPayoutFromReceipt,
} from './transaction-amount-utils';

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

const MOCK_USER = '0x1234567890abcdef1234567890abcdef12345678';
const MOCK_TOKEN = MUSD_TOKEN_ADDRESS;

function encodeClaimData(
  amount: string,
  user = MOCK_USER,
  token = MOCK_TOKEN,
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

const ERC20_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// ---------------------------------------------------------------------------
// extractTransactionAmount
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// decodeMerklClaimParams
// ---------------------------------------------------------------------------

describe('decodeMerklClaimParams', () => {
  it('decodes valid claim calldata', () => {
    const data = encodeClaimData('5000000');
    const result = decodeMerklClaimParams(data);

    expect(result).not.toBeNull();
    expect(result?.totalAmount).toBe('5000000');
    expect(result?.userAddress.toLowerCase()).toBe(MOCK_USER.toLowerCase());
    expect(result?.tokenAddress.toLowerCase()).toBe(MOCK_TOKEN.toLowerCase());
  });

  it('returns null for undefined data', () => {
    expect(decodeMerklClaimParams(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(decodeMerklClaimParams('')).toBeNull();
  });

  it('returns null for invalid calldata', () => {
    expect(decodeMerklClaimParams('0xdeadbeef')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(decodeMerklClaimParams(42 as unknown as string)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getClaimPayoutFromReceipt
// ---------------------------------------------------------------------------

describe('getClaimPayoutFromReceipt', () => {
  const distributorPadded = padAddress(MERKL_DISTRIBUTOR_ADDRESS);
  const userPadded = padAddress(MOCK_USER);

  it('extracts payout from a matching Transfer event', () => {
    const logs = [
      {
        address: MUSD_TOKEN_ADDRESS,
        topics: [ERC20_TRANSFER_TOPIC, distributorPadded, userPadded],
        data: '0x4c4b40', // 5_000_000
      },
    ];

    const result = getClaimPayoutFromReceipt(logs, MOCK_USER);
    expect(result).toBe('5000000');
  });

  it('returns null when no logs match', () => {
    const logs = [
      {
        address: '0x0000000000000000000000000000000000000001',
        topics: [ERC20_TRANSFER_TOPIC, distributorPadded, userPadded],
        data: '0x4c4b40',
      },
    ];

    expect(getClaimPayoutFromReceipt(logs, MOCK_USER)).toBeNull();
  });

  it('returns null when logs array is empty', () => {
    expect(getClaimPayoutFromReceipt([], MOCK_USER)).toBeNull();
  });

  it('returns null when logs are undefined', () => {
    expect(getClaimPayoutFromReceipt(undefined, MOCK_USER)).toBeNull();
  });

  it('returns null when userAddress is undefined', () => {
    const logs = [
      {
        address: MUSD_TOKEN_ADDRESS,
        topics: [ERC20_TRANSFER_TOPIC, distributorPadded, userPadded],
        data: '0x4c4b40',
      },
    ];

    expect(getClaimPayoutFromReceipt(logs, undefined)).toBeNull();
  });

  it('skips logs without enough topics', () => {
    const logs = [
      {
        address: MUSD_TOKEN_ADDRESS,
        topics: [ERC20_TRANSFER_TOPIC],
        data: '0x4c4b40',
      },
    ];

    expect(getClaimPayoutFromReceipt(logs, MOCK_USER)).toBeNull();
  });

  it('skips logs where from is not the distributor', () => {
    const otherSender = padAddress(
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    );
    const logs = [
      {
        address: MUSD_TOKEN_ADDRESS,
        topics: [ERC20_TRANSFER_TOPIC, otherSender, userPadded],
        data: '0x4c4b40',
      },
    ];

    expect(getClaimPayoutFromReceipt(logs, MOCK_USER)).toBeNull();
  });

  it('skips logs where to is not the user', () => {
    const otherRecipient = padAddress(
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    );
    const logs = [
      {
        address: MUSD_TOKEN_ADDRESS,
        topics: [ERC20_TRANSFER_TOPIC, distributorPadded, otherRecipient],
        data: '0x4c4b40',
      },
    ];

    expect(getClaimPayoutFromReceipt(logs, MOCK_USER)).toBeNull();
  });

  it('handles topics as a string (returns null per normalizeTopics)', () => {
    const logs = [
      {
        address: MUSD_TOKEN_ADDRESS,
        topics: 'not-an-array',
        data: '0x4c4b40',
      },
    ];

    expect(getClaimPayoutFromReceipt(logs, MOCK_USER)).toBeNull();
  });
});
