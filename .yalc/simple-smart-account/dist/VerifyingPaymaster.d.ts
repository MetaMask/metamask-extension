import type { UserOperation } from "@metamask/user-operation-controller";
import { Provider } from "@ethersproject/providers";
export declare function getPaymasterAndData(paymasterAddress: string, validUntil: number, validAfter: number, userOperation: UserOperation, privateKey: string, provider: Provider): Promise<string>;
export declare function getDummyPaymasterAndData(paymasterAddress?: string): string | undefined;
//# sourceMappingURL=VerifyingPaymaster.d.ts.map