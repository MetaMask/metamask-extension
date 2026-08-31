import { isEqual } from 'lodash';
import { DependencyList, useState } from 'react';

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

  if (!isEqual(cache.deps, deps)) {
    setCache({ deps, value: factory() });
  }

  return cache.value;
}
