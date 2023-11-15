import type { UserOperation } from '../types';
export declare type SnapProvider = {
    request: (request: {
        method: string;
        params: any[];
    }) => Promise<any>;
};
export declare type OnUserOperationRequest = {
    to?: string;
    value?: string;
    data?: string;
    chainId: string;
    ethereum: SnapProvider;
};
export declare type OnPaymasterRequest = {
    userOperation: UserOperation;
    privateKey: string;
    ethereum: SnapProvider;
};
export declare type OnUserOperationSignatureRequest = {
    userOperation: UserOperation;
    chainId: string;
    privateKey: string;
};
export declare type OnUserOperationResponse = {
    bundler?: string;
    callData: string;
    dummyPaymasterAndData?: string;
    dummySignature?: string;
    initCode: string;
    nonce: string;
    sender: string;
};
export declare type OnPaymasterResponse = {
    paymasterAndData: string;
};
export declare type OnUserOperationSignatureResponse = {
    signature: string;
};
export declare type OnUserOperationHandler = (request: OnUserOperationRequest) => Promise<OnUserOperationResponse>;
export declare type OnPaymasterHandler = (request: OnPaymasterRequest) => Promise<OnPaymasterResponse>;
export declare type OnUserOperationSignatureHandler = (request: OnUserOperationSignatureRequest) => Promise<OnUserOperationSignatureResponse>;
export declare type AccountSnap = {
    onUserOperationRequest: OnUserOperationHandler;
    onPaymasterRequest: OnPaymasterHandler;
    onUserOperationSignatureRequest: OnUserOperationSignatureHandler;
};
//# sourceMappingURL=types.d.ts.map