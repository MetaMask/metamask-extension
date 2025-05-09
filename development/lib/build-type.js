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
 * Given a source array and a set or array of its unique values, returns the elements
 * that are duplicated in the source array.
 *
 * @template {unknown} Element
 * @param {Element[]} source
 * @param {Set<Element> | Element[]} uniqueValues
 * @returns {Element[]}
 */
const getDuplicates = (source, uniqueValues) => {
  const uniqueValuesCopy = new Set(uniqueValues);
  return source.filter((item) => {
    if (uniqueValuesCopy.has(item)) {
      uniqueValuesCopy.delete(item);
      return false;
    }
    return true;
  });
};

/**
 * Ensures that the array item contains only elements that are distinct from each other
 *
 * @template {unknown} Element
 * @type {import('./build-type').Unique<Struct<Element[]>>}
 */
const unique = (struct, eq) =>
  refine(struct, 'unique', (value) => {
    const uniqueValues = new Set(uniqWith(value, eq));
    if (uniqueValues.size === value.length) {
      return true;
    }
    throw new Error(
      `Array contains duplicated values: ${JSON.stringify(
        getDuplicates(value, uniqueValues),
        null,
        2,
      )}`,
    );
  });

const RawEnvDefinitionStruct = refine(
  record(string(), unknown()),
  'Env variable declaration',
  (value) => {
    if (Object.keys(value).length === 1) {
      return true;
    }
    throw new Error(
      `Env variable declarations may only have a single property. Received: ${JSON.stringify(
        value,
        null,
        2,
      )}`,
    );
  },
);

const RawEnvArrayStruct = unique(
  array(union([string(), RawEnvDefinitionStruct])),
  (a, b) => {
    const keyA = typeof a === 'string' ? a : Object.keys(a)[0];
    const keyB = typeof b === 'string' ? b : Object.keys(b)[0];
    return keyA === keyB;
  },
);

// The `env` field is parsed into an array of strings or objects with a single key.
// This struct coerces this array into a single object.
const EnvObjectStruct = coerce(
  record(string(), unknown()),
  RawEnvArrayStruct,
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
const RangeStruct = (min, max) => {
  return refine(
    number(),
    'range',
    (value) =>
      (value >= min && value <= max) ||
      `Number must be ${min} <= ${max}. Received: ${value}`,
  );
};

const BuildTypeStruct = object({
  id: RangeStruct(10, 64),
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
    if (!Object.hasOwn(value.buildTypes, value.default)) {
      return `Default build type "${value.default}" does not exist in builds declarations`;
    }

    const buildTypeIds = Object.values(value.buildTypes).map(
      (buildType) => buildType.id,
    );
    const uniqueBuildTypeIds = new Set(buildTypeIds);
    if (uniqueBuildTypeIds.size !== buildTypeIds.length) {
      return `Build type ids must be unique. Duplicate ids: ${JSON.stringify(
        getDuplicates(buildTypeIds, uniqueBuildTypeIds),
        null,
        2,
      )}`;
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
        throw new Error(`Extended build type "${config.extends}" not found`);
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
