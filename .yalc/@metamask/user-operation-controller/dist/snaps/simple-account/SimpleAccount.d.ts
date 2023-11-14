import type { Web3Provider } from '@ethersproject/providers';
export declare function getInitCode(owner: string, salt: string): string;
export declare function getSender(initCode: string, provider: Web3Provider): Promise<string>;
export declare function getCallData(to: string | undefined, value: string | undefined, data: string | undefined, sender: string): string;
export declare function getNonce(sender: string, isDeployed: boolean, provider: Web3Provider): Promise<string>;
//# sourceMappingURL=SimpleAccount.d.ts.map