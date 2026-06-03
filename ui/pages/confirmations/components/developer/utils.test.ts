import type { Hex } from '@metamask/utils';
import { parseStandardTokenTransactionData } from '../../../../../shared/lib/transaction.utils';
import { generateERC20TransferData } from './utils';

const MOCK_RECIPIENT = '0x1234567890123456789012345678901234567890' as Hex;
const TRANSFER_SELECTOR = '0xa9059cbb';

describe('generateERC20TransferData', () => {
  it('starts with the ERC-20 `transfer(address,uint256)` selector', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '1', 6);

    expect(data.startsWith(TRANSFER_SELECTOR)).toBe(true);
    expect(data).toMatch(/^0x[0-9a-f]+$/iu);
  });

  it('encodes the recipient address left-padded to 32 bytes', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '0', 6);

    const recipientWithoutPrefix = MOCK_RECIPIENT.toLowerCase().slice(2);
    expect(data.toLowerCase()).toContain(
      `000000000000000000000000${recipientWithoutPrefix}`,
    );
  });

  it('encodes a zero amount as 32 bytes of zeros (developer-scaffold case)', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '0', 6);

    expect(data).toBe(
      `${TRANSFER_SELECTOR}` +
        `000000000000000000000000${MOCK_RECIPIENT.slice(
          2,
        ).toLowerCase()}0000000000000000000000000000000000000000000000000000000000000000`,
    );
  });

  it('scales a whole amount by the token decimals (1 USDC → 1_000_000)', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '1', 6);
    const parsed = parseStandardTokenTransactionData(data);

    expect(parsed?.name).toBe('transfer');
    expect(parsed?.args?.[1]?.toString()).toBe('1000000');
  });

  it('scales a fractional amount by the token decimals (0.5 USDC → 500_000)', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '0.5', 6);
    const parsed = parseStandardTokenTransactionData(data);

    expect(parsed?.args?.[1]?.toString()).toBe('500000');
  });

  it('scales by 10^decimals for 18-decimal tokens (2 MUSD → 2e18)', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '2', 18);
    const parsed = parseStandardTokenTransactionData(data);

    expect(parsed?.args?.[1]?.toString()).toBe('2000000000000000000');
  });

  it('round-trips the recipient through parseStandardTokenTransactionData', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '1', 6);
    const parsed = parseStandardTokenTransactionData(data);

    expect(parsed?.args?.[0]?.toLowerCase()).toBe(MOCK_RECIPIENT.toLowerCase());
  });
});
