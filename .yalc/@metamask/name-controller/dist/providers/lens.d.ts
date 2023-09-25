import type { NameProvider, NameProviderMetadata, NameProviderRequest, NameProviderResult } from '../types';
export declare class LensNameProvider implements NameProvider {
    getMetadata(): NameProviderMetadata;
    getProposedNames(request: NameProviderRequest): Promise<NameProviderResult>;
}
//# sourceMappingURL=lens.d.ts.map