import { TransactionType } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  CHAIN_ID,
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from './contract-interaction';

export const INCREASE_ALLOWANCE_TRANSACTION_DATA =
  '0x395093510000000000000000000000002e0d7e8c45221fca00d74a3609a0f7097035d09b0000000000000000000000000000000000000000000000000000000000000123';

export const genUnapprovedSetApprovalForAllConfirmation = ({
  address = CONTRACT_INTERACTION_SENDER_ADDRESS,
  chainId = CHAIN_ID,
}: {
  address?: Hex;
  chainId?: string;
} = {}) => ({
  ...genUnapprovedContractInteractionConfirmation({ chainId }),
  txParams: {
    from: address,
    data: '0xa22cb4650000000000000000000000002e0d7e8c45221fca00d74a3609a0f7097035d09b0000000000000000000000000000000000000000000000000000000000000001',
    gas: '0x16a92',
    to: '0x076146c765189d51be3160a2140cf80bfc73ad68',
    value: '0x0',
    maxFeePerGas: '0x5b06b0c0d',
    maxPriorityFeePerGas: '0x59682f00',
  },
  gasLimitNoBuffer: '0x16a92',
  type: TransactionType.tokenMethodSetApprovalForAll,
});
