const fs = require('fs');
const { AssertionError } = require('assert');
const path = require('path');
const {
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
} = require('superstruct');
const yaml = require('js-yaml');
const { uniqWith } = require('lodash');

const BUILDS_YML_PATH = path.resolve('./builds.yml');

/**
 * @type {import('superstruct').Infer<typeof BuildTypesStruct> | null}
 */
let cachedBuildTypes = null;

/**
 * Ensures that the array item contains only elements that are distinct from each other
 *
 * @template {Struct<any>} Element
 * @type {import('./build-type').Unique<Element>}
 */
const unique = (struct, eq) =>
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

const EnvArrayStruct = unique(
  array(union([string(), EnvDefinitionStruct])),
  (a, b) => {
    const keyA = typeof a === 'string' ? a : a.key;
    const keyB = typeof b === 'string' ? b : b.key;
    return keyA === keyB;
  },
);

const BuildTypeStruct = object({
  features: optional(unique(array(string()))),
  env: optional(EnvArrayStruct),
  isPrerelease: optional(boolean()),
  manifestOverrides: union([string(), literal(false)]),
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
    if (!Object.keys(value.buildTypes).includes(value.default)) {
      return `Default build type "${value.default}" does not exist in builds declarations`;
    }
    return true;
  },
);

/**
 * Loads definitions of build type and what they are composed of.
 *
 * @returns {import('superstruct').Infer<typeof BuildTypesStruct>}
 */
function loadBuildTypesConfig() {
  if (cachedBuildTypes !== null) {
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
 * @param {import('superstruct').StructError} structError
 * @returns {string}
 */
function constructFailureMessage(structError) {
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
