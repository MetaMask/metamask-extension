import fs from 'fs';

import { AssertionError } from 'assert';
import path from 'path';
import {
  Struct,
  Infer,
  object,
  string,
  record,
  optional,
  array,
  refine,
  any,
  boolean,
  coerce,
  union,
  unknown,
  validate,
  nullable,
  never,
  literal,
  StructError,
} from 'superstruct';
import yaml from 'js-yaml';

import uniqWith from 'lodash/uniqWith';

const BUILDS_YML_PATH = path.resolve('./builds.yml');

let cachedBuildTypes: Infer<typeof BuildTypesStruct> | undefined;

/**
 * Ensures that the array item contains only elements that are distinct from each other
 *
 * @param struct
 * @param eq
 */
const unique = <Element extends Struct<any>>(
  struct: Struct<Infer<Element>[], Infer<Element>>,
  eq?: (a: Infer<Element>, b: Infer<Element>) => boolean,
): Struct<Infer<Element>[], Infer<Element>> =>
  refine(struct, 'unique', (value) => {
    if (uniqWith(value, eq).length === value.length) {
      return true;
    }
    return 'Array contains duplicated values';
  });

const EnvDefinitionStruct = coerce(
  object({ key: string(), value: unknown() }),
  refine(record(string(), any()), 'Env variable declaration', (value) => {
    if (Object.keys(value).length !== 1) {
      return 'Declaration should have only one property, the name';
    }
    return true;
  }),
  (value) => ({ key: Object.keys(value)[0], value: Object.values(value)[0] }),
);

const EnvArrayStruct = unique<
  Struct<string | Infer<typeof EnvDefinitionStruct>>
>(array(union([string(), EnvDefinitionStruct])) as any, (a, b) => {
  const keyA = typeof a === 'string' ? a : a.key;
  const keyB = typeof b === 'string' ? b : b.key;
  return keyA === keyB;
});

const BuildTypeStruct = object({
  features: optional(unique(array(string()))),
  env: optional(EnvArrayStruct),
  isPrerelease: optional(boolean()),
  manifestOverrides: union([string(), literal(false)]),
  buildNameOverride: union([string(), literal(false)]),
});

const CopyAssetStruct = object({ src: string(), dest: string() });
const ExclusiveIncludeAssetStruct = coerce(
  object({ exclusiveInclude: string() }),
  string(),
  (exclusiveInclude) => ({ exclusiveInclude }),
);
const AssetStruct = union([CopyAssetStruct, ExclusiveIncludeAssetStruct]);

const FeatureStruct = object({
  env: optional(EnvArrayStruct),
  // TODO(ritave): Check if the paths exist
  assets: optional(array(AssetStruct)),
});

const FeaturesStruct = refine(
  record(
    string(),
    coerce(FeatureStruct, nullable(never()), () => ({})),
  ),
  'feature definitions',
  function* (value) {
    let isValid = true;

    const definitions = new Set();

    for (const feature of Object.values(value)) {
      for (const env of feature?.env ?? []) {
        if (typeof env !== 'string') {
          if (definitions.has(env.key)) {
            isValid = false;
            yield `Multiple defined features have a definition of "${env}" env variable, resulting in a conflict`;
          }
          definitions.add(env.key);
        }
      }
    }
    return isValid;
  },
);

const BuildTypesStruct = refine(
  object({
    default: string(),
    buildTypes: record(string(), BuildTypeStruct),
    features: FeaturesStruct,
    env: EnvArrayStruct,
  }),
  'BuildTypes',
  (value) => {
    if (!Object.keys(value.buildTypes).includes(value.default as string)) {
      return `Default build type "${value.default}" does not exist in builds declarations`;
    }
    return true;
  },
);

/**
 * Loads definitions of build type and what they are composed of.
 *
 * @returns
 */
function loadBuildTypesConfig(): Infer<typeof BuildTypesStruct> {
  if (cachedBuildTypes) {
    return cachedBuildTypes;
  }
  const buildsData = yaml.load(fs.readFileSync(BUILDS_YML_PATH, 'utf8'), {
    json: true,
  });
  const [err, result] = validate(buildsData, BuildTypesStruct, {
    coerce: true,
  });
  if (err !== undefined) {
    throw new AssertionError({
      message: constructFailureMessage(err),
    });
  }
  cachedBuildTypes = result;
  return buildsData;
}

/**
 * Creates a user readable error message about parse failure.
 *
 * @param structError
 * @returns
 */
function constructFailureMessage(structError: StructError): string {
  return `Failed to parse builds.yml
  -> ${structError
    .failures()
    .map(
      (failure) =>
        `${failure.message} (${BUILDS_YML_PATH}:.${failure.path.join('/')})`,
    )
    .join('\n  -> ')}
`;
}

module.exports = { loadBuildTypesConfig };
