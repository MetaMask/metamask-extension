import * as Sentry from '@sentry/browser';

export function trace<T>(
  name: string,
  fn: (context?: Sentry.Span) => T,
  parentContext?: Sentry.Span,
): T {
  let handled = false;
  let newContext: Sentry.Span | undefined;

  try {
    newContext = parentContext
      ? parentContext?.startChild({ op: name })
      : Sentry.startTransaction({ name, op: 'root' });

    const result = fn(newContext);

    if (result instanceof Promise) {
      handled = true;
      result.finally(() => newContext?.finish());
    }

    return result;
  } finally {
    if (!handled) {
      handled = true;
      newContext?.finish();
    }
  }
}
