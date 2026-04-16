import { TransactionType } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  CHAIN_ID,
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from './contract-interaction';

export const TRANSFER_FROM_TRANSACTION_DATA =
  '0x23b872dd0000000000000000000000002e0D7E8c45221FcA00d74a3609A0f7097035d09B0000000000000000000000002e0D7E8c45221FcA00d74a3609A0f7097035d09C0000000000000000000000000000000000000000000000000000000000000123';

export const genUnapprovedTokenTransferConfirmation = ({
  address = CONTRACT_INTERACTION_SENDER_ADDRESS,
  chainId = CHAIN_ID,
  isWalletInitiatedConfirmation = false,
  amountHex = '0000000000000000000000000000000000000000000000000000000000000001',
}: {
  address?: Hex;
  chainId?: string;
  isWalletInitiatedConfirmation?: boolean;
  amountHex?: string;
} = {}) => ({
  ...genUnapprovedContractInteractionConfirmation({ chainId }),
  txParams: {
    from: address,
    data: `0xa9059cbb0000000000000000000000002e0d7e8c45221fca00d74a3609a0f7097035d09b${amountHex}`,
    gas: '0x16a92',
    to: '0x076146c765189d51be3160a2140cf80bfc73ad68',
    value: '0x0',
    maxFeePerGas: '0x5b06b0c0d',
    maxPriorityFeePerGas: '0x59682f00',
  },
  gasLimitNoBuffer: '0x16a92',
  type: TransactionType.tokenMethodTransfer,
  origin: isWalletInitiatedConfirmation
    ? 'metamask'
    : 'https://metamask.github.io',
});
