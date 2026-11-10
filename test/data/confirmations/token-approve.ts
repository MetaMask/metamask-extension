import { TransactionType } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { Interface } from '@ethersproject/abi';
import {
  CHAIN_ID,
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from './contract-interaction';

export function buildApproveTransactionData(
  address: string,
  amountOrTokenId: number,
): Hex {
  return new Interface([
    'function approve(address spender, uint256 amountOrTokenId)',
  ]).encodeFunctionData('approve', [address, amountOrTokenId]) as Hex;
}

export function buildPermit2ApproveTransactionData(
  token: string,
  spender: string,
  amount: number,
  expiration: number,
): Hex {
  return new Interface([
    'function approve(address token, address spender, uint160 amount, uint48 nonce)',
  ]).encodeFunctionData('approve', [token, spender, amount, expiration]) as Hex;
}

export function buildIncreaseAllowanceTransactionData(
  address: string,
  amount: number,
): Hex {
  return new Interface([
    'function increaseAllowance(address spender, uint256 addedValue)',
  ]).encodeFunctionData('increaseAllowance', [address, amount]) as Hex;
}

export function buildIncreaseApprovalTransactionData(
  address: string,
  amount: number,
): Hex {
  return new Interface([
    'function increaseApproval(address _spender, uint256 _addedValue)',
  ]).encodeFunctionData('increaseApproval', [address, amount]) as Hex;
}

export const genUnapprovedApproveConfirmation = ({
  address = CONTRACT_INTERACTION_SENDER_ADDRESS,
  chainId = CHAIN_ID,
  amountHex = '0000000000000000000000000000000000000000000000000000000000000001',
}: {
  address?: Hex;
  chainId?: string;
  amountHex?: string;
} = {}) => ({
  ...genUnapprovedContractInteractionConfirmation({ chainId }),
  txParams: {
    from: address,
    data: `0x095ea7b30000000000000000000000002e0d7e8c45221fca00d74a3609a0f7097035d09b${amountHex}`,
    gas: '0x16a92',
    to: '0x076146c765189d51be3160a2140cf80bfc73ad68',
    value: '0x0',
    maxFeePerGas: '0x5b06b0c0d',
    maxPriorityFeePerGas: '0x59682f00',
  },
  gasLimitNoBuffer: '0x16a92',
  type: TransactionType.tokenMethodApprove,
});

export const PERMIT2_CONTRACT_ADDRESS =
  '0x000000000022D473030F116dDEE9F6B43aC78BA3';
export const PERMIT2_TOKEN_ADDRESS =
  '0x1111111111111111111111111111111111111111';
export const PERMIT2_SPENDER_ADDRESS =
  '0x2222222222222222222222222222222222222222';

export const genUnapprovedPermit2ApproveConfirmation = ({
  amount = 1500000,
  expiration = 1767225600,
}: {
  amount?: number;
  expiration?: number;
} = {}) => {
  const confirmation = genUnapprovedApproveConfirmation();

  return {
    ...confirmation,
    txParams: {
      ...confirmation.txParams,
      to: PERMIT2_CONTRACT_ADDRESS,
      data: buildPermit2ApproveTransactionData(
        PERMIT2_TOKEN_ADDRESS,
        PERMIT2_SPENDER_ADDRESS,
        amount,
        expiration,
      ),
    },
  };
};
