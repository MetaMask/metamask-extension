import type { SimpleAccount, SimpleAccountFactory } from '@account-abstraction/contracts';
import type { Signer } from '@ethersproject/abstract-signer';
import type { BigNumberish } from 'ethers';
import { BigNumber } from 'ethers';
import type { BaseApiParams } from './BaseAccountAPI';
import { BaseAccountAPI } from './BaseAccountAPI';
/**
 * constructor params, added no top of base params:
 * @param owner - the signer object for the account owner
 * @param factoryAddress - address of contract "factory" to deploy new contracts (not needed if account already deployed)
 * @param index - nonce value used when creating multiple accounts for the same owner
 */
export type SimpleAccountApiParams = {
    owner: Signer;
    factoryAddress?: string;
    index?: BigNumberish;
} & BaseApiParams;
/**
 * An implementation of the BaseAccountAPI using the SimpleAccount contract.
 * - contract deployer gets "entrypoint", "owner" addresses and "index" nonce
 * - owner signs requests using normal "Ethereum Signed Message" (ether's signer.signMessage())
 * - nonce method is "nonce()"
 * - execute method is "execFromEntryPoint()"
 */
export declare class SimpleAccountAPI extends BaseAccountAPI {
    factoryAddress?: string;
    owner: Signer;
    index: BigNumberish;
    /**
     * our account contract.
     * should support the "execFromEntryPoint" and "nonce" methods
     */
    accountContract?: SimpleAccount;
    factory?: SimpleAccountFactory;
    constructor(params: SimpleAccountApiParams);
    _getAccountContract(): Promise<SimpleAccount>;
    /**
     * return the value to put into the "initCode" field, if the account is not yet deployed.
     * this value holds the "factory" address, followed by this account's information
     */
    getAccountInitCode(): Promise<string>;
    getNonce(): Promise<BigNumber>;
    /**
     * encode a method call from entryPoint to our contract
     * @param target
     * @param value
     * @param data
     */
    encodeExecute(target: string, value: BigNumberish, data: string): Promise<string>;
    signUserOpHash(userOpHash: string): Promise<string>;
}
