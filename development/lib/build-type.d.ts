import { type Infer, type Struct } from '@metamask/superstruct';
declare const BuildTypeStruct: Struct<{
    id: number;
    extends?: string | undefined;
    features?: string[] | undefined;
    env?: Record<string, unknown> | undefined;
    isPrerelease?: boolean | undefined;
    manifestOverrides?: string | false | undefined;
    buildNameOverride?: string | false | undefined;
}, {
    id: Struct<number, null>;
    extends: Struct<string | undefined, null>;
    features: Struct<string[] | undefined, unknown>;
    env: Struct<Record<string, unknown> | undefined, null>;
    isPrerelease: Struct<boolean | undefined, null>;
    manifestOverrides: Struct<string | false | undefined, null>;
    buildNameOverride: Struct<string | false | undefined, null>;
}>;
export type BuildType = Infer<typeof BuildTypeStruct>;
declare const BuildTypesStruct: Struct<{
    features: Record<string, {
        assets?: ({
            src: string;
            dest: string;
        } | {
            exclusiveInclude: string;
        })[] | undefined;
    }>;
    env: Record<string, unknown>;
    default: string;
    buildTypes: Record<string, {
        id: number;
        extends?: string | undefined;
        features?: string[] | undefined;
        env?: Record<string, unknown> | undefined;
        isPrerelease?: boolean | undefined;
        manifestOverrides?: string | false | undefined;
        buildNameOverride?: string | false | undefined;
    }>;
}, {
    default: Struct<string, null>;
    buildTypes: Struct<Record<string, {
        id: number;
        extends?: string | undefined;
        features?: string[] | undefined;
        env?: Record<string, unknown> | undefined;
        isPrerelease?: boolean | undefined;
        manifestOverrides?: string | false | undefined;
        buildNameOverride?: string | false | undefined;
    }>, null>;
    features: Struct<Record<string, {
        assets?: ({
            src: string;
            dest: string;
        } | {
            exclusiveInclude: string;
        })[] | undefined;
    }>, null>;
    env: Struct<Record<string, unknown>, null>;
}>;
export type BuildTypesConfig = Infer<typeof BuildTypesStruct>;
/**
 * Loads and parses the `builds.yml` file, which contains the definitions of
 * our build types.
 *
 * @param cachedBuildTypes - The cached build types, if any.
 * @returns The parsed builds configuration.
 */
export declare function loadBuildTypesConfig(cachedBuildTypes?: BuildTypesConfig | null): BuildTypesConfig;
export {};
