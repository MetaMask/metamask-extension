/// <reference types="node" />
import type { AddApprovalRequest } from '@metamask/approval-controller';
import type { RestrictedControllerMessenger } from '@metamask/base-controller';
import { BaseController } from '@metamask/base-controller';
import type { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';
import type { TransactionMeta, TransactionParams } from '@metamask/transaction-controller';
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
    interval?: number;
    messenger: UserOperationControllerMessenger;
    state?: Partial<UserOperationControllerState>;
};
export declare type AddUserOperationOptions = {
    chainId: string;
    requireApproval?: boolean;
    smartContractAccount: SmartContractAccount;
    transaction?: TransactionParams;
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
     * @param options.interval - Polling interval used to check the status of pending user operations.
     * @param options.messenger - Restricted controller messenger for the user operation controller.
     * @param options.state - Initial state to set on the controller.
     */
    constructor({ interval, messenger, state }: UserOperationControllerOptions);
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
     * @param options.chainId - Chain ID of the resulting transaction.
     * @param options.smartContractAccount - Smart contract abstraction to provide the contract specific values such as call data and nonce.
     */
    addUserOperation(request: {
        data?: string;
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
        to?: string;
        value?: string;
    }, options: AddUserOperationOptions): Promise<AddUserOperationResponse>;
    addUserOperationFromTransaction(transaction: TransactionParams, options: AddUserOperationOptions): Promise<AddUserOperationResponse>;
    startPollingByNetworkClientId(networkClientId: string): string;
}
export {};
//# sourceMappingURL=UserOperationController.d.ts.map