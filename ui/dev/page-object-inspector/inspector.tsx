import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { colorForClass, tintForClass } from './colors';
import { InspectArea } from './inspect-area';
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
  VIEWPORT_ATTRIBUTE,
  type PageObjectIndex,
  type PinnedElement,
  type Selector,
} from './types';

type Target = {
  ownerClassName: string;
  relativePath: string;
  selector: Selector;
  conflictingClassNames: string[];
  /** Set when the cursor is over an element no page object covers. */
  isAncestorFallback: boolean;
  /**
   * False for large wrapping containers (e.g. the app root) that happen to
   * be matched via ancestor fallback but aren't meaningful pin targets.
   */
  canPin: boolean;
};

/**
 * True when an element's bounding box covers almost the entire viewport,
 * meaning it's a page-level wrapper rather than a real, pinnable target.
 *
 * @param element - The element to measure.
 * @returns Whether the element looks like a full-page backdrop container.
 */
function isFullViewportContainer(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.width >= window.innerWidth * 0.95 &&
    rect.height >= window.innerHeight * 0.95
  );
}

const RESTAMP_DEBOUNCE_MS = 250;
const DWELL_MS = 500;
const DWELL_RADIUS_PX = 5;
const MAX_PINS = 5;

const CONFLICT_COLOR = 'var(--color-error-default)';

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

const PIN_BUTTON_STYLE: React.CSSProperties = {
  position: 'fixed',
  zIndex: 2147483647,
  pointerEvents: 'auto',
  background: 'var(--color-background-default)',
  color: 'var(--color-text-default)',
  border: '1px solid var(--color-border-muted)',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  transition: 'background 0.15s',
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
    return selector.value ?? selector.text ?? '';
  }

  return selector.chunks
    .map((chunk, position) =>
      position < (selector.params?.length ?? 0)
        ? `${chunk}\${${selector.params?.[position]}}`
        : chunk,
    )
    .join('');
}

function isFullscreenMode(): boolean {
  try {
    return window.location.pathname === '/home.html';
  } catch {
    return false;
  }
}

