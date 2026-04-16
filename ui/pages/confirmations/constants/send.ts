import { TransactionType } from '@metamask/transaction-controller';

export enum SendPages {
  ASSET = 'asset',
  AMOUNTRECIPIENT = 'amount-recipient',
  LOADER = 'loader',
}

export const SEND_TRANSACTION_TYPES = [
  TransactionType.simpleSend,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
];
