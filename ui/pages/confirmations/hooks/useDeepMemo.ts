import { isEqual } from 'lodash';
import { DependencyList, useEffect, useState } from 'react';

/**
 * Identical to `useMemo`, but compares dependencies using deep equality.
 * Should only be used temporarily or as a last resort if dependencies, such
 * as selectors and hooks, cannot be stabilized to return a consistent reference.
 * Ensure dependencies are small otherwise performance cost may be worse than re-rendering.
 *
 * @param factory - Function that returns the memoized value
 * @param deps - Dependency list to compare using deep equality
 * @returns Memoized value from factory function
 */
export function useDeepMemo<Type>(
  factory: () => Type,
  deps: DependencyList,
): Type {
  const [cache, setCache] = useState<{ deps: DependencyList; value: Type }>(
    () => ({
      deps,
      value: factory(),
    }),
  );

  const depsChanged = !isEqual(cache.deps, deps);
  const value = depsChanged ? factory() : cache.value;

  useEffect(() => {
    if (!depsChanged) {
      return;
    }
    queueMicrotask(() => {
      setCache({ deps, value });
    });
  }, [deps, depsChanged, value]);

  return value;
}
