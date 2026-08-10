import { isEqual } from 'lodash';
import { DependencyList, useRef } from 'react';

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
  // Deliberate opt-out: this hook's contract IS deep-equality dependency comparison via render-time ref reads/writes — auto-memoization
  // would freeze its output. Do not remove without redesigning the hook.
  // See MetaMask-planning#6551 (root-cause cluster A).
  'use no memo';

  const depsRef = useRef<DependencyList | undefined>(undefined);
  const resultRef = useRef<Type>();

  if (!isEqual(depsRef.current, deps)) {
    depsRef.current = deps;
    resultRef.current = factory();
  }

  return resultRef.current as Type;
}
