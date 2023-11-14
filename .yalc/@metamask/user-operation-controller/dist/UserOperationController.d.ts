/// <reference types="node" />
import type { AddApprovalRequest } from '@metamask/approval-controller';
import type { RestrictedControllerMessenger } from '@metamask/base-controller';
import { BaseControllerV2 } from '@metamask/base-controller';
import type { GasFeeState } from '@metamask/gas-fee-controller';
import type { TransactionMeta, TransactionParams } from '@metamask/transaction-controller';
import EventEmitter from 'events';
import type { Patch } from 'immer';
import type { BlockTracker, ProviderProxy } from '../../network-controller/src';
import type { UserOperationMetadata } from './types';
declare const controllerName = "UserOperationController";
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
export declare type UserOperationControllerActions = GetUserOperationState | AddApprovalRequest;
export declare type UserOperationControllerEvents = UserOperationStateChange;
export declare type UserOperationControllerMessenger = RestrictedControllerMessenger<typeof controllerName, UserOperationControllerActions, UserOperationControllerEvents, UserOperationControllerActions['type'], UserOperationControllerEvents['type']>;
export declare type UserOperationControllerOptions = {
    blockTracker: BlockTracker;
    getGasFeeEstimates: () => Promise<GasFeeState>;
    getPrivateKey: () => Promise<string>;
    getTransactions: () => TransactionMeta[];
    messenger: UserOperationControllerMessenger;
    provider: ProviderProxy;
    state?: Partial<UserOperationControllerState>;
};
/**
 * Controller for creating and managing the life cycle of user operations.
 */
export declare class UserOperationController extends BaseControllerV2<typeof controllerName, UserOperationControllerState, UserOperationControllerMessenger> {
    #private;
    hub: EventEmitter;
    /**
     * Construct a UserOperation controller.
     *
     * @param options - Controller options.
     * @param options.blockTracker -
     * @param options.getGasFeeEstimates -
     * @param options.getPrivateKey -
     * @param options.getTransactions -
     * @param options.messenger - Restricted controller messenger for the user operation controller.
     * @param options.provider -
     * @param options.state - Initial state to set on the controller.
     */
    constructor({ blockTracker, getGasFeeEstimates, getPrivateKey, getTransactions, messenger, provider, state, }: UserOperationControllerOptions);
    addUserOperationFromTransaction(transaction: TransactionParams, { chainId, snapId }: {
        chainId: string;
        snapId: string;
    }): Promise<{
        id: string;
        hash: Promise<string>;
        transactionHash: Promise<string>;
    }>;
}
export {};
//# sourceMappingURL=UserOperationController.d.ts.map