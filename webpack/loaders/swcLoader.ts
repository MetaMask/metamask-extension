import type { LoaderContext } from 'webpack';
import type { JSONSchema7 } from 'schema-utils/declarations/validate';
import type { FromSchema } from 'json-schema-to-ts';
import { validate } from 'schema-utils';
import { transform, type Options } from '@swc/core';
import { satisfies } from 'semver';

// the schema here is limited to only the options we actually use
// there are loads more options available to SWC we could add.
const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    env: {
      type: 'object',
      properties: {
        targets: {
          description: 'The browsers to target (browserslist format).',
          type: 'string',
        },
      },
      additionalProperties: false,
    },
    jsc: {
      type: 'object',
      properties: {
        externalHelpers: {
          type: "boolean",
          default: false
        },
        transform: {
          type: 'object',
          properties: {
            optimizer: {
              type: 'object',
              properties: {
                globals: {
                  description: "",
                  type: 'object',
                  properties: {
                    envs: {
                      description: "Replaces environment variables (`if (process.env.DEBUG) `) with specified values/expressions at compile time.",
                      anyOf: [
                        {
                          type: "array",
                          items: {
                            type: "string"
                          }
                        },
                        {
                          type: "object",
                          additionalProperties: {
                            type: "string"
                          }
                        }
                      ],
                    },
                    vars: {
                      description: "Replaces variables `if(__DEBUG__){}` with specified values/expressions at compile time.",
                      type: "object",
                      additionalProperties: {
                        type: "string"
                      }
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            react: {
              description: 'Effective only if `syntax` supports ƒ.',
              type: 'object',
              properties: {
                development: {
                  description:
                    'Toggles plugins that aid in development, such as @swc/plugin-transform-react-jsx-self and @swc/plugin-transform-react-jsx-source.  Defaults to `false`.',
                  type: 'boolean',
                },
                refresh: {
                  description: 'Enable fast refresh feature for React app',
                  type: 'boolean',
                },
              },
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
        parser: {
          description: 'Defaults to EsParserConfig (syntax: ecmascript)',
          type: 'object',
          properties: {
            syntax: {
              type: 'string',
              default: 'ecmascript',
              enum: ['ecmascript', 'typescript'],
            },
          },
          oneOf: [
            {
              properties: {
                syntax: {
                  const: 'typescript',
                },
                tsx: {
                  default: false,
                  type: 'boolean',
                },
              },
              additionalProperties: false,
              required: ['syntax'],
            },
            {
              properties: {
                syntax: {
                  const: 'ecmascript',
                },
                jsx: {
                  default: false,
                  type: 'boolean',
                },
              },
              additionalProperties: false,
              required: ['syntax'],
            },
          ],
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const satisfies JSONSchema7;

export type SwcLoaderOptions = FromSchema<typeof schema, { keepDefaultedPropertiesOptional: true }>;

const configuration = {
  name: swcLoader.name,
};

export default function swcLoader(
  this: LoaderContext<SwcLoaderOptions>,
  source: string,
  inputSourceMap: string,
) {
  const options = this.getOptions();
  validate(schema, options, configuration);

  const filename = this.resourcePath;
  const swcOptions = {
    ...options,
    envName: this.mode,
    filename,
    inputSourceMap,
    sourceMaps: this.sourceMap,
    sourceFileName: filename,
    // TODO: remove cast when swc's `Options` type is fixed
    // see: https://github.com/swc-project/swc/issues/8494
  } as Options;

  const callback = this.async();
  transform(source, swcOptions).then(
    ({ code, map }) => callback(null, code, map),
    callback,
  );
}
