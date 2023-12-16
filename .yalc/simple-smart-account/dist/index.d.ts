import { Provider } from "@ethersproject/providers";
import type { PrepareUserOperationRequest, SignUserOperationRequest, SmartContractAccount, UpdateUserOperationRequest } from "@metamask/user-operation-controller";
export default class SimpleSmartAccount implements SmartContractAccount {
    #private;
    constructor(owner: string, salt: string, paymasterAddress: string | undefined, privateKey: string, provider: Provider);
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