import { Infer, Struct } from 'superstruct';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Unique<Element extends Struct<any>> = (
  struct: Struct<Infer<Element>[], Infer<Element>>,
  eq?: (a: Infer<Element>, b: Infer<Element>) => boolean,
) => Struct<Infer<Element>[], Infer<Element>>;

// BEGIN automatically generated types code
export type BuildTypesConfig = Infer<typeof BuildTypesStruct>;

export const loadBuildTypesConfig: () => BuildTypesConfig;

export type BuildType = {
  id: number;
  features?: string[];
  env?: (string | { [k: string]: unknown })[];
  isPrerelease?: boolean;
  buildNameOverride?: string;
};

export type BuildConfig = {
  buildTypes: Record<string, BuildType>;
  env: (string | Record<string, unknown>)[];
  features: Record<
    string,
    null | { env?: (string | { [k: string]: unknown })[] }
  >;
};

export const getBuildTypes: () => BuildConfig;
// END automatically generated types code
