import type { NameProvider, NameProviderMetadata, NameProviderRequest, NameProviderResult } from '../types';
export declare type ReverseLookupCallback = (address: string, chainId: string) => Promise<string>;
export declare class ENSNameProvider implements NameProvider {
    #private;
    constructor({ isEnabled, reverseLookup, }: {
        isEnabled?: () => boolean;
        reverseLookup: ReverseLookupCallback;
    });
    getMetadata(): NameProviderMetadata;
    getProposedNames(request: NameProviderRequest): Promise<NameProviderResult>;
}
//# sourceMappingURL=ens.d.ts.map