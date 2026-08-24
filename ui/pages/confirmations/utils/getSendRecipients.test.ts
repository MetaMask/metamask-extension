import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { getSendRecipients } from './getSendRecipients';

const FROM_ADDRESS = '0x0987654321098765432109876543210987654321';
const TOKEN_CONTRACT = '0x1234567890123456789012345678901234567890';
const TOKEN_RECIPIENT = '0x1234cccccccccccccccccccccccccccccccc9abc';

const TRANSFER_DATA = `0xa9059cbb000000000000000000000000${TOKEN_RECIPIENT.slice(
  2,
)}0000000000000000000000000000000000000000000000000000000000000064`;

function buildTransactionMeta({
  data,
  swapAndSendRecipient,
  to = TOKEN_CONTRACT,
  type,
  nestedTransactions,
  txParamsOriginal,
}: {
  data?: string;
  nestedTransactions?: {
    data?: string;
    to?: string;
    type?: TransactionType;
  }[];
  swapAndSendRecipient?: string;
  to?: string;
  txParamsOriginal?: { from: string; to: string };
  type?: TransactionType;
}) {
  return {
    chainId: '0x1' as const,
    id: 'test-tx',
    networkClientId: 'mainnet',
    status: 'unapproved' as const,
    time: 1,
    txParams: {
      from: FROM_ADDRESS,
      to,
      ...(data ? { data } : {}),
    },
    ...(txParamsOriginal ? { txParamsOriginal } : {}),
    ...(swapAndSendRecipient ? { swapAndSendRecipient } : {}),
    ...(nestedTransactions ? { nestedTransactions } : {}),
    type,
  } as TransactionMeta;
}

describe('getSendRecipients', () => {
  it('returns the native recipient for simple sends', () => {
    expect(
      getSendRecipients(
        buildTransactionMeta({
          to: TOKEN_RECIPIENT,
          type: TransactionType.simpleSend,
        }),
      ),
    ).toEqual([TOKEN_RECIPIENT]);
  });

  it('prefers txParamsOriginal.to when container wrapping replaced the recipient', () => {
    expect(
      getSendRecipients(
        buildTransactionMeta({
          to: TOKEN_CONTRACT,
          type: TransactionType.simpleSend,
          txParamsOriginal: {
            from: FROM_ADDRESS,
            to: TOKEN_RECIPIENT,
          },
        }),
      ),
    ).toEqual([TOKEN_RECIPIENT]);
  });

  it('returns the decoded payee for token transfers and ignores the token contract', () => {
    expect(
      getSendRecipients(
        buildTransactionMeta({
          data: TRANSFER_DATA,
          type: TransactionType.tokenMethodTransfer,
        }),
      ).map((address) => address.toLowerCase()),
    ).toEqual([TOKEN_RECIPIENT]);
  });

  it('returns no recipients for approve transactions', () => {
    expect(
      getSendRecipients(
        buildTransactionMeta({
          data: '0x095ea7b3000000000000000000000000cccccccccccccccccccccccccccccccccccccccc0000000000000000000000000000000000000000000000000000000000000001',
          type: TransactionType.tokenMethodApprove,
        }),
      ),
    ).toEqual([]);
  });

  it('returns no recipients for contract interactions', () => {
    expect(
      getSendRecipients(
        buildTransactionMeta({
          data: TRANSFER_DATA,
          type: TransactionType.contractInteraction,
        }),
      ),
    ).toEqual([]);
  });

  it('returns swapAndSendRecipient for swap-and-send transactions', () => {
    expect(
      getSendRecipients(
        buildTransactionMeta({
          data: TRANSFER_DATA,
          swapAndSendRecipient: TOKEN_RECIPIENT,
          type: TransactionType.swapAndSend,
        }),
      ),
    ).toEqual([TOKEN_RECIPIENT]);
  });

  it('includes nested send payees from a batch and ignores nested approves', () => {
    const nestedSendRecipient = '0x1234dddddddddddddddddddddddddddddddd9abc';

    expect(
      getSendRecipients(
        buildTransactionMeta({
          data: '0xdeadbeef',
          nestedTransactions: [
            {
              to: nestedSendRecipient,
              type: TransactionType.simpleSend,
            },
            {
              to: TOKEN_CONTRACT,
              type: TransactionType.tokenMethodApprove,
            },
          ],
          type: TransactionType.batch,
        }),
      ),
    ).toEqual([nestedSendRecipient]);
  });
});
