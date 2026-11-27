import { WARMUP_RUNS } from './constants';

/**
 * Read a flow module's `iterations` export: a function returning this run's
 * count, warm-up included, or `undefined` to use the invocation's. Returns
 * `undefined` when the module has no such export.
 */
function readOwnIterations(
  fileName: string,
  flowModule: Record<string, unknown>,
): number | undefined {
  const { iterations } = flowModule;
  if (iterations === undefined) {
    return undefined;
  }
  if (typeof iterations !== 'function') {
    throw new Error(
      `${fileName} exports \`iterations\` as a ${typeof iterations}; it must be a function returning a count or undefined`,
    );
  }
  const own: unknown = iterations();
  if (own !== undefined && typeof own !== 'number') {
    throw new Error(
      `${fileName}'s \`iterations()\` returned a ${typeof own}; it must return a count or undefined`,
    );
  }
  return own;
}

/**
 * Resolve and log how many iterations a flow runs, and how many of its leading
 * ones are warm-up: the module's own `iterations()` count includes them.
 */
export function resolveFlowIterations(
  fileName: string,
  flowModule: Record<string, unknown>,
  options: { iterations: number; retries: number },
): { iterations: number; warmupRuns: number } {
  const own = readOwnIterations(fileName, flowModule);
  const iterations = own ?? options.iterations;
  const warmupRuns = own === undefined ? 0 : WARMUP_RUNS;

  console.log(
    `Running ${fileName} with ${iterations} iterations (retries: ${options.retries})`,
  );

  return { iterations, warmupRuns };
}
