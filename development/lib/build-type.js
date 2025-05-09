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
  boolean,
  coerce,
  union,
  number,
  unknown,
  validate,
  nullable,
  never,
  literal,
} = require('superstruct');
const yaml = require('yaml');
const { cloneDeep, merge, uniqWith } = require('lodash');

const BUILDS_YML_PATH = path.resolve('./builds.yml');

/**
 * @type {import('superstruct').Infer<typeof BuildTypesStruct> | null}
 */
let _cachedBuildTypes = null;

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

// The `env` field is parsed into an array of strings or objects with a single key.
// This struct coerces this array into a single object.
const EnvObjectStruct = coerce(
  record(string(), unknown()),
  refine(
    array(union([string(), record(string(), unknown())])),
    'Env variable declaration',
    (value) => {
      value.forEach((item) => {
        if (typeof item === 'string') {
          return;
        }
        if (Object.keys(item).length !== 1) {
          throw new Error(
            'Declaration should have only one property, the name',
          );
        }
      });
      return true;
    },
  ),
  (value) =>
    Object.fromEntries(
      value.map((item) => {
        if (typeof item === 'string') {
          return [item, undefined];
        }
        return Object.entries(item)[0];
      }),
    ),
);

/**
 * Ensures a number is within a given range
 *
 * @param {number} min
 * @param {number} max
 */
const isInRange = (min, max) => {
  /**
   *
   * @param {number} value
   * @returns boolean
   */
  function check(value) {
    return value >= min && value <= max;
  }
  return refine(number(), 'range', check);
};

const BuildTypeStruct = object({
  id: isInRange(10, 64),
  extends: optional(string()),
  features: optional(unique(array(string()))),
  env: optional(EnvObjectStruct),
  isPrerelease: optional(boolean()),
  manifestOverrides: optional(union([string(), literal(false)])),
  buildNameOverride: optional(union([string(), literal(false)])),
});

const CopyAssetStruct = object({ src: string(), dest: string() });
const ExclusiveIncludeAssetStruct = coerce(
  object({ exclusiveInclude: string() }),
  string(),
  (exclusiveInclude) => ({ exclusiveInclude }),
);
const AssetStruct = union([CopyAssetStruct, ExclusiveIncludeAssetStruct]);

const FeatureStruct = object({
  // TODO(ritave): Check if the paths exist
  assets: optional(array(AssetStruct)),
});

const FeaturesStruct = record(
  string(),
  coerce(FeatureStruct, nullable(never()), () => ({})),
);

const BuildTypesStruct = refine(
  object({
    default: string(),
    buildTypes: record(string(), BuildTypeStruct),
    features: FeaturesStruct,
    env: EnvObjectStruct,
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
 * @param {import('superstruct').Infer<typeof BuildTypesStruct> | null} cachedBuildTypes - The cached build types, if any.
 * @returns {import('superstruct').Infer<typeof BuildTypesStruct>}
 */
function loadBuildTypesConfig(cachedBuildTypes = _cachedBuildTypes) {
  if (cachedBuildTypes !== null) {
    return cachedBuildTypes;
  }

  const buildsData = yaml.parse(fs.readFileSync(BUILDS_YML_PATH, 'utf8'));
  const [err, result] = validate(buildsData, BuildTypesStruct, {
    coerce: true,
  });
  if (err !== undefined) {
    throw new AssertionError({
      message: constructFailureMessage(err),
    });
  }

  applyBuildTypeExtensions(result);
  _cachedBuildTypes = result;
  return _cachedBuildTypes;
}

/**
 * Extends any extended build types with their parent build types. This is accomplished
 * by merging the extending build type into a copy of its parent build type.
 *
 * @param {import('superstruct').Infer<typeof BuildTypesStruct>} buildsConfig
 */
function applyBuildTypeExtensions({ buildTypes }) {
  for (const [buildType, config] of Object.entries(buildTypes)) {
    if (config.extends !== undefined) {
      const parentConfig = buildTypes[config.extends];
      if (!parentConfig) {
        throw new Error(`Build type "${buildType.extends}" not found`);
      }

      buildTypes[buildType] = merge(cloneDeep(parentConfig), config);
    }
  }
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
