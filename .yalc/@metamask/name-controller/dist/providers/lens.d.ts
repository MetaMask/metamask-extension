import type { NameProvider, NameProviderMetadata, NameProviderRequest, NameProviderResult } from '../types';
export declare class LensNameProvider implements NameProvider {
    #private;
    constructor({ isEnabled }?: {
        isEnabled?: () => boolean;
    });
    getMetadata(): NameProviderMetadata;
    getProposedNames(request: NameProviderRequest): Promise<NameProviderResult>;
}
//# sourceMappingURL=lens.d.ts.map