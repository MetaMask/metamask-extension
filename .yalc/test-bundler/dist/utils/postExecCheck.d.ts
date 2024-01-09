import { NotPromise } from './ERC4337Utils';
import { EntryPoint, UserOperationStruct } from '@account-abstraction/contracts';
export declare function postExecutionDump(entryPoint: EntryPoint, userOpHash: string): Promise<void>;
/**
 * check whether an already executed UserOperation paid enough
 * (the only field that EntryPoint can check is the preVerificationGas.
 * There is no "view-mode" way to determine the actual gas cost of a given transaction,
 * so we must do it after mining it.
 * @param entryPoint
 * @param userOpHash
 */
export declare function postExecutionCheck(entryPoint: EntryPoint, userOpHash: string): Promise<{
    gasUsed: number;
    gasPaid: number;
    success: boolean;
    userOp: NotPromise<UserOperationStruct>;
}>;
