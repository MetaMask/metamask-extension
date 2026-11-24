import { readFileSync } from 'fs';
import path from 'path';
import { TraceName } from '../../../shared/lib/trace';
import { runAsOwnRoot } from './own-root-trace';

const globals = globalThis as { sentry?: unknown };

describe('runAsOwnRoot', () => {
  afterEach(() => {
    delete globals.sentry;
  });

  it('imports no span function from the SDK', () => {
    // The background bundles its own SDK copy, which has no client, so a root
    // started on it is never sent. Jest loads one copy and cannot show this.
    const source = readFileSync(
      path.join(__dirname, 'own-root-trace.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/from '@sentry\/browser'/u);
    const coreImports =
      source.match(/import \{([^}]*)\} from '@sentry\/core'/u)?.[1] ?? '';
    expect(coreImports).not.toMatch(
      /\b(start\w*|withActiveSpan|spanToJSON|getActiveSpan)\b/u,
    );
  });

  it('starts the root on the instance at `globalThis.sentry`', () => {
    const span = { end: jest.fn(), setStatus: jest.fn() };
    const sentry = {
      startNewTrace: jest.fn((callback: () => unknown) => callback()),
      startInactiveSpan: jest.fn(() => span),
      withActiveSpan: jest.fn((_span: unknown, callback: () => unknown) =>
        callback(),
      ),
    };
    globals.sentry = sentry;

    expect(runAsOwnRoot(TraceName.GeolocationFetch, (root) => root)).toBe(span);
    expect(sentry.startInactiveSpan).toHaveBeenCalledWith({
      name: TraceName.GeolocationFetch,
      op: 'custom',
      parentSpan: null,
    });
    expect(sentry.withActiveSpan).toHaveBeenCalledWith(
      span,
      expect.any(Function),
    );
    expect(span.end).toHaveBeenCalledTimes(1);
  });

  it('runs the operation untraced when no instance is installed', () => {
    expect(runAsOwnRoot(TraceName.GeolocationFetch, () => 'result')).toBe(
      'result',
    );
  });
});
