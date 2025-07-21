import {
  useState,
  useEffect,
  DependencyList,
  useCallback,
  useRef,
} from 'react';

type Status = 'idle' | 'pending' | 'success' | 'error';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type ResultBase<S extends Status, T = undefined> = {
  status: S;
  pending: S extends 'pending' ? true : false;
  idle: S extends 'idle' ? true : false;
  value: S extends 'success' ? T : undefined;
  error: S extends 'error' ? Error : undefined;
};

type ResultIdle = ResultBase<'idle'>;
type ResultPending = ResultBase<'pending'>;
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type ResultSuccess<T> = ResultBase<'success', T>;
type ResultError = ResultBase<'error'>;

/**
 * Composed types for different use cases
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type AsyncResult<T> =
  | ResultIdle
  | ResultPending
  | ResultSuccess<T>
  | ResultError;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type AsyncResultNoIdle<T> = Exclude<AsyncResult<T>, ResultIdle>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function createSuccessResult<T>(value: T): ResultSuccess<T> {
  return { ...RESULT_BASE, status: 'success', value };
}

export function createErrorResult(error: Error): ResultError {
  return { ...RESULT_BASE, status: 'error', error };
}

/**
 * Hook that provides a callback for manual execution of an async function,
 * along with state management for the operation.
 *
 * @param asyncFn - The async function to execute
 * @param deps - Dependencies that trigger recreation of the callback
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useAsyncCallback<T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList = [],
): [() => Promise<void>, AsyncResult<T>] {
  const [result, setResult] = useState<AsyncResult<T>>(RESULT_IDLE);

  // Track component mount state
  const isMounted = useRef(true);

  // Update ref when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    if (!isMounted.current) {
      return;
    }
    setResult(RESULT_PENDING);
    try {
      const value = await asyncFn();
      if (isMounted.current) {
        setResult(createSuccessResult(value));
      }
    } catch (error) {
      if (isMounted.current) {
        setResult(createErrorResult(error as Error));
      }
    }
  }, deps);

  return [execute, result];
}

/**
 * Hook that executes an asynchronous function and returns its result
 * or an error (errors are caught and returned as part of the result).
 * Implemented in terms of useAsyncCallback.
 *
 * @param asyncFn - The async function to execute
 * @param deps - Dependencies that trigger re-execution
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useAsyncResult<T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList = [],
): AsyncResultNoIdle<T> {
  const [execute, result] = useAsyncCallback(asyncFn, deps);

  useEffect(() => {
    execute();
  }, [execute]);

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
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useAsyncResultOrThrow<T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList = [],
): AsyncResultNoError<T> {
  const result = useAsyncResult(asyncFn, deps);

  if (result.status === 'error') {
    // Throw the error so it can be caught by a React error boundary.
    throw result.error;
  }

  // After throwing errors, we know the status can only be 'success' or 'pending'
  return result;
}
