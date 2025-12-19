import type * as Sentry from '@sentry/browser';

const sentry = globalThis.sentry as typeof Sentry | undefined;

export async function runTrackedTask<Return>(
  taskName: string,
  fn: () => Promise<Return>,
): Promise<Return> {
  if (!sentry) return fn();

  const attributes = {
    'task.name': taskName,
    'app.version': process.env.METAMASK_VERSION,
  };

  return sentry.startSpan(
    {
      name: `task/${taskName}`,
      op: 'task',
      forceTransaction: true,
      attributes,
    },
    async (span) => {
      const startedAt = performance.now();

      try {
        const result = await fn();

        span.setStatus({ code: 1 });
        span.setAttribute('task.duration_ms', performance.now() - startedAt);

        return result;
      } catch (err) {
        const durationMs = performance.now() - startedAt;
        span.setStatus({
          code: 2, // 2 === SPAN_STATUS_ERROR
          message: 'internal_error',
        });
        span.setAttribute('task.duration_ms', durationMs);
        span.setAttribute(
          'task.error_message',
          err instanceof Error ? err.message : String(err),
        );

        // Creates an *error event* (Issue), separate from the span:
        sentry.captureException(err, {
          tags: { 'task.name': taskName, 'task.status': 'failed' },
          extra: {
            'task.duration_ms': durationMs,
            'app.version': process.env.METAMASK_VERSION,
          },
          contexts: { browser: { userAgent: navigator.userAgent } },
        });

        throw err;
      }
    },
  );
}
