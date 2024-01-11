import type { UserOperationStruct } from '@account-abstraction/contracts';
import type { Provider } from '@ethersproject/providers';
import type { BigNumberish } from 'ethers';
import { BigNumber } from 'ethers';
import type { GasOverheads } from './calcPreVerificationGas';
import type { PaymasterAPI } from './PaymasterAPI';
import type { TransactionDetailsForUserOp } from './TransactionDetailsForUserOp';
import type { NotPromise } from '../utils';
export type BaseApiParams = {
    provider: Provider;
    entryPointAddress: string;
    accountAddress?: string;
    overheads?: Partial<GasOverheads>;
    paymasterAPI?: PaymasterAPI;
};
export type UserOpResult = {
    transactionHash: string;
    success: boolean;
};
/**
 * Base class for all Smart Wallet ERC-4337 Clients to implement.
 * Subclass should inherit 5 methods to support a specific wallet contract:
 *
 * - getAccountInitCode - return the value to put into the "initCode" field, if the account is not yet deployed. should create the account instance using a factory contract.
 * - getNonce - return current account's nonce value
 * - encodeExecute - encode the call from entryPoint through our account to the target contract.
 * - signUserOpHash - sign the hash of a UserOp.
 *
 * The user can use the following APIs:
 * - createUnsignedUserOp - given "target" and "calldata", fill userOp to perform that operation from the account.
 * - createSignedUserOp - helper to call the above createUnsignedUserOp, and then extract the userOpHash and sign it
 */
export declare abstract class BaseAccountAPI {
    private senderAddress;
    private isPhantom;
    private readonly entryPointView;
    provider: Provider;
    overheads?: Partial<GasOverheads>;
    entryPointAddress: string;
    accountAddress?: string;
    paymasterAPI?: PaymasterAPI;
    /**
     * base constructor.
     * subclass SHOULD add parameters that define the owner (signer) of this wallet
     * @param params
     */
    protected constructor(params: BaseApiParams);
    init(): Promise<this>;
    /**
     * return the value to put into the "initCode" field, if the contract is not yet deployed.
     * this value holds the "factory" address, followed by this account's information
     */
    abstract getAccountInitCode(): Promise<string>;
    /**
     * return current account's nonce.
     */
    abstract getNonce(): Promise<BigNumber>;
    /**
     * encode the call from entryPoint through our account to the target contract.
     * @param target
     * @param value
     * @param data
     */
    abstract encodeExecute(target: string, value: BigNumberish, data: string): Promise<string>;
    /**
     * sign a userOp's hash (userOpHash).
     * @param userOpHash
     */
    abstract signUserOpHash(userOpHash: string): Promise<string>;
    /**
     * check if the contract is already deployed.
     */
    checkAccountPhantom(): Promise<boolean>;
    /**
     * calculate the account address even before it is deployed
     */
    getCounterFactualAddress(): Promise<string>;
    /**
     * return initCode value to into the UserOp.
     * (either deployment code, or empty hex if contract already deployed)
     */
    getInitCode(): Promise<string>;
    /**
     * return maximum gas used for verification.
     * NOTE: createUnsignedUserOp will add to this value the cost of creation, if the contract is not yet created.
     */
    getVerificationGasLimit(): Promise<BigNumberish>;
    /**
     * should cover cost of putting calldata on-chain, and some overhead.
     * actual overhead depends on the expected bundle size
     * @param userOp
     */
    getPreVerificationGas(userOp: Partial<UserOperationStruct>): Promise<number>;
    /**
     * ABI-encode a user operation. used for calldata cost estimation
     * @param userOp
     */
    packUserOp(userOp: NotPromise<UserOperationStruct>): string;
    encodeUserOpCallDataAndGasLimit(detailsForUserOp: TransactionDetailsForUserOp): Promise<{
        callData: string;
        callGasLimit: BigNumber;
    }>;
    /**
     * return userOpHash for signing.
     * This value matches entryPoint.getUserOpHash (calculated off-chain, to avoid a view call)
     * @param userOp - userOperation, (signature field ignored)
     */
    getUserOpHash(userOp: UserOperationStruct): Promise<string>;
    /**
     * return the account's address.
     * this value is valid even before deploying the contract.
     */
    getAccountAddress(): Promise<string>;
    estimateCreationGas(initCode?: string): Promise<BigNumberish>;
    /**
     * create a UserOperation, filling all details (except signature)
     * - if account is not yet created, add initCode to deploy it.
     * - if gas or nonce are missing, read them from the chain (note that we can't fill gaslimit before the account is created)
     * @param info
     */
    createUnsignedUserOp(info: TransactionDetailsForUserOp): Promise<UserOperationStruct>;
    /**
     * Sign the filled userOp.
     * @param userOp - the UserOperation to sign (with signature field ignored)
     */
    signUserOp(userOp: UserOperationStruct): Promise<UserOperationStruct>;
    /**
     * helper method: create and sign a user operation.
     * @param info - transaction details for the userOp
     */
    createSignedUserOp(info: TransactionDetailsForUserOp): Promise<UserOperationStruct>;
    /**
     * get the transaction that has this userOpHash mined, or null if not found
     * @param userOpHash - returned by sendUserOpToBundler (or by getUserOpHash..)
     * @param timeout - stop waiting after this timeout
     * @param interval - time to wait between polls.
     * @returns the transactionHash this userOp was mined, or null if not found.
     */
    getUserOpReceipt(userOpHash: string, timeout?: number, interval?: number): Promise<string | null>;
}
