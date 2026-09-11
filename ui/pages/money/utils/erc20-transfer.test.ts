import { TransactionType } from '@metamask/transaction-controller';
import {
  decodeErc20Transfer,
  ERC20_TRANSFER_FROM_SELECTOR,
  ERC20_TRANSFER_SELECTOR,
} from './erc20-transfer';

const RECIPIENT = '0x2222222222222222222222222222222222222222';
const SENDER = '0x1111111111111111111111111111111111111111';

function padAddress(address: string): string {
  return address.slice(2).toLowerCase().padStart(64, '0');
}

function padAmount(amount: bigint): string {
  return amount.toString(16).padStart(64, '0');
}

function transferCalldata(recipient: string, amount: bigint): string {
  return `${ERC20_TRANSFER_SELECTOR}${padAddress(recipient)}${padAmount(amount)}`;
}

function transferFromCalldata(
  sender: string,
  recipient: string,
  amount: bigint,
): string {
  return `${ERC20_TRANSFER_FROM_SELECTOR}${padAddress(sender)}${padAddress(
    recipient,
  )}${padAmount(amount)}`;
}

describe('decodeErc20Transfer', () => {
  it('decodes transfer recipient and amount', () => {
    expect(
      decodeErc20Transfer(
        transferCalldata(RECIPIENT, 1_000_000n),
        TransactionType.tokenMethodTransfer,
      ),
    ).toStrictEqual({
      recipient: RECIPIENT,
      amount: '1000000',
    });
  });

  it('decodes transferFrom recipient and amount', () => {
    expect(
      decodeErc20Transfer(
        transferFromCalldata(SENDER, RECIPIENT, 5n),
        TransactionType.tokenMethodTransferFrom,
      ),
    ).toStrictEqual({
      recipient: RECIPIENT,
      amount: '5',
    });
  });

  it('returns undefined when the amount slot is missing', () => {
    const incomplete = `${ERC20_TRANSFER_SELECTOR}${padAddress(RECIPIENT)}`;
    expect(
      decodeErc20Transfer(incomplete, TransactionType.tokenMethodTransfer),
    ).toBeUndefined();
  });

  it('returns undefined when calldata is empty', () => {
    expect(
      decodeErc20Transfer(undefined, TransactionType.tokenMethodTransfer),
    ).toBeUndefined();
  });
});
