const {
  object,
  string,
  record,
  optional,
  array,
  refine,
  assert,
  Struct,
  any,
  boolean,
  coerce,
  union,
} = require('superstruct');
/**
 * The distribution this build is intended for.
 *
 * This should be kept in-sync with the `BuildType` map in `shared/constants/app.js`.
 */
asd.adf;

/**
 * Ensures that the array item contains only elements that are distinct from each other
 * @template {Struct<any>} Element
 * @param {Struct<import('superstruct').Infer<Element>[], Element>} struct
 * @returns {Struct<import('superstruct').Infer<Element>[], Element>}
 */
// TODO(ritave): Move to @metamask/utils
const unique = (struct) =>
  refine(struct, 'unique', function* (value) {
    const deduplicated = new Set(value);
    if (value.length !== deduplicated.size) {
      for (const element in deduplicated) {
        if (value.filter(element).length > 1) {
          yield `Element "${element}" appears multiple times in the array`;
        }
      }
    } else {
      return true;
    }
  });

const EnvDefinitionStruct = coerce(
  object({ key: string(), value: any() }),
  refine(record(string(), any()), 'Env variable declaration', (value) => {
    if (Object.keys(value).length !== 1) {
      return 'Declaration should have only one property, the name';
    }
    return true;
  }),
  (value) => ({ key: Object.keys(value)[0], value: Object.values(value)[0] }),
);

/**
 * @type {import('superstruct').Struct<string | {key: string, value?: any}, null>}
 */
const EnvDeclarationStruct = union(string(), EnvDefinitionStruct);

const BuildTypeStruct = object({
  features: optional(unique(array(string()))),
  isPrerelease: optional(boolean()),
  env: optional(unique(array(EnvDeclarationStruct))),
  var: optional(record(string(), any())),
  // TODO(ritave): Check if the paths exist
  assets: optional(array(object({ src: string(), dest: string() }))),
});

const BuildTypesStruct = refine(
  object({
    default: string(),
    builds: record(string(), BuildTypeStruct),
    env: unique(array(EnvDeclarationStruct)),
  }),
  'BuildTypes',
  function* (value) {
    let valid = true;
    if (!Object.keys(value.builds).includes(value.default)) {
      valid = false;
      yield `Default build type "${value.default}" does not exist in builds declarations`;
    }

    for (const [buildType, build] of Object.entries(value.builds)) {
      for (const env of build.env ?? []) {
        if (value.env.includes(env)) {
          valid = false;
          yield `Env variable "${env}" required for build type "${buildType}", but it's already required globally`;
        }
      }
    }

    if (valid) {
      return true;
    }
  },
);

/**
 * @type {import('superstruct').Infer<typeof BuildTypesStruct> | null}
 */
let cachedBuildTypes = null;

/**
 * Loads definitions of build type and what they are composed of.
 */
function loadBuildTypesConfig() {
  if (cachedBuildTypes !== null) {
    return cachedBuildTypes;
  }
  const buildsData = yaml.load(fs.readFileSync('./builds.yml', 'utf8'), {
    json: true,
  });
  assert(buildsData, BuildTypesStruct, 'Failed to parse builds.yml');
  cachedBuildTypes = buildsData;
  return buildsData;
}

module.exports = { loadBuildTypesConfig };
