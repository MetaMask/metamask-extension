import type { Web3Provider } from '@ethersproject/providers';
import type { UserOperation } from '../../types';
export declare function getPaymasterAndData(paymasterAddress: string, validUntil: number, validAfter: number, userOperation: UserOperation, privateKey: string, provider: Web3Provider): Promise<string>;
//# sourceMappingURL=VerifyingPaymaster.d.ts.map