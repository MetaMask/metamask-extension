import { BytesLike, ContractFactory } from 'ethers';
import { Result } from 'ethers/lib/utils';
import { Provider, JsonRpcProvider } from '@ethersproject/providers';
import { BigNumberish } from 'ethers/lib/ethers';
import { NotPromise } from './ERC4337Utils';
import { UserOperationStruct } from '@account-abstraction/contracts';
export interface SlotMap {
    [slot: string]: string;
}
/**
 * map of storage
 * for each address, either a root hash, or a map of slot:value
 */
export interface StorageMap {
    [address: string]: string | SlotMap;
}
export interface StakeInfo {
    addr: string;
    stake: BigNumberish;
    unstakeDelaySec: BigNumberish;
}
export type UserOperation = NotPromise<UserOperationStruct>;
export declare enum ValidationErrors {
    InvalidFields = -32602,
    SimulateValidation = -32500,
    SimulatePaymasterValidation = -32501,
    OpcodeValidation = -32502,
    NotInTimeRange = -32503,
    Reputation = -32504,
    InsufficientStake = -32505,
    UnsupportedSignatureAggregator = -32506,
    InvalidSignature = -32507,
    UserOperationReverted = -32521
}
export interface ReferencedCodeHashes {
    addresses: string[];
    hash: string;
}
export declare class RpcError extends Error {
    readonly code?: number | undefined;
    readonly data: any;
    constructor(msg: string, code?: number | undefined, data?: any);
}
export declare function tostr(s: BigNumberish): string;
export declare function requireCond(cond: boolean, msg: string, code?: number, data?: any): void;
/**
 * create a dictionary object with given keys
 * @param keys the property names of the returned object
 * @param mapper mapper from key to property value
 * @param filter if exists, must return true to add keys
 */
export declare function mapOf<T>(keys: Iterable<string>, mapper: (key: string) => T, filter?: (key: string) => boolean): {
    [key: string]: T;
};
export declare function sleep(sleepTime: number): Promise<void>;
export declare function waitFor<T>(func: () => T | undefined, timeout?: number, interval?: number): Promise<T>;
export declare function supportsRpcMethod(provider: JsonRpcProvider, method: string, params: any[]): Promise<boolean>;
export declare function getAddr(data?: BytesLike): string | undefined;
/**
 * merge all validationStorageMap objects into merged map
 * - entry with "root" (string) is always preferred over entry with slot-map
 * - merge slot entries
 * NOTE: slot values are supposed to be the value before the transaction started.
 *  so same address/slot in different validations should carry the same value
 * @param mergedStorageMap
 * @param validationStorageMap
 */
export declare function mergeStorageMap(mergedStorageMap: StorageMap, validationStorageMap: StorageMap): StorageMap;
export declare function toBytes32(b: BytesLike | number): string;
/**
 * run the constructor of the given type as a script: it is expected to revert with the script's return values.
 * @param provider provider to use fo rthe call
 * @param c - contract factory of the script class
 * @param ctrParams constructor parameters
 * @return an array of arguments of the error
 * example usasge:
 *     hashes = await runContractScript(provider, new GetUserOpHashes__factory(), [entryPoint.address, userOps]).then(ret => ret.userOpHashes)
 */
export declare function runContractScript<T extends ContractFactory>(provider: Provider, c: T, ctrParams: Parameters<T['getDeployTransaction']>): Promise<Result>;
