/**
 * The popup's `popup-init.html` leaves a session-history entry behind when it
 * meta-refreshes to `popup.html`, so `window.history.length` is never 1 there.
 * Using it to ask "can I go back in-app?" hides the up-navigation fallbacks and
 * lets `navigate(-1)` walk the document out of the SPA.
 */

/**
 * @returns The router's index for the current entry, counting only entries the
 * app pushed, or `undefined` outside a router navigation.
 */
export function getRouterHistoryIndex(): number | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const { idx } = (window.history.state ?? {}) as { idx?: number };
  return typeof idx === 'number' ? idx : undefined;
}

/**
 * @returns true when `navigate(-1)` stays inside the app.
 */
export function hasInAppHistoryEntry(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const idx = getRouterHistoryIndex();
  return idx === undefined ? window.history.length > 1 : idx > 0;
}

/** Route state the resume attaches so a layout can adopt the stack it replayed. */
export type PerpsResumeRouteState = {
  perpsResumedStack?: string[];
};

/**
 * @param state - `useLocation().state`.
 * @returns The stack a resume replayed into history, if this entry came from one.
 */
export function readResumedStack(state: unknown): string[] | undefined {
  const stack = (state as PerpsResumeRouteState | null)?.perpsResumedStack;
  return Array.isArray(stack) &&
    stack.every((entry) => typeof entry === 'string')
    ? stack
    : undefined;
}

/**
 * Where to start tracking a route stack from.
 *
 * A resume replays its entries before the layout's first effect runs, so the
 * layout can mount already partway up the stack. Without adopting the replayed
 * entries it would treat the current one as the base, and every later
 * navigation would collapse to depth 0 — losing everything below and shrinking
 * what the next reopen can restore.
 *
 * @param options0
 * @param options0.resumedStack - Stack carried on the entry's route state.
 * @param options0.path - Current path, including any search query.
 * @param options0.historyIndex - Router index for the current entry.
 * @returns The base index to measure depth against, and the entries already below.
 */
export function resolveStackBase({
  resumedStack,
  path,
  historyIndex,
}: {
  resumedStack?: string[];
  path: string;
  historyIndex?: number;
}): { base: number | undefined; stack: string[] } {
  if (resumedStack && historyIndex !== undefined) {
    const position = resumedStack.lastIndexOf(path);
    if (position !== -1) {
      return {
        base: historyIndex - position,
        stack: resumedStack.slice(0, position + 1),
      };
    }
  }
  return { base: historyIndex, stack: [] };
}

/**
 * Record `path` at `depth` in a feature's route stack.
 *
 * Position is the caller's distance from the entry it started tracking at, so a
 * deeper `depth` extends the stack, a shallower one truncates it (the entries
 * above were popped), and an equal one overwrites in place (a replace). Keeps
 * the newest `maxDepth` entries.
 *
 * @param options0
 * @param options0.previous - Stack recorded for the previous navigation.
 * @param options0.path - Path to record, including any search query.
 * @param options0.depth - Position of `path` in the stack.
 * @param options0.maxDepth - Entries to retain.
 * @returns The updated stack, oldest entry first.
 */
export function buildRouteStack({
  previous,
  path,
  depth,
  maxDepth,
}: {
  previous: string[];
  path: string;
  depth: number;
  maxDepth: number;
}): string[] {
  const stack = previous.slice(0, depth);
  stack[depth] = path;
  // A pop below the tracked base leaves holes; drop them rather than persisting
  // undefined entries.
  return stack.filter(Boolean).slice(-maxDepth);
}
