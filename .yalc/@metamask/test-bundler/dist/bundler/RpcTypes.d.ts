import type { TransactionReceipt } from '@ethersproject/providers';
import type { BigNumberish } from 'ethers';
import type { UserOperation } from '../utils';
/**
 * RPC calls return types
 */
/**
 * return value from estimateUserOpGas
 */
export type EstimateUserOpGasResult = {
    /**
     * the preVerification gas used by this UserOperation.
     */
    preVerificationGas: BigNumberish;
    /**
     * gas used for validation of this UserOperation, including account creation
     */
    verificationGasLimit: BigNumberish;
    /**
     * the deadline after which this UserOperation is invalid (not a gas estimation parameter, but returned by validation
     */
    deadline?: BigNumberish;
    /**
     * estimated cost of calling the account with the given callData
     */
    callGasLimit: BigNumberish;
};
export type UserOperationByHashResponse = {
    userOperation: UserOperation;
    entryPoint: string;
    blockNumber: number;
    blockHash: string;
    transactionHash: string;
};
export type UserOperationReceipt = {
    userOpHash: string;
    sender: string;
    nonce: BigNumberish;
    paymaster?: string;
    actualGasCost: BigNumberish;
    actualGasUsed: BigNumberish;
    success: boolean;
    reason?: string;
    logs: any[];
    receipt: TransactionReceipt;
};
