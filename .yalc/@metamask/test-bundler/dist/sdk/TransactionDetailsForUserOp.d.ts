import type { BigNumberish } from 'ethers';
export type TransactionDetailsForUserOp = {
    target: string;
    data: string;
    value?: BigNumberish;
    gasLimit?: BigNumberish;
    maxFeePerGas?: BigNumberish;
    maxPriorityFeePerGas?: BigNumberish;
    nonce?: BigNumberish;
};
