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

        // Creates an *error event* (Issue), separate from the span.
        sentry.captureException(err, {
          tags: { 'task.name': taskName, 'task.status': 'failed' },
        });

        // rethrow the error after capturing it so the process crashes, as
        // we can't know how to recover from here. This will result in the
        // exception being captured by sentry _again_ by the global error
        // handler, and that's fine. We capture here because we want to add this
        // taskName tag to the error event so we can easily find and filter it
        // later. All this is sentry tracking code in here is temporary until we
        // are confident that the migration code is stable enough, and we can
        // roll it out to 100%.
        throw err;
      }
    },
  );
}
