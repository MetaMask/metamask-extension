/// <reference types="node" />
import type { AddApprovalRequest } from '@metamask/approval-controller';
import type { RestrictedControllerMessenger } from '@metamask/base-controller';
import { BaseController } from '@metamask/base-controller';
import type { GasFeeState } from '@metamask/gas-fee-controller';
import type { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';
import { type TransactionMeta, type TransactionParams } from '@metamask/transaction-controller';
import EventEmitter from 'events';
import type { Patch } from 'immer';
import type { SmartContractAccount, UserOperationMetadata } from './types';
declare const controllerName = "UserOperationController";
declare type Events = {
    'transaction-updated': [metadata: TransactionMeta];
    'user-operation-confirmed': [metadata: UserOperationMetadata];
    'user-operation-failed': [metadata: UserOperationMetadata, error: Error];
    [key: `${string}:confirmed`]: [metadata: UserOperationMetadata];
    [key: `${string}:failed`]: [metadata: UserOperationMetadata, error: Error];
};
export declare type UserOperationControllerEventEmitter = EventEmitter & {
    on<T extends keyof Events>(eventName: T, listener: (...args: Events[T]) => void): UserOperationControllerEventEmitter;
    once<T extends keyof Events>(eventName: T, listener: (...args: Events[T]) => void): UserOperationControllerEventEmitter;
    emit<T extends keyof Events>(eventName: T, ...args: Events[T]): boolean;
};
export declare type UserOperationControllerState = {
    userOperations: Record<string, UserOperationMetadata>;
};
export declare type GetUserOperationState = {
    type: `${typeof controllerName}:getState`;
    handler: () => UserOperationControllerState;
};
export declare type UserOperationStateChange = {
    type: `${typeof controllerName}:stateChange`;
    payload: [UserOperationControllerState, Patch[]];
};
export declare type UserOperationControllerActions = GetUserOperationState | NetworkControllerGetNetworkClientByIdAction | AddApprovalRequest;
export declare type UserOperationControllerEvents = UserOperationStateChange;
export declare type UserOperationControllerMessenger = RestrictedControllerMessenger<typeof controllerName, UserOperationControllerActions, UserOperationControllerEvents, UserOperationControllerActions['type'], UserOperationControllerEvents['type']>;
export declare type UserOperationControllerOptions = {
    getGasFeeEstimates: () => Promise<GasFeeState>;
    interval?: number;
    messenger: UserOperationControllerMessenger;
    state?: Partial<UserOperationControllerState>;
};
export declare type AddUserOperationRequest = {
    data?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    to?: string;
    value?: string;
};
export declare type AddUserOperationOptions = {
    networkClientId: string;
    origin: string;
    requireApproval?: boolean;
    smartContractAccount: SmartContractAccount;
};
export declare type AddUserOperationResponse = {
    id: string;
    hash: () => Promise<string | undefined>;
    transactionHash: () => Promise<string | undefined>;
};
/**
 * Controller for creating and managing the life cycle of user operations.
 */
export declare class UserOperationController extends BaseController<typeof controllerName, UserOperationControllerState, UserOperationControllerMessenger> {
    #private;
    hub: UserOperationControllerEventEmitter;
    /**
     * Construct a UserOperationController instance.
     *
     * @param options - Controller options.
     * @param options.getGasFeeEstimates - Callback to get gas fee estimates.
     * @param options.interval - Polling interval used to check the status of pending user operations.
     * @param options.messenger - Restricted controller messenger for the user operation controller.
     * @param options.state - Initial state to set on the controller.
     */
    constructor({ getGasFeeEstimates, interval, messenger, state, }: UserOperationControllerOptions);
    /**
     * Create and submit a user operation.
     *
     * @param request - Information required to create a user operation.
     * @param request.data - Data to include in the resulting transaction.
     * @param request.maxFeePerGas - Maximum fee per gas to pay towards the transaction.
     * @param request.maxPriorityFeePerGas - Maximum priority fee per gas to pay towards the transaction.
     * @param request.to - Destination address of the resulting transaction.
     * @param request.value - Value to include in the resulting transaction.
     * @param options - Configuration options when creating a user operation.
     * @param options.networkClientId - ID of the network client used to query the chain.
     * @param options.origin - Origin of the user operation, such as the hostname of a dApp.
     * @param options.requireApproval - Whether to require user approval before submitting the user operation. Defaults to true.
     * @param options.smartContractAccount - Smart contract abstraction to provide the contract specific values such as call data and nonce.
     */
    addUserOperation(request: AddUserOperationRequest, options: AddUserOperationOptions): Promise<AddUserOperationResponse>;
    /**
     * Create and submit a user operation equivalent to the provided transaction.
     *
     * @param transaction - Transaction to use as the basis for the user operation.
     * @param options - Configuration options when creating a user operation.
     * @param options.networkClientId - ID of the network client used to query the chain.
     * @param options.origin - Origin of the user operation, such as the hostname of a dApp.
     * @param options.requireApproval - Whether to require user approval before submitting the user operation. Defaults to true.
     * @param options.smartContractAccount - Smart contract abstraction to provide the contract specific values such as call data and nonce.
     */
    addUserOperationFromTransaction(transaction: TransactionParams, options: AddUserOperationOptions): Promise<AddUserOperationResponse>;
    startPollingByNetworkClientId(networkClientId: string): string;
}
export {};
//# sourceMappingURL=UserOperationController.d.ts.map