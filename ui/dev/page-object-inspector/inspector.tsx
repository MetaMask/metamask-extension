import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { colorForClass, tintForClass } from './colors';
import { stampOwnership, type StampResult } from './matcher';
import {
  readInspectorSettings,
  subscribeToInspectorSettings,
  type InspectorSettings,
} from './mode';
import {
  CONFLICT_ATTRIBUTE,
  INSPECTOR_ROOT_ATTRIBUTE,
  OWNER_ATTRIBUTE,
  SELECTOR_ID_ATTRIBUTE,
  type PageObjectIndex,
  type Selector,
} from './types';

type Target = {
  ownerClassName: string;
  relativePath: string;
  selector: Selector;
  conflictingClassNames: string[];
  /** Set when the cursor is over an element no page object covers. */
  isAncestorFallback: boolean;
};

const RESTAMP_DEBOUNCE_MS = 250;

const CONFLICT_COLOR = 'var(--color-error-default)';
const HIGHLIGHT_COLOR = 'var(--color-primary-default)';

const TOOLTIP_STYLE: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 2147483647,
  pointerEvents: 'none',
  background: 'var(--color-background-alternative)',
  color: 'var(--color-text-default)',
  font: '11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
  padding: '6px 8px',
  borderTop: '1px solid var(--color-border-muted)',
};

/**
 * Renders a selector the way it appears in the page-object source, so what the
 * tooltip shows can be searched for directly in the repository.
 *
 * @param selector - The selector to render.
 * @returns The selector as source-like text.
 */
function describeSelector(selector: Selector): string {
  if (!selector.chunks) {
    return selector.value ?? '';
  }

  return selector.chunks
    .map((chunk, position) =>
      position < (selector.params?.length ?? 0)
        ? `${chunk}\${${selector.params?.[position]}}`
        : chunk,
    )
    .join('');
}

/**
 * The developer-only overlay that reveals which page object owns each element
 * of the running wallet.
 *
 * It renders nothing until a view is switched on from Settings → Developer
 * Options, and it carries no controls of its own so that it never covers the
 * wallet it is there to describe.
 *
 * @param props - The component props.
 * @param props.index - The generated page-object index.
 * @returns The overlay.
 */
