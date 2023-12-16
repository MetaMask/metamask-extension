import type { UserOperation } from "@metamask/user-operation-controller";
export declare function signHash(hash: string, privateKey: string): Promise<string>;
export declare function signUserOperation(userOperation: UserOperation, entrypointAddress: string, chainId: string, privateKey: string): Promise<string>;
//# sourceMappingURL=ecdsa.d.ts.map