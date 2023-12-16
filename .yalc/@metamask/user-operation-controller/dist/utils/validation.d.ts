import type { PrepareUserOperationResponse, SignUserOperationResponse, UpdateUserOperationResponse } from '../types';
import type { AddUserOperationOptions, AddUserOperationRequest } from '../UserOperationController';
/**
 * Validate a request to add a user operation.
 * @param request - The request to validate.
 */
export declare function validateAddUserOperationRequest(request: AddUserOperationRequest): void;
/**
 * Validate the options when adding a user operation.
 * @param options - The options to validate.
 */
export declare function validateAddUserOperationOptions(options: AddUserOperationOptions): void;
/**
 * Validate the response from a smart contract account when preparing the user operation.
 * @param response - The response to validate.
 */
export declare function validatePrepareUserOperationResponse(response: PrepareUserOperationResponse): void;
/**
 * Validate the response from a smart contract account when updating the user operation.
 * @param response - The response to validate.
 */
export declare function validateUpdateUserOperationResponse(response: UpdateUserOperationResponse): void;
/**
 * Validate the response from a smart contract account when signing the user operation.
 * @param response - The response to validate.
 */
export declare function validateSignUserOperationResponse(response: SignUserOperationResponse): void;
//# sourceMappingURL=validation.d.ts.map