import type { NameProvider, NameProviderMetadata, NameProviderRequest, NameProviderResult } from '../types';
export declare class TokenNameProvider implements NameProvider {
    #private;
    constructor({ isEnabled }?: {
        isEnabled?: () => boolean;
    });
    getMetadata(): NameProviderMetadata;
    getProposedNames(request: NameProviderRequest): Promise<NameProviderResult>;
}
//# sourceMappingURL=token.d.ts.map