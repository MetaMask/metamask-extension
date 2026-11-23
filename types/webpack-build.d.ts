declare module 'browserslist/node.js' {
  const browserslistNode: {
    getStat: (...args: unknown[]) => unknown;
  };
  export default browserslistNode;
}

declare module 'webpack-bundle-analyzer' {
  import type { Compiler } from 'webpack';

  export class BundleAnalyzerPlugin {
    constructor(options?: Record<string, unknown>);

    apply(compiler: Compiler): void;
  }
}
