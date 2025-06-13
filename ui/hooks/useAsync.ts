import { useState, useEffect, DependencyList, useRef, useMemo } from 'react';

type Status = 'idle' | 'pending' | 'success' | 'error';

type ResultBase<S extends Status, T = undefined> = {
  status: S;
  pending: S extends 'pending' ? true : false;
  idle: S extends 'idle' ? true : false;
  value: S extends 'success' ? T : undefined;
  error: S extends 'error' ? Error : undefined;
};

type ResultIdle = ResultBase<'idle'>;
type ResultPending = ResultBase<'pending'>;
type ResultSuccess<T> = ResultBase<'success', T>;
type ResultError = ResultBase<'error'>;

/**
 * Composed types for different use cases
 */
export type AsyncResult<T> =
  | ResultIdle
  | ResultPending
  | ResultSuccess<T>
  | ResultError;

export type AsyncResultNoIdle<T> = Exclude<AsyncResult<T>, ResultIdle>;

export type AsyncResultNoError<T> = ResultPending | ResultSuccess<T>;

// Base object with common properties for all states
export const RESULT_BASE = {
  idle: false as const,
  pending: false as const,
  value: undefined,
  error: undefined,
};

// Singleton constants for stateless results
export const RESULT_IDLE: ResultIdle = {
  ...RESULT_BASE,
  status: 'idle',
  idle: true,
};

export const RESULT_PENDING: ResultPending = {
  ...RESULT_BASE,
  status: 'pending',
  pending: true,
};
// Helper functions to create state objects
export function createSuccessResult<T>(value: T): ResultSuccess<T> {
  return { ...RESULT_BASE, status: 'success', value };
}

export function createErrorResult(error: Error): ResultError {
  return { ...RESULT_BASE, status: 'error', error };
}

function isDependencyListChanged(
  deps: DependencyList,
  prevDeps: DependencyList,
) {
  if (Object.is(prevDeps, deps)) {
    return false;
  }
  if (prevDeps.length !== deps.length) {
    return true;
  }
  for (let i = 0; i < deps.length; ++i) {
    if (!Object.is(deps[i], prevDeps[i])) {
      return true;
    }
  }
  // TODO: If too expensive to perform on every render, replace with `return false;`
  return JSON.stringify(deps) !== JSON.stringify(prevDeps);
}

/**
 * Hook that provides a callback for manual execution of an async function,
 * along with state management for the operation.
 *
 * @param asyncFn - The async function to execute
 * @param deps - Dependencies that trigger recreation of the callback
 */
export function useAsyncCallback<T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList = [],
): [() => Promise<void>, AsyncResult<T>, boolean] {
  'use no memo';

  const [result, setResult] = useState<AsyncResult<T>>(RESULT_IDLE);

  // Track component mount state
  const isMounted = useRef(true);
  const [isInit, setIsInit] = useState(true);

  // Use refs to internally maintain stable references for `asyncFn`, `deps`,
  // which will otherwise be updated on every re-render even if no reactive values have changed.
  const asyncFnRef = useRef<typeof asyncFn | null>(asyncFn);
  const prevDepsRef = useRef<DependencyList>([]);

  const isDepsChanged =
    isInit || isDependencyListChanged(deps, prevDepsRef.current);

  // Use ref instead of `useCallback`, which means the function reference
  // does not needs to be re-created on every deps change.
  // Its only external reactive variable is `asyncFn`,
  // which is now being supplied internally via useRef,
  // and will be up-to-date when `executeRef.current` is called (on deps change).
  const executeRef = useRef(async () => {
    if (!isMounted.current || !asyncFnRef.current) {
      return;
    }
    setResult(RESULT_PENDING);
    try {
      const value = await asyncFnRef.current();
      if (isMounted.current) {
        setResult(createSuccessResult(value));
      }
    } catch (error) {
      if (isMounted.current) {
        setResult(createErrorResult(error as Error));
      }
    }
  });

  useEffect(() => {
    setIsInit(false);
    // When component unmounts, clear all refs and reset `result` to prevent memory leaks.
    return () => {
      setResult(RESULT_IDLE);
      isMounted.current = false;
      asyncFnRef.current = null;
      prevDepsRef.current = [];
      executeRef.current = () => Promise.resolve(undefined);
    };
  }, []);

  useEffect(() => {
    if (isDepsChanged) {
      prevDepsRef.current = deps;
      asyncFnRef.current = asyncFn;
    }
    // `asyncFn`, `deps` omitted because their references update on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDepsChanged]);

  return useMemo(
    () => [executeRef.current, result, isDepsChanged],
    // Exclude `result` from dependency array.
    // This ensures that the memoized output array is used
    // if the `result` object reference has changed, but its contents have not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result.status, result.value, result.error, isDepsChanged],
  );
}

/**
 * Hook that executes an asynchronous function and returns its result
 * or an error (errors are caught and returned as part of the result).
 * Implemented in terms of useAsyncCallback.
 *
 * @param asyncFn - The async function to execute
 * @param deps - Dependencies that trigger re-execution
 */
export function useAsyncResult<T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList = [],
): AsyncResultNoIdle<T> {
  'use no memo';

  const [execute, result, isDepsChanged] = useAsyncCallback(asyncFn, deps);

  useEffect(() => {
    if (isDepsChanged) {
      execute();
    }
    // The reference for `execute` stays stable until unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDepsChanged]);

  // When the result is in the idle state, return pending state instead
  // This is because we execute the asyncFn immediately on mount, so the component
  // should reflect a loading state rather than an idle one
  return result.status === 'idle' ? RESULT_PENDING : result;
}

/**
 * Hook that executes an asynchronous function and returns its result
 * or throws an error to be caught by a React error boundary.
 *
 * @param asyncFn - The async function to execute
 * @param deps - Dependencies that trigger re-execution of the async function
 * @returns The result of the async function if successful, or throws the error
 */
export function useAsyncResultOrThrow<T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList = [],
): AsyncResultNoError<T> {
  'use no memo';

  const result = useAsyncResult(asyncFn, deps);

  if (result.status === 'error') {
    // Throw the error so it can be caught by a React error boundary.
    throw result.error;
  }

  // After throwing errors, we know the status can only be 'success' or 'pending'
  return result;
}