export function PageObjectInspector({ index }: { index: PageObjectIndex }) {
  const [settings, setSettings] = useState<InspectorSettings>(
    readInspectorSettings,
  );
  const [target, setTarget] = useState<Target | null>(null);
  const [result, setResult] = useState<StampResult | null>(null);

  useEffect(() => subscribeToInspectorSettings(setSettings), []);

  const isOn = settings.hover || settings.outline;

  const selectorsById = useMemo(() => {
    const map = new Map<string, { selector: Selector; relativePath: string }>();
    for (const pageObject of index.pageObjects) {
      for (const selector of pageObject.selectors) {
        map.set(selector.id, {
          selector,
          relativePath: pageObject.relativePath,
        });
      }
    }
    return map;
  }, [index]);

  const restamp = useCallback(() => {
    setResult(stampOwnership(document, index));
  }, [index]);

  // The wallet re-renders constantly, so ownership has to be recomputed as the
  // DOM changes rather than once on mount.
  useEffect(() => {
    if (!isOn) {
      return undefined;
    }

    // The first stamp waits for a frame so the wallet, which renders in a
    // separate root, has actually painted something to match against.
    const firstStamp = requestAnimationFrame(restamp);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(restamp, RESTAMP_DEBOUNCE_MS);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(firstStamp);
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [isOn, restamp]);

  useEffect(() => {
    if (!settings.hover) {
      return undefined;
    }

    const onMouseMove = (event: MouseEvent) => {
      const element = event.target as Element | null;
      if (!element?.closest) {
        return;
      }

      const owned = element.closest(`[${OWNER_ATTRIBUTE}]`);
      const entry = owned
        ? selectorsById.get(owned.getAttribute(SELECTOR_ID_ATTRIBUTE) ?? '')
        : undefined;

      if (!owned || !entry) {
        setTarget(null);
        return;
      }

      const conflict = owned.getAttribute(CONFLICT_ATTRIBUTE);
      setTarget({
        ownerClassName: owned.getAttribute(OWNER_ATTRIBUTE) ?? '',
        relativePath: entry.relativePath,
        selector: entry.selector,
        conflictingClassNames: conflict ? conflict.split(',') : [],
        isAncestorFallback: owned !== element,
      });
    };

    document.addEventListener('mousemove', onMouseMove, true);
    return () => document.removeEventListener('mousemove', onMouseMove, true);
  }, [settings.hover, selectorsById]);

  // Only hover mode has a target. Deriving it here, rather than clearing the
  // state when the settings change, keeps a stale target from surviving the
  // switch without an extra render.
  const activeTarget = settings.hover ? target : null;

  const overlayCss = useMemo(() => {
    if (!isOn) {
      return '';
    }

    const rules: string[] = [];

    if (settings.outline) {
      for (const { className } of index.pageObjects) {
        rules.push(
          `[${OWNER_ATTRIBUTE}="${className}"]{` +
            `box-shadow:inset 0 0 0 2px ${colorForClass(className)};` +
            `background-color:${tintForClass(className)};` +
            `border-radius:2px}`,
        );
      }
    }

    rules.push(
      `[${CONFLICT_ATTRIBUTE}]{` +
        `box-shadow:inset 0 0 0 3px ${CONFLICT_COLOR}!important;` +
        `background-color:color-mix(in srgb, ${CONFLICT_COLOR} 14%, transparent)!important}`,
    );

    if (activeTarget) {
      rules.push(
        `[${SELECTOR_ID_ATTRIBUTE}="${activeTarget.selector.id}"]{` +
          `box-shadow:inset 0 0 0 3px ${HIGHLIGHT_COLOR},0 0 0 3px ${HIGHLIGHT_COLOR}!important;` +
          `background-color:color-mix(in srgb, ${HIGHLIGHT_COLOR} 18%, transparent)!important}`,
      );
    }

    return rules.join('\n');
  }, [isOn, settings.outline, index, activeTarget]);

  if (!isOn) {
    return null;
  }

  return (
    <div {...{ [INSPECTOR_ROOT_ATTRIBUTE]: '' }}>
      <style>{overlayCss}</style>

      <div style={TOOLTIP_STYLE}>
        {activeTarget ? (
          <>
            <div>
              <span
                style={{
                  color: colorForClass(activeTarget.ownerClassName),
                  fontWeight: 700,
                }}
              >
                {activeTarget.ownerClassName}
              </span>
              <span style={{ opacity: 0.7 }}>
                .{activeTarget.selector.propertyName}
              </span>
              {activeTarget.isAncestorFallback && (
                <span style={{ opacity: 0.55 }}> (nearest ancestor)</span>
              )}
              <span style={{ float: 'right', opacity: 0.6 }}>
                {activeTarget.relativePath}:{activeTarget.selector.line}
              </span>
            </div>
            <div style={{ opacity: 0.85, wordBreak: 'break-all' }}>
              {describeSelector(activeTarget.selector)}
            </div>
            {activeTarget.conflictingClassNames.length > 1 && (
              <div style={{ color: CONFLICT_COLOR }}>
                also claimed by{' '}
                {activeTarget.conflictingClassNames
                  .filter((name) => name !== activeTarget.ownerClassName)
                  .join(', ')}
              </div>
            )}
          </>
        ) : (
          <div style={{ opacity: 0.6 }}>
            {settings.hover
              ? 'Hover an element. Nothing here means no page object covers it.'
              : 'Each owned element is tinted in its owner\u2019s colour.'}
            {result && (
              <span style={{ float: 'right' }}>
                {result.stamped} owned
                {result.conflicts > 0 && ` · ${result.conflicts} conflicting`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
