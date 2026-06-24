import React, { Suspense } from 'react';
import { act, render, screen } from '@testing-library/react';
import { mmLazy } from './mm-lazy';

jest.mock('../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: () => ({}),
}));

jest.mock('../../../shared/lib/trace', () => ({
  endTrace: jest.fn(),
  getPerformanceTimestamp: jest.fn(() => 0),
  trace: jest.fn(),
  TraceName: {
    LazyLoadComponent: 'LazyLoadComponent',
  },
}));

type Deferred<Value> = {
  promise: Promise<Value>;
  resolve: (value: Value) => void;
};

function createDeferred<Value>(): Deferred<Value> {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

describe('mmLazy', () => {
  it('exposes an idempotent preload method and reuses the in-flight import', async () => {
    const LoadedRoute = () => <div>Loaded route</div>;
    const deferred = createDeferred<{
      default: typeof LoadedRoute;
    }>();
    const importComponent = jest.fn().mockReturnValue(deferred.promise);
    const LazyComponent = mmLazy<{ default: typeof LoadedRoute }>(
      importComponent,
    );

    const preloadPromise = LazyComponent.preload();

    expect(LazyComponent.preload()).toBe(preloadPromise);
    expect(importComponent).toHaveBeenCalledTimes(1);

    render(
      <Suspense fallback={<div data-testid="lazy-fallback" />}>
        <LazyComponent />
      </Suspense>,
    );

    expect(screen.getByTestId('lazy-fallback')).toBeInTheDocument();
    expect(importComponent).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve({
        default: LoadedRoute,
      });

      await preloadPromise;
    });

    expect(await screen.findByText('Loaded route')).toBeInTheDocument();
    expect(importComponent).toHaveBeenCalledTimes(1);
  });

  it('preloads modules with a single named export', async () => {
    const LazyComponent = mmLazy(async () => ({
      NamedRoute: () => <div>Named route</div>,
    }));

    await act(async () => {
      await LazyComponent.preload();
    });

    render(
      <Suspense fallback={<div data-testid="lazy-fallback" />}>
        <LazyComponent />
      </Suspense>,
    );

    expect(await screen.findByText('Named route')).toBeInTheDocument();
  });
});
