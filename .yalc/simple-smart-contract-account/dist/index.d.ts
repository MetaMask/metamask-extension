import { Provider } from "@ethersproject/providers";
import type { PrepareUserOperationRequest, SignUserOperationRequest, SmartContractAccount, UpdateUserOperationRequest } from "@metamask/user-operation-controller";
export declare class SimpleSmartContractAccount implements SmartContractAccount {
    #private;
    constructor({ bundler, entrypoint, owner, paymasterAddress, privateKey, provider, salt, simpleAccountFactory, }: {
        bundler: string;
        entrypoint: string;
        owner: string;
        paymasterAddress?: string;
        privateKey: string;
        provider: Provider;
        salt: string;
        simpleAccountFactory: string;
    });
    prepareUserOperation(request: PrepareUserOperationRequest): Promise<{
        bundler: string;
        callData: string;
        dummyPaymasterAndData: string | undefined;
        dummySignature: string;
        initCode: string | undefined;
        sender: string;
        nonce: string;
    }>;
    updateUserOperation(request: UpdateUserOperationRequest): Promise<{
        paymasterAndData: string | undefined;
    }>;
    signUserOperation(request: SignUserOperationRequest): Promise<{
        signature: string;
    }>;
}
//# sourceMappingURL=index.d.ts.map