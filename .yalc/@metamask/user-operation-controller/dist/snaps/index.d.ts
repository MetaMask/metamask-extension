import type { OnPaymasterRequest, OnPaymasterResponse, OnUserOperationRequest, OnUserOperationResponse, OnUserOperationSignatureRequest, OnUserOperationSignatureResponse } from './types';
export declare function sendSnapUserOperationRequest(snapId: string, request: OnUserOperationRequest): Promise<OnUserOperationResponse>;
export declare function sendSnapPaymasterRequest(snapId: string, request: OnPaymasterRequest): Promise<OnPaymasterResponse>;
export declare function sendSnapUserOperationSignatureRequest(snapId: string, request: OnUserOperationSignatureRequest): Promise<OnUserOperationSignatureResponse>;
//# sourceMappingURL=index.d.ts.map