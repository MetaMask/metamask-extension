import type { Caveat, DeleGatorEnvironment } from '..';

export type Caveats = CaveatBuilder | Caveat[];

type CaveatWithOptionalArgs = Omit<Caveat, 'args'> & {
  args?: Caveat['args'];
};

/**
 * Resolve the array of Caveat from a Caveats argument.
 * Caveats may be a CaveatBuilder or an array of Caveat.
 *
 * @param caveats - the caveats to be resolved
 * @returns the resolved caveats array
 */
export const resolveCaveats = (caveats: Caveats) => {
  if (Array.isArray(caveats)) {
    return caveats;
  }
  return caveats.build();
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type RemoveFirst<T extends unknown[]> = T extends [unknown, ...infer Rest]
  ? Rest
  : never;

type CaveatBuilderFn = (
  environment: DeleGatorEnvironment,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any
) => Caveat;

type CaveatBuilderMap = {
  [key: string]: CaveatBuilderFn;
};

export type CaveatBuilderConfig = {
  allowEmptyCaveats?: boolean;
};

/**
 * Represents a builder for creating caveats.
 *
 * @template TCaveatBuilderMap - The type of the caveat builder map.
 */
export class CaveatBuilder<
  TCaveatBuilderMap extends CaveatBuilderMap = Record<string, CaveatBuilderFn>,
> {
  private results: Caveat[] = [];

  private hasBeenBuilt = false;

  private readonly environment: DeleGatorEnvironment;

  private readonly config: CaveatBuilderConfig = {};

  private readonly enforcerBuilders: TCaveatBuilderMap =
    {} as TCaveatBuilderMap;

  constructor(
    environment: DeleGatorEnvironment,
    config: CaveatBuilderConfig = {},
    enforcerBuilders: TCaveatBuilderMap = {} as TCaveatBuilderMap,
    builtCaveats: Caveat[] = [] as Caveat[],
  ) {
    this.environment = environment;
    this.config = config;
    this.enforcerBuilders = enforcerBuilders;
    this.results = builtCaveats;
  }

  /**
   * Extends the CaveatBuilder with a new enforcer function.
   *
   * @template TEnforcerName - The name of the enforcer.
   * @template TFunction - The type of the enforcer function.
   * @param name - The name of the enforcer.
   * @param fn - The enforcer function.
   * @returns The extended CaveatBuilder instance.
   */
  extend<TEnforcerName extends string, TFunction extends CaveatBuilderFn>(
    name: TEnforcerName,
    fn: TFunction,
  ): CaveatBuilder<TCaveatBuilderMap & Record<TEnforcerName, TFunction>> {
    return new CaveatBuilder<
      TCaveatBuilderMap & Record<TEnforcerName, TFunction>
    >(
      this.environment,
      this.config,
      { ...this.enforcerBuilders, [name]: fn },
      this.results,
    );
  }

  /**
   * Adds a caveat directly using a Caveat object.
   *
   * @param caveat - The caveat to add
   * @returns The CaveatBuilder instance for chaining
   */
  addCaveat(caveat: CaveatWithOptionalArgs): CaveatBuilder<TCaveatBuilderMap>;

  /**
   * Adds a caveat using a named enforcer function.
   *
   * @param name - The name of the enforcer function to use
   * @param args - The arguments to pass to the enforcer function
   * @returns The CaveatBuilder instance for chaining
   */
  addCaveat<TEnforcerName extends keyof TCaveatBuilderMap>(
    name: TEnforcerName,
    ...args: RemoveFirst<Parameters<TCaveatBuilderMap[TEnforcerName]>>
  ): CaveatBuilder<TCaveatBuilderMap>;

  addCaveat<TEnforcerName extends keyof TCaveatBuilderMap>(
    nameOrCaveat: TEnforcerName | CaveatWithOptionalArgs,
    ...args: typeof nameOrCaveat extends CaveatWithOptionalArgs
      ? []
      : RemoveFirst<Parameters<TCaveatBuilderMap[TEnforcerName]>>
  ): CaveatBuilder<TCaveatBuilderMap> {
    if (typeof nameOrCaveat === 'object') {
      const caveat = {
        args: '0x' as const, // defaults to "0x"
        ...nameOrCaveat,
      };

      this.results.push(caveat);

      return this;
    }
    const name = nameOrCaveat;

    const func = this.enforcerBuilders[name];
    if (typeof func === 'function') {
      const result = func(this.environment, ...args);

      this.results.push(result);

      return this;
    }
    throw new Error(`Function "${String(name)}" does not exist.`);
  }

  /**
   * Returns the caveats that have been built using this CaveatBuilder.
   *
   * @returns The array of built caveats.
   */
  build(): Caveat[] {
    if (this.hasBeenBuilt) {
      throw new Error('This CaveatBuilder has already been built.');
    }

    if (this.results.length === 0 && !this.config.allowEmptyCaveats) {
      throw new Error(
        'No caveats found. If you definitely want to create an empty caveat collection, set `allowEmptyCaveats`.',
      );
    }

    this.hasBeenBuilt = true;

    return this.results;
  }
}
