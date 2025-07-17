declare module 'human-standard-token-abi';

declare module '@lavamoat/webpack' {
  import {
    type LavaMoatPluginOptions,
    type ScuttlerObjectConfig,
  } from '@lavamoat/webpack/src/buildTime/types';
  import type { Compiler } from 'webpack';

  type PatchedScuttlerObjectConfig = Omit<
    ScuttlerObjectConfig,
    'exceptions'
  > & { exceptions?: (string | RegExp)[] };

  type PatchedLavaMoatPluginOptions = Omit<
    LavaMoatPluginOptions,
    'scuttleGlobalThis'
  > & { scuttleGlobalThis?: PatchedScuttlerObjectConfig | boolean | undefined };

  class LavaMoatPlugin {
    constructor(options?: Partial<PatchedLavaMoatPluginOptions>);

    apply(compiler: Compiler): void;
  }

  export default LavaMoatPlugin;
}