/**
 * The developer-only overlay that reveals which page object owns each element
 * of the running wallet.
 *
 * It renders nothing until a view is switched on from Settings -> Developer
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
  const [pinnedElements, setPinnedElements] = useState<PinnedElement[]>([]);
  const [showPinButton, setShowPinButton] = useState(false);
  const [pinButtonPosition, setPinButtonPosition] = useState({ x: 0, y: 0 });
  const [highlightSelectorId, setHighlightSelectorId] = useState<string | null>(null);
  const [highlightColor, setHighlightColor] = useState<string>('cyan');

  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const currentTargetRef = useRef<Target | null>(null);
  const showPinButtonRef = useRef(false);
  const pinButtonPosRef = useRef({ x: 0, y: 0 });
  const isFullscreen = useMemo(() => isFullscreenMode(), []);

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

  useEffect(() => {
    if (!isOn) {
      return undefined;
    }

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

  const clearDwellTimer = useCallback(() => {
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    setShowPinButton(false);
    showPinButtonRef.current = false;
  }, []);

  const handlePin = useCallback(() => {
    const t = currentTargetRef.current;
    if (!t) {
      return;
    }

    const newPin: PinnedElement = {
      ownerClassName: t.ownerClassName,
      relativePath: t.relativePath,
      selector: t.selector,
      conflictingClassNames: t.conflictingClassNames,
      isUncovered: false,
      isAncestorFallback: t.isAncestorFallback,
    };

    setPinnedElements((prev) => {
      const deduped = prev.filter(
        (p) => p.selector.id !== newPin.selector.id,
      );
      const next = [newPin, ...deduped];
      if (next.length > MAX_PINS) {
        next.pop();
      }
      return next;
    });
    setShowPinButton(false);
  }, []);

  const handleUnpin = useCallback((idx: number) => {
    setPinnedElements((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  useEffect(() => {
    if (!settings.hover) {
      return undefined;
    }

    const onMouseMove = (event: MouseEvent) => {
      const element = event.target as Element | null;
      if (!element?.closest) {
        return;
      }

      if (element.closest(`[${INSPECTOR_ROOT_ATTRIBUTE}]`)) {
        return;
      }

      const owned = element.closest(`[${OWNER_ATTRIBUTE}]`);
      const entry = owned
        ? selectorsById.get(owned.getAttribute(SELECTOR_ID_ATTRIBUTE) ?? '')
        : undefined;

      if (!owned || !entry || owned.hasAttribute(VIEWPORT_ATTRIBUTE)) {
        setTarget(null);
        currentTargetRef.current = null;
      } else {
        const conflict = owned.getAttribute(CONFLICT_ATTRIBUTE);
        const newTarget: Target = {
          ownerClassName: owned.getAttribute(OWNER_ATTRIBUTE) ?? '',
          relativePath: entry.relativePath,
          selector: entry.selector,
          conflictingClassNames: conflict ? conflict.split(',') : [],
          isAncestorFallback: owned !== element,
          canPin: !isFullViewportContainer(owned),
        };
        setTarget(newTarget);
        currentTargetRef.current = newTarget;
      }

      const dx = event.clientX - lastMousePosRef.current.x;
      const dy = event.clientY - lastMousePosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > DWELL_RADIUS_PX) {
        if (showPinButtonRef.current) {
          const btnPos = pinButtonPosRef.current;
          const distToBtn = Math.sqrt(
            (event.clientX - btnPos.x) ** 2 +
              (event.clientY - btnPos.y) ** 2,
          );
          if (distToBtn < 80) {
            return;
          }
        }

        lastMousePosRef.current = { x: event.clientX, y: event.clientY };
        clearDwellTimer();

        dwellTimerRef.current = setTimeout(() => {
          if (!currentTargetRef.current || !currentTargetRef.current.canPin) {
            return;
          }
          const pos = {
            x: event.clientX + 12,
            y: event.clientY - 20,
          };
          pinButtonPosRef.current = pos;
          setPinButtonPosition(pos);
          setShowPinButton(true);
          showPinButtonRef.current = true;
        }, DWELL_MS);
      }
    };

    document.addEventListener('mousemove', onMouseMove, true);
    return () => {
      document.removeEventListener('mousemove', onMouseMove, true);
      clearDwellTimer();
    };
  }, [settings.hover, selectorsById, clearDwellTimer]);

  useEffect(() => {
    if (!isFullscreen || !isOn) {
      return undefined;
    }

    const onBlur = () => {
      setTarget(null);
      currentTargetRef.current = null;
      clearDwellTimer();
    };

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        onBlur();
      }
    });

    return () => {
      window.removeEventListener('blur', onBlur);
    };
  }, [isFullscreen, isOn, clearDwellTimer]);

  const activeTarget = settings.hover ? target : null;

  const overlayCss = useMemo(() => {
    if (!isOn) {
      return '';
    }

    const rules: string[] = [];

    if (settings.outline) {
      for (const { className } of index.pageObjects) {
        rules.push(
          `[${OWNER_ATTRIBUTE}="${className}"]:not([${VIEWPORT_ATTRIBUTE}]){` +
            `box-shadow:inset 0 0 0 2px ${colorForClass(className)};` +
            `background-color:${tintForClass(className)};` +
            `border-radius:2px}`,
        );
      }
    }

    if (highlightSelectorId) {
      rules.push(
        `[${SELECTOR_ID_ATTRIBUTE}="${highlightSelectorId}"]{` +
          `box-shadow:inset 0 0 0 3px ${highlightColor},0 0 0 3px ${highlightColor}!important;` +
          `background-color:color-mix(in srgb, ${highlightColor} 15%, transparent)!important}`,
      );
    }

    return rules.join('\n');
  }, [isOn, settings.outline, index, highlightSelectorId, highlightColor]);

  if (!isOn) {
    return null;
  }

  return (
    <div {...{ [INSPECTOR_ROOT_ATTRIBUTE]: '' }}>
      <style>{overlayCss}</style>

      {showPinButton && (
        <button
          style={{
            ...PIN_BUTTON_STYLE,
            left: pinButtonPosition.x,
            top: pinButtonPosition.y,
          }}
          onClick={() => {
            handlePin();
            clearDwellTimer();
          }}
        >
          &#128204; Pin
        </button>
      )}

      {isFullscreen ? (
        <InspectArea
          target={activeTarget}
          pinnedElements={pinnedElements}
          result={result}
          onUnpin={handleUnpin}
          onHighlight={(id, color) => {
            setHighlightSelectorId(id);
            setHighlightColor(color ?? 'cyan');
          }}
        />
      ) : (
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
                  {result.conflicts > 0 &&
                    ` \u00B7 ${result.conflicts} conflicting`}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
