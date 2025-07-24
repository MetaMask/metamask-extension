import type { LoaderContext } from 'webpack';
import { type JSONSchema7 } from 'schema-utils/declarations/validate';
import { validate } from 'schema-utils';
import type { FromSchema } from 'json-schema-to-ts';
import { transform, type Options } from '@swc/core';
import { type Args } from '../cli';
import { __HMR_READY__ } from '../helpers';

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
          type: 'boolean',
          default: false,
        },
        experimental: {
          type: 'object',
          properties: {
            keepImportAttributes: {
              type: 'boolean',
              default: false,
            },
          },
          additionalProperties: false,
        },
        transform: {
          type: 'object',
          properties: {
            optimizer: {
              type: 'object',
              properties: {
                globals: {
                  description: '',
                  type: 'object',
                  properties: {
                    envs: {
                      description:
                        'Replaces environment variables (`if (process.env.DEBUG) `) with specified values/expressions at compile time.',
                      anyOf: [
                        {
                          type: 'array',
                          items: {
                            type: 'string',
                          },
                        },
                        {
                          type: 'object',
                          additionalProperties: {
                            type: 'string',
                          },
                        },
                      ],
                    },
                    vars: {
                      description:
                        'Replaces variables `if(__DEBUG__){}` with specified values/expressions at compile time.',
                      type: 'object',
                      additionalProperties: {
                        type: 'string',
                      },
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
                importAttributes: {
                  description:
                    'Enable parsing of import attributes. Defaults to `false`.',
                  type: 'boolean',
                  default: false,
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
                importAttributes: {
                  description:
                    'Enable parsing of import attributes. Defaults to `false`.',
                  type: 'boolean',
                  default: false,
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
    module: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['es6', 'commonjs'],
        },
      },
      required: ['type'],
    },
  },
  additionalProperties: false,
} as const satisfies JSONSchema7;

type SchemaOptions = { keepDefaultedPropertiesOptional: true };
export type SwcLoaderOptions = FromSchema<typeof schema, SchemaOptions>;

type Context = LoaderContext<SwcLoaderOptions>;
export default function swcLoader(this: Context, src: string, srcMap?: string) {
  const pluginOptions = this.getOptions();
  validate(schema, pluginOptions, { name: 'swcLoader' });

  const options: Options = {
    ...pluginOptions,
    envName: this.mode,
    filename: this.resourcePath,
    inputSourceMap:
      // some files in node_modules claim to have sourcemaps when they do
      // not[0], and SWC has a bug where logs to stderror if it tries to use a
      // sourcemap that does not exist[1]. So we disable sourcemaps for
      // node_modules. Ideally, we would not disable them, as they *are* useful
      // for debugging.
      // [0]: https://github.com/trezor/trezor-suite/issues/20298
      // [1]: https://github.com/swc-project/swc/issues/9416
      this.resourcePath.includes('/node_modules/') ? false : srcMap,
    sourceFileName: this.resourcePath,
    sourceMaps: this.sourceMap,
    swcrc: false,
  };

  const cb = this.async();
  transform(src, options).then(({ code, map }) => cb(null, code, map), cb);
}

export type SwcConfig = {
  args: Pick<Args, 'watch'>;
  browsersListQuery: string;
  isDevelopment: boolean;
};

/**
 * Gets the Speedy Web Compiler (SWC) loader for the given syntax.
 *
 * @param syntax - The syntax to use, either 'typescript' or 'ecmascript'.
 * @param enableJsx - Whether to enable JSX support.
 * @param envs - Environment variables to inject into the code.
 * @param swcConfig - The SWC configuration object containing browsers list and development mode.
 * @param type - The module type to use, either 'es6' or 'commonjs'. Defaults to 'es6'.
 */
export function getSwcLoader(
  syntax: 'typescript' | 'ecmascript',
  enableJsx: boolean,
  envs: Record<string, string>,
  swcConfig: SwcConfig,
  type: 'es6' | 'commonjs' = 'es6',
) {
  return {
    loader: __filename,
    options: {
      env: {
        targets: swcConfig.browsersListQuery,
      },
      jsc: {
        externalHelpers: true,
        transform: {
          react: {
            development: swcConfig.isDevelopment,
            refresh:
              __HMR_READY__ && swcConfig.isDevelopment && swcConfig.args.watch,
          },
          optimizer: {
            globals: {
              envs,
            },
          },
        },
        parser: {
          syntax,
          [syntax === 'typescript' ? 'tsx' : 'jsx']: enableJsx,
          importAttributes: true,
        },
      },
      module: {
        type,
      },
    } as const satisfies SwcLoaderOptions,
  };
}
