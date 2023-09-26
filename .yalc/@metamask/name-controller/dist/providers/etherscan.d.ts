import type { NameProvider, NameProviderMetadata, NameProviderRequest, NameProviderResult } from '../types';
export declare class EtherscanNameProvider implements NameProvider {
    #private;
    constructor({ isEnabled }?: {
        isEnabled?: () => boolean;
    });
    getMetadata(): NameProviderMetadata;
    getProposedNames(request: NameProviderRequest): Promise<NameProviderResult>;
}
//# sourceMappingURL=etherscan.d.ts.map