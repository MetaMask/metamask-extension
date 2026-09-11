import { buildComponentInfo, buildFallbackInfo, serializeProps } from './core';
import type { ComponentInfo, InspectorAdapter } from './core';

/**
 * Minimal shape of a React fiber node — React does not publish types for the
 * internal fiber, so we describe only the fields we read here.
 */
type ReactFiber = {
  return: ReactFiber | null;
  type: unknown;
  memoizedProps?: Record<string, unknown>;
  _debugSource?: { fileName?: string; lineNumber?: number } | null;
};

type ReactComponentType = {
  displayName?: string;
  name?: string;
  render?: { displayName?: string; name?: string };
};

/**
 * Get the React fiber from a DOM element.
 * React attaches the fiber as a property with a dynamic key like `__reactFiber$xxxxx`.
 * @param el
 */
function getReactFiber(el: HTMLElement): ReactFiber | null {
  const key = Object.keys(el).find(
    (k) =>
      k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'),
  );
  return key
    ? ((el as unknown as Record<string, ReactFiber>)[key] ?? null)
    : null;
}

const REACT_INTERNALS = [
  'Suspense',
  'StrictMode',
  'Fragment',
  'Provider',
  'Consumer',
];

/**
 * Walk `fiber.return` until we find a named function/class component,
 * skipping React internals (Suspense, Provider, etc.).
 * @param fiber
 */
function getNearestNamedComponent(fiber: ReactFiber | null): ReactFiber | null {
  let current = fiber?.return ?? null;
  while (current) {
    const { type } = current;
    if (typeof type === 'function' && type.name && type.name.length > 0) {
      if (!REACT_INTERNALS.includes(type.name)) {
        return current;
      }
    }
    if (typeof type === 'object' && type !== null) {
      const componentType = type as ReactComponentType;
      const name =
        componentType.displayName ??
        componentType.render?.displayName ??
        componentType.render?.name;
      if (name) {
        return current;
      }
    }
    current = current.return;
  }
  return null;
}

function getComponentName(fiber: ReactFiber | null): string | null {
  if (!fiber) {
    return null;
  }
  const { type } = fiber;
  if (typeof type === 'function') {
    const fn = type as ReactComponentType;
    return fn.displayName ?? fn.name ?? null;
  }
  if (typeof type === 'object' && type !== null) {
    const componentType = type as ReactComponentType;
    return (
      componentType.displayName ??
      componentType.render?.displayName ??
      componentType.render?.name ??
      null
    );
  }
  return null;
}

export class ReactInspectorAdapter implements InspectorAdapter {
  getComponentInfo(el: HTMLElement): ComponentInfo | null {
    const fiber = getReactFiber(el);
    if (!fiber) {
      return buildFallbackInfo(el);
    }

    const componentFiber = getNearestNamedComponent(fiber);
    const source = componentFiber?._debugSource ?? fiber._debugSource ?? null;
    const componentName =
      getComponentName(componentFiber) ?? el.tagName.toLowerCase();

    const rawProps = componentFiber?.memoizedProps ?? {};
    const props = serializeProps(rawProps);

    // Walk up for testId (may be on a parent).
    const testId =
      el.dataset.testid ??
      el.closest('[data-testid]')?.getAttribute('data-testid') ??
      null;

    return buildComponentInfo(el, {
      componentName,
      filePath: source?.fileName,
      lineNumber: source?.lineNumber,
      props,
      testId,
    });
  }

  onActivate(): void {
    // React's synthetic events use native DOM events under the hood in React 17+.
    // Our capture-phase listeners intercept before React sees them — no special handling needed.
  }

  onDeactivate(): void {
    // No teardown required.
  }
}
