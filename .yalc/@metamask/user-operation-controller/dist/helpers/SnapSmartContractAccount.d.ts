import type { PrepareUserOperationRequest, PrepareUserOperationResponse, SignUserOperationRequest, SignUserOperationResponse, SmartContractAccount, UpdateUserOperationRequest, UpdateUserOperationResponse } from '../types';
import type { UserOperationControllerMessenger } from '../UserOperationController';
export declare class SnapSmartContractAccount implements SmartContractAccount {
    #private;
    constructor(messenger: UserOperationControllerMessenger);
    prepareUserOperation(request: PrepareUserOperationRequest): Promise<PrepareUserOperationResponse>;
    updateUserOperation(request: UpdateUserOperationRequest): Promise<UpdateUserOperationResponse>;
    signUserOperation(request: SignUserOperationRequest): Promise<SignUserOperationResponse>;
}
//# sourceMappingURL=SnapSmartContractAccount.d.ts.map