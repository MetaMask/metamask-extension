import type { Provider } from "@ethersproject/providers";
export declare function getInitCode(owner: string, salt: string, simpleAccountFactory: string): string;
export declare function getSender(initCode: string, provider: Provider, entrypoint: string): Promise<string>;
export declare function getCallData(to: string | undefined, value: string | undefined, data: string | undefined): string;
export declare function getNonce(sender: string, isDeployed: boolean, provider: Provider): Promise<string>;
export declare function getDummySignature(): string;
//# sourceMappingURL=SimpleAccount.d.ts.map