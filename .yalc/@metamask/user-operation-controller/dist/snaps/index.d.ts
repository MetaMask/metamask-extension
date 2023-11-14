import type { OnPaymasterRequest, OnPaymasterResponse, OnUserOperationRequest, OnUserOperationResponse } from './types';
export declare function sendSnapUserOperationRequest(snapId: string, request: OnUserOperationRequest): Promise<OnUserOperationResponse>;
export declare function sendSnapPaymasterRequest(snapId: string, request: OnPaymasterRequest): Promise<OnPaymasterResponse>;
//# sourceMappingURL=index.d.ts.map