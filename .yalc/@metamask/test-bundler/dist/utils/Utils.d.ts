import type { UserOperationStruct } from '@account-abstraction/contracts';
import type { Provider, JsonRpcProvider } from '@ethersproject/providers';
import type { BytesLike } from 'ethers';
import { ContractFactory } from 'ethers';
import type { BigNumberish } from 'ethers/lib/ethers';
import type { Result } from 'ethers/lib/utils';
import type { NotPromise } from './ERC4337Utils';
export type SlotMap = {
    [slot: string]: string;
};
/**
 * map of storage
 * for each address, either a root hash, or a map of slot:value
 */
export type StorageMap = {
    [address: string]: string | SlotMap;
};
export type StakeInfo = {
    addr: string;
    stake: BigNumberish;
    unstakeDelaySec: BigNumberish;
};
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
export type ReferencedCodeHashes = {
    addresses: string[];
    hash: string;
};
export declare class RpcError extends Error {
    readonly code?: number | undefined;
    readonly data: any;
    constructor(msg: string, code?: number | undefined, data?: any);
}
/**
 *
 * @param s
 */
export declare function tostr(s: BigNumberish): string;
/**
 *
 * @param cond
 * @param msg
 * @param code
 * @param data
 */
export declare function requireCond(cond: boolean, msg: string, code?: number, data?: any): void;
/**
 * create a dictionary object with given keys
 * @param keys - the property names of the returned object
 * @param mapper - mapper from key to property value
 * @param filter - if exists, must return true to add keys
 */
export declare function mapOf<T>(keys: Iterable<string>, mapper: (key: string) => T, filter?: (key: string) => boolean): {
    [key: string]: T;
};
/**
 *
 * @param sleepTime
 */
export declare function sleep(sleepTime: number): Promise<void>;
/**
 *
 * @param func
 * @param timeout
 * @param interval
 */
export declare function waitFor<T>(func: () => T | undefined, timeout?: number, interval?: number): Promise<T>;
/**
 *
 * @param provider
 * @param method
 * @param params
 */
export declare function supportsRpcMethod(provider: JsonRpcProvider, method: string, params: any[]): Promise<boolean>;
/**
 *
 * @param data
 */
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
/**
 *
 * @param b
 */
export declare function toBytes32(b: BytesLike | number): string;
/**
 * run the constructor of the given type as a script: it is expected to revert with the script's return values.
 * @param provider - provider to use fo rthe call
 * @param c - contract factory of the script class
 * @param ctrParams - constructor parameters
 * @returns an array of arguments of the error
 * example usasge:
 *     hashes = await runContractScript(provider, new GetUserOpHashes__factory(), [entryPoint.address, userOps]).then(ret => ret.userOpHashes)
 */
export declare function runContractScript<T extends ContractFactory>(provider: Provider, c: T, ctrParams: Parameters<T['getDeployTransaction']>): Promise<Result>;
