import type * as Sentry from '@sentry/browser';

const sentry = globalThis.sentry as typeof Sentry | undefined;

export async function runTrackedTask<Return>(
  taskName: string,
  fn: () => Promise<Return>,
): Promise<Return> {
  if (!sentry) {
    return fn();
  }

  const attributes = {
    'task.name': taskName,
  };

  return sentry.startSpan(
    {
      name: `task/${taskName}`,
      op: 'task',
      forceTransaction: true,
      attributes,
    },
    async (span) => {
      try {
        const result = await fn();

        span.setStatus({ code: 1 });

        return result;
      } catch (err) {
        span.setStatus({
          code: 2, // 2 === SPAN_STATUS_ERROR
          message: 'internal_error',
        });
        span.setAttribute(
          'task.error_message',
          err instanceof Error ? err.message : String(err),
        );

        // Creates an *error event* (Issue), separate from the span:
        sentry.captureException(err, {
          tags: { 'task.name': taskName, 'task.status': 'failed' },
        });

        throw err;
      }
    },
  );
}
