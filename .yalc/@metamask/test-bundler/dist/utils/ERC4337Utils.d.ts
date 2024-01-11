import type { UserOperationStruct } from '@account-abstraction/contracts';
export declare const AddressZero: string;
export type NotPromise<T> = {
    [P in keyof T]: Exclude<T[P], Promise<any>>;
};
/**
 * pack the userOperation
 * @param op
 * @param forSignature - "true" if the hash is needed to calculate the getUserOpHash()
 *  "false" to pack entire UserOp, for calculating the calldata cost of putting it on-chain.
 */
export declare function packUserOp(op: NotPromise<UserOperationStruct>, forSignature?: boolean): string;
/**
 * calculate the userOpHash of a given userOperation.
 * The userOpHash is a hash of all UserOperation fields, except the "signature" field.
 * The entryPoint uses this value in the emitted UserOperationEvent.
 * A wallet may use this value as the hash to sign (the SampleWallet uses this method)
 * @param op
 * @param entryPoint
 * @param chainId
 */
export declare function getUserOpHash(op: NotPromise<UserOperationStruct>, entryPoint: string, chainId: number): string;
type DecodedError = {
    message: string;
    opIndex?: number;
};
/**
 * decode bytes thrown by revert as Error(message) or FailedOp(opIndex,paymaster,message)
 * @param error
 */
export declare function decodeErrorReason(error: string): DecodedError | undefined;
/**
 * update thrown Error object with our custom FailedOp message, and re-throw it.
 * updated both "message" and inner encoded "data"
 * tested on geth, hardhat-node
 * usage: entryPoint.handleOps().catch(decodeError)
 * @param e
 */
export declare function rethrowError(e: any): any;
/**
 * hexlify all members of object, recursively
 * @param obj
 */
export declare function deepHexlify(obj: any): any;
/**
 *
 * @param a
 */
export declare function resolveHexlify(a: any): Promise<any>;
export {};
