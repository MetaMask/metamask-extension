import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

/**
 * Horizontal gap between rail items, in pixels. Must stay in step with the
 * row's `gap-2`, because the fit calculation cannot read a Tailwind class.
 */
export const RAIL_GAP_PX = 8;

export type CategoryRailOverflow = {
  /** Attach to the row whose width is the fit budget. Must carry no padding. */
  rowRef: React.RefCallback<HTMLElement>;
  /** Attach to each rendered item, keyed by its category. */
  registerItem: (key: string) => React.RefCallback<HTMLElement>;
  /** How many leading items fit. `null` until the first measurement lands. */
  visibleCount: number | null;
};

/**
 * Decides how many rail items fit on one line, so the remainder can move into
 * an overflow menu instead of a horizontal scroller.
 *
 * Widths are cached per key on the pass that renders every item, because an
 * item moved into the overflow menu is unmounted and would otherwise measure as
 * zero forever. The cache is keyed on `keys` plus the active key: new
 * categories or a locale switch change the labels, and becoming active adds the
 * clear glyph, so either drops back to a full render and re-reads every width
 * at what is actually on screen.
 *
 * @param keys - Item keys in render order.
 * @param activeKey - The active item, whose width differs from its inactive one.
 * @returns Refs to attach, plus the number of items that fit.
 */
export function useCategoryRailOverflow(
  keys: string[],
  activeKey?: string | null,
): CategoryRailOverflow {
  const rowElement = useRef<HTMLElement | null>(null);
  const itemElements = useRef(new Map<string, HTMLElement>());
  const itemWidths = useRef(new Map<string, number>());
  // The key set the cached widths belong to, so a stale width is never reused.
  const cachedSignature = useRef<string | null>(null);

  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  // A stable dependency for the effects below: the array identity changes on
  // every render, the content rarely does.
  const keysSignature = keys.join('|');
  // What the cached widths are keyed on. The active key rides along because the
  // active item renders the clear glyph and so measures wider than the same item
  // did while inactive; without it the fit would be recomputed from the width
  // the pill had before it was selected.
  const measureSignature = `${keysSignature}::${activeKey ?? ''}`;

  const measure = useCallback(() => {
    const row = rowElement.current;
    if (!row) {
      return;
    }

    const currentKeys = keysSignature ? keysSignature.split('|') : [];

    // New categories, new label text, or a new active item invalidate every
    // cached width.
    if (cachedSignature.current !== measureSignature) {
      cachedSignature.current = measureSignature;
      itemWidths.current.clear();
    }

    // Cache whatever is mounted right now. `offsetWidth` is 0 for an unmounted
    // or hidden item, so a zero never overwrites a known width.
    currentKeys.forEach((key) => {
      const width = itemElements.current.get(key)?.offsetWidth ?? 0;
      if (width > 0) {
        itemWidths.current.set(key, width);
      }
    });
    const widths = currentKeys.map((key) => itemWidths.current.get(key));
    if (widths.some((width) => width === undefined)) {
      // Still on the measuring pass — some item has not been laid out yet.
      return;
    }
    const knownWidths = widths as number[];

    // The row carries no padding, so its content box is the whole budget.
    const available = row.clientWidth;
    if (available === 0) {
      // Detached or display:none — measuring now would collapse the rail.
      return;
    }

    // The More trigger is a sibling of this row, so once it appears the row has
    // already shrunk by its width and the fit is a plain running total.
    let used = 0;
    let fitted = 0;
    for (const width of knownWidths) {
      const nextUsed = fitted === 0 ? width : used + RAIL_GAP_PX + width;
      if (nextUsed > available) {
        break;
      }
      used = nextUsed;
      fitted += 1;
    }
    setVisibleCount(fitted);
  }, [keysSignature, measureSignature]);

  // New categories, new label text or a new active item invalidate every cached
  // width, so drop back to rendering all of them and measure again. Adjusted
  // during render rather than in an effect, which would cost an extra pass.
  const [lastMeasured, setLastMeasured] = useState(measureSignature);
  if (lastMeasured !== measureSignature) {
    setLastMeasured(measureSignature);
    setVisibleCount(null);
  }

  // Mount and any signature change (categories, labels, active item) remeasure
  // here; the row's own size changes are covered by the ResizeObserver below.
  useLayoutEffect(() => {
    measure();
  }, [measure]);

  // Held in state, not just a ref, so the observer effect below re-runs when the
  // row mounts. A ref callback cannot return a cleanup on React 18.
  const [rowNode, setRowNode] = useState<HTMLElement | null>(null);
  const rowRef = useCallback((element: HTMLElement | null) => {
    rowElement.current = element;
    setRowNode(element);
  }, []);

  useEffect(() => {
    if (!rowNode || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(() => measure());
    observer.observe(rowNode);
    return () => observer.disconnect();
  }, [rowNode, measure]);

  const registerItem = useCallback(
    (key: string) => (element: HTMLElement | null) => {
      if (element) {
        itemElements.current.set(key, element);
      } else {
        itemElements.current.delete(key);
      }
    },
    [],
  );

  return { rowRef, registerItem, visibleCount };
}
