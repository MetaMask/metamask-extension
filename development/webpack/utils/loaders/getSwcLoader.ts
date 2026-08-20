import type { SwcLoaderOptions } from './swcLoader';

export type SwcConfig = {
  browsersListQuery: string;
  isDevelopment: boolean;
  refresh: boolean;
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
    loader: require.resolve('./swcLoader'),
    options: {
      env: {
        targets: swcConfig.browsersListQuery,
      },
      jsc: {
        externalHelpers: true,
        transform: {
          react: {
            development: swcConfig.isDevelopment,
            refresh: swcConfig.refresh,
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
