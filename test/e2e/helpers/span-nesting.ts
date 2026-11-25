// A stale parent id still resolves, so nesting checks also compare windows.

/** Fields of Sentry's `SpanJSON` (and a transaction event's root) this reads. */
export type SpanWindow = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  span_id?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  parent_span_id?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  start_timestamp: number;
  /** End time. Absent while the span is still running. */
  timestamp?: number;
};

export type NestingClass = 'orphan' | 'graft' | 'nested';

/** Seconds: float rounding within one process; cross-host callers pass more. */
export const DEFAULT_NESTING_TOLERANCE_SECONDS = 0.05;

export type NestingOptions = {
  toleranceSeconds?: number;
  /** The child may outlive its parent (sent on its own): check its start only. */
  childMayOutliveParent?: boolean;
};

// `orphan`, `graft` (parent resolves, window outside it) or `nested`.
export function classifyNesting(
  child: SpanWindow,
  parent: SpanWindow | undefined,
  options: NestingOptions = {},
): NestingClass {
  if (
    !parent ||
    !child.parent_span_id ||
    child.parent_span_id !== parent.span_id
  ) {
    return 'orphan';
  }
  const tolerance =
    options.toleranceSeconds ?? DEFAULT_NESTING_TOLERANCE_SECONDS;
  const startsInside =
    child.start_timestamp >= parent.start_timestamp - tolerance &&
    (parent.timestamp === undefined ||
      child.start_timestamp <= parent.timestamp + tolerance);
  const endsInside =
    options.childMayOutliveParent ||
    child.timestamp === undefined ||
    parent.timestamp === undefined ||
    child.timestamp <= parent.timestamp + tolerance;
  return startsInside && endsInside ? 'nested' : 'graft';
}

/**
 * @param child - The child span, which must resolve to and lie inside `parent`.
 * @param parent - The resolved parent span.
 * @param options - Tolerance and end-containment options.
 */
export function expectNested(
  child: SpanWindow,
  parent: SpanWindow,
  options: NestingOptions = {},
): void {
  const result = classifyNesting(child, parent, options);
  if (result !== 'nested') {
    throw new Error(
      `Expected child ${child.span_id} to nest in ${parent.span_id}, got ${result}: ` +
        `child [${child.start_timestamp}, ${child.timestamp}], ` +
        `parent [${parent.start_timestamp}, ${parent.timestamp}]`,
    );
  }
}
