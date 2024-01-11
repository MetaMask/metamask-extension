import type { UserOperationStruct } from '@account-abstraction/contracts';
import type { NotPromise } from '../utils';
export type GasOverheads = {
    /**
     * fixed overhead for entire handleOp bundle.
     */
    fixed: number;
    /**
     * per userOp overhead, added on top of the above fixed per-bundle.
     */
    perUserOp: number;
    /**
     * overhead for userOp word (32 bytes) block
     */
    perUserOpWord: number;
    /**
     * zero byte cost, for calldata gas cost calculations
     */
    zeroByte: number;
    /**
     * non-zero byte cost, for calldata gas cost calculations
     */
    nonZeroByte: number;
    /**
     * expected bundle size, to split per-bundle overhead between all ops.
     */
    bundleSize: number;
    /**
     * expected length of the userOp signature.
     */
    sigSize: number;
};
export declare const DefaultGasOverheads: GasOverheads;
/**
 * calculate the preVerificationGas of the given UserOperation
 * preVerificationGas (by definition) is the cost overhead that can't be calculated on-chain.
 * it is based on parameters that are defined by the Ethereum protocol for external transactions.
 * @param userOp - filled userOp to calculate. The only possible missing fields can be the signature and preVerificationGas itself
 * @param overheads - gas overheads to use, to override the default values
 */
export declare function calcPreVerificationGas(userOp: Partial<NotPromise<UserOperationStruct>>, overheads?: Partial<GasOverheads>): number;
