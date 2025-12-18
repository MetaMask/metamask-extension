import type { Compiler } from 'webpack';
import { getReactCompilerLogger } from '../../loaders/reactCompilerLoader';

export class ReactCompilerPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.afterEmit.tap(ReactCompilerPlugin.name, () => {
      const logger = getReactCompilerLogger();
      logger.logSummary();
      // Reset statistics after logging to prevent accumulation in watch mode
      logger.reset();
    });
  }
}
