import React, { useMemo, useState } from 'react';
import { colorForClass } from './colors';
import type { StampResult } from './matcher';
import {
  CONFLICT_ATTRIBUTE,
  OWNER_ATTRIBUTE,
  SELECTOR_ID_ATTRIBUTE,
  type PinnedElement,
  type Selector,
} from './types';

type Target = {
  ownerClassName: string;
  relativePath: string;
  selector: Selector;
  conflictingClassNames: string[];
  isAncestorFallback: boolean;
};

type InspectAreaProps = {
  target: Target | null;
  pinnedElements: PinnedElement[];
  result: StampResult | null;
  onUnpin: (index: number) => void;
  onHighlight: (selectorId: string | null, color?: string) => void;
};

type TabKind = 'owned' | 'conflicting';

const TAB_STRIP_WIDTH = 128;

const PANEL_STYLE: React.CSSProperties = {
  position: 'fixed',
  right: 0,
  top: 0,
  bottom: 0,
  width: 380,
  zIndex: 2147483647,
  background: 'var(--color-background-default)',
  borderLeft: '1px solid var(--color-border-muted)',
  borderRadius: '12px 0 0 12px',
  font: '14px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
  color: 'var(--color-text-default)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  pointerEvents: 'auto',
};

const TAB_STRIP_STYLE: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  top: 72,
  zIndex: 2147483647,
  display: 'flex',
  flexDirection: 'column',
  pointerEvents: 'auto',
};

const SLIDING_PANEL_STYLE: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  top: 0,
  bottom: 0,
  width: 360,
  zIndex: 2147483647,
  background: 'var(--color-background-default)',
  borderRight: '1px solid var(--color-border-muted)',
  borderRadius: '0 12px 12px 0',
  font: '12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
  color: 'var(--color-text-default)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  pointerEvents: 'auto',
  boxShadow: '4px 0 16px rgba(0,0,0,0.18)',
  transition: 'transform 220ms ease',
};

const SECTION_HEADER_STYLE: React.CSSProperties = {
  padding: '10px 16px',
  borderBottom: '1px solid var(--color-border-muted)',
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  opacity: 0.7,
};

const INSPECT_SECTION_STYLE: React.CSSProperties = {
  height: 220,
  minHeight: 220,
  maxHeight: 220,
  overflow: 'auto',
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border-muted)',
};

const PINNED_SECTION_STYLE: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  minHeight: 0,
};

const UNPIN_BUTTON_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 6,
  right: 10,
  background: 'var(--color-background-alternative)',
  border: '1px solid var(--color-border-muted)',
  color: 'var(--color-text-default)',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: '1',
  width: 24,
  height: 24,
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 700,
  marginLeft: 6,
  verticalAlign: 'middle',
};

const TODO_BADGE_STYLE: React.CSSProperties = {
  ...BADGE_BASE,
  background: 'color-mix(in srgb, var(--color-error-default) 15%, transparent)',
  color: 'var(--color-error-default)',
};

const TODO_ROW_BG = 'color-mix(in srgb, var(--color-error-default) 22%, transparent)';

/** Extra right padding on pinned/list rows so text never renders under the unpin/close button. */
const ROW_PADDING_WITH_BUTTON = '10px 40px 10px 16px';

function isGoodLocator(selector: Selector): boolean {
  if (selector.kind === 'testId') {
    return true;
  }
  if (selector.kind === 'css') {
    const raw = selector.chunks ? selector.chunks.join('') : selector.value ?? '';
    return raw.includes('data-testid');
  }
  return false;
}

function kindBadgeStyle(good: boolean): React.CSSProperties {
  if (good) {
    return {
      ...BADGE_BASE,
      background:
        'color-mix(in srgb, var(--color-success-default) 20%, transparent)',
      color: 'var(--color-success-default)',
    };
  }
  return TODO_BADGE_STYLE;
}

function rowBackgroundColor(pin: PinnedElement): string {
  if (pin.isUncovered) {
    return 'color-mix(in srgb, var(--color-warning-default) 8%, transparent)';
  }
  if (pin.conflictingClassNames.length > 1) {
    return 'color-mix(in srgb, var(--color-error-default) 8%, transparent)';
  }
  if (isGoodLocator(pin.selector)) {
    return 'color-mix(in srgb, var(--color-success-default) 8%, transparent)';
  }
  return 'color-mix(in srgb, var(--color-warning-default) 8%, transparent)';
}

function rawSelectorValue(selector: Selector): string {
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

function describeSelector(selector: Selector): string {
  const raw = rawSelectorValue(selector);
  if (selector.kind === 'testId' || selector.kind === 'css') {
    return `${selector.kind}: ${raw}`;
  }
  return `${selector.kind}: ${raw}${selector.text ? ` (text: "${selector.text}")` : ''}`;
}

const KindBadge = ({ selector }: { selector: Selector }) => {
  const good = isGoodLocator(selector);
  if (good) {
    return (
      <span style={kindBadgeStyle(true)}>
        {selector.kind === 'testId' ? 'testId' : 'css'}
      </span>
    );
  }
  return (
    <span style={TODO_BADGE_STYLE}>TODO - Migrate to data-testid</span>
  );
};

const TargetInfo = ({ target }: { target: Target }) => {
  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <span style={{ opacity: 0.5, marginRight: 6 }}>&#128196;</span>
        <span
          style={{
            color: colorForClass(target.ownerClassName),
            fontWeight: 700,
          }}
        >
          {target.ownerClassName}
        </span>
        <span style={{ opacity: 0.7 }}>.{target.selector.propertyName}</span>
        {target.isAncestorFallback && (
          <span style={{ opacity: 0.55 }}> (nearest ancestor)</span>
        )}
      </div>
      <div style={{ marginBottom: 6, wordBreak: 'break-all' }}>
        <span style={{ opacity: 0.5, marginRight: 6 }}>&#128269;</span>
        <span style={{ opacity: 0.85 }}>
          {describeSelector(target.selector)}
        </span>
        <KindBadge selector={target.selector} />
      </div>
      <div style={{ opacity: 0.6 }}>
        <span style={{ opacity: 0.5, marginRight: 6 }}>&#128204;</span>
        {target.relativePath}:{target.selector.line}
      </div>
      {target.conflictingClassNames.length > 1 && (
        <div style={{ color: 'var(--color-error-default)', marginTop: 6 }}>
          <span style={{ opacity: 0.5, marginRight: 6 }}>&#9888;</span>
          Also claimed by:{' '}
          {target.conflictingClassNames
            .filter((name) => name !== target.ownerClassName)
            .join(', ')}
        </div>
      )}
    </div>
  );
};

const PinnedRow = ({
  pin,
  displayIndex,
  onUnpin,
  actualIndex,
  onMouseEnter,
  onMouseLeave,
}: {
  pin: PinnedElement;
  displayIndex: number;
  onUnpin: (index: number) => void;
  actualIndex: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => {
  const bgColor = rowBackgroundColor(pin);

  if (pin.isUncovered) {
    return (
      <div
        style={{ padding: ROW_PADDING_WITH_BUTTON, borderBottom: '1px solid var(--color-border-muted)', position: 'relative' as const, background: bgColor }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <button
          style={UNPIN_BUTTON_STYLE}
          onClick={() => onUnpin(actualIndex)}
          title="Unpin"
        >
          &times;
        </button>
        <div style={{ color: 'var(--color-warning-default)' }}>
          <span style={{ fontWeight: 700, marginRight: 6 }}>#{displayIndex}</span>
          No page object covers this element.
          {pin.uncoveredTestId && (
            <div style={{ opacity: 0.8, marginTop: 4 }}>
              data-testid=&quot;{pin.uncoveredTestId}&quot;
            </div>
          )}
          <div style={{ opacity: 0.6, marginTop: 4, fontSize: 12 }}>
            Consider adding a locator to a page object.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ padding: ROW_PADDING_WITH_BUTTON, borderBottom: '1px solid var(--color-border-muted)', position: 'relative' as const, background: bgColor, cursor: 'pointer' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        style={UNPIN_BUTTON_STYLE}
        onClick={() => onUnpin(actualIndex)}
        title="Unpin"
      >
        &times;
      </button>
      <div style={{ marginBottom: 4, wordBreak: 'break-word' }}>
        <span style={{ fontWeight: 700, opacity: 0.5, marginRight: 6 }}>#{displayIndex}</span>
        <span
          style={{
            color: colorForClass(pin.ownerClassName),
            fontWeight: 700,
          }}
        >
          {pin.ownerClassName}
        </span>
        <span style={{ opacity: 0.7 }}>.{pin.selector.propertyName}</span>
        {pin.isAncestorFallback && (
          <span style={{ opacity: 0.55 }}> (nearest ancestor)</span>
        )}
      </div>
      <div style={{ marginBottom: 4, wordBreak: 'break-all', opacity: 0.85 }}>
        {describeSelector(pin.selector)}
        <KindBadge selector={pin.selector} />
      </div>
      <div style={{ opacity: 0.6, fontSize: 12 }}>
        {pin.relativePath}:{pin.selector.line}
      </div>
      {pin.conflictingClassNames.length > 1 && (
        <div
          style={{
            color: 'var(--color-error-default)',
            marginTop: 4,
            fontSize: 11,
          }}
        >
          Also claimed by:{' '}
          {pin.conflictingClassNames
            .filter((name) => name !== pin.ownerClassName)
            .join(', ')}
        </div>
      )}
    </div>
  );
};

type ListPanelItem = {
  label: string;
  detail: string;
  conflictors?: string[];
  selectorId?: string;
  needsMigration: boolean;
  matchCount: number;
};

const COUNT_BADGE_STYLE: React.CSSProperties = {
  ...BADGE_BASE,
  background:
    'color-mix(in srgb, var(--color-primary-default) 18%, transparent)',
  color: 'var(--color-primary-default)',
};

function collectUniqueListItems(tab: TabKind): {
  items: ListPanelItem[];
  totalCount: number;
} {
  const cssSelector =
    tab === 'conflicting'
      ? `[${CONFLICT_ATTRIBUTE}]`
      : `[${OWNER_ATTRIBUTE}]`;
  const elements = document.querySelectorAll(cssSelector);
  const byKey = new Map<string, ListPanelItem>();

  elements.forEach((el) => {
    const owner = el.getAttribute(OWNER_ATTRIBUTE) ?? '';
    const selectorId = el.getAttribute(SELECTOR_ID_ATTRIBUTE) ?? '';
    const dedupeKey = selectorId || `${owner}::${el.tagName}`;
    const existing = byKey.get(dedupeKey);
    if (existing) {
      existing.matchCount += 1;
      return;
    }

    const conflict = el.getAttribute(CONFLICT_ATTRIBUTE);
    const testId = el.getAttribute('data-testid') ?? '';

    byKey.set(dedupeKey, {
      label: selectorId || owner,
      detail: testId ? `data-testid="${testId}"` : el.tagName.toLowerCase(),
      conflictors:
        tab === 'conflicting' && conflict ? conflict.split(',') : undefined,
      selectorId,
      needsMigration: !testId,
      matchCount: 1,
    });
  });

  return { items: [...byKey.values()], totalCount: elements.length };
}

function tabButtonStyle(active: boolean, variant: TabKind): React.CSSProperties {
  return {
    width: TAB_STRIP_WIDTH,
    padding: '10px 12px',
    marginBottom: 4,
    borderRadius: '0 8px 8px 0',
    border: '1px solid var(--color-border-muted)',
    borderLeft: 'none',
    background: active
      ? 'var(--color-background-default)'
      : 'var(--color-background-alternative)',
    color:
      variant === 'conflicting'
        ? 'var(--color-error-default)'
        : 'var(--color-text-default)',
    font: '12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: active ? 'none' : '2px 0 6px rgba(0,0,0,0.12)',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
}

const TabStrip = ({
  ownedCount,
  conflictingCount,
  activeTab,
  isOpen,
  onSelect,
}: {
  ownedCount: number;
  conflictingCount: number;
  activeTab: TabKind;
  isOpen: boolean;
  onSelect: (tab: TabKind) => void;
}) => (
  <div style={TAB_STRIP_STYLE}>
    <button
      style={tabButtonStyle(isOpen && activeTab === 'owned', 'owned')}
      onClick={() => onSelect('owned')}
    >
      {ownedCount} owned
    </button>
    {conflictingCount > 0 && (
      <button
        style={tabButtonStyle(isOpen && activeTab === 'conflicting', 'conflicting')}
        onClick={() => onSelect('conflicting')}
      >
        {conflictingCount} conflicting
      </button>
    )}
  </div>
);

const SlidingLeftPanel = ({
  isOpen,
  activeTab,
  items,
  totalCount,
  onClose,
  onHighlight,
}: {
  isOpen: boolean;
  activeTab: TabKind;
  items: ListPanelItem[];
  totalCount: number;
  onClose: () => void;
  onHighlight: (selectorId: string | null, color?: string) => void;
}) => {
  const title =
    activeTab === 'owned'
      ? `Owned Selectors (${totalCount})`
      : `Conflicting Selectors (${totalCount})`;

  const highlightColorForTab = 'cyan';

  return (
    <div
      style={{
        ...SLIDING_PANEL_STYLE,
        transform: isOpen
          ? `translateX(${TAB_STRIP_WIDTH}px)`
          : 'translateX(-100%)',
      }}
    >
      <div
        style={{
          ...SECTION_HEADER_STYLE,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{title}</span>
        <button
          style={{
            background: 'var(--color-background-alternative)',
            border: '1px solid var(--color-border-muted)',
            color: 'var(--color-text-default)',
            cursor: 'pointer',
            fontSize: 16,
            width: 26,
            height: 26,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
          onClick={onClose}
        >
          &times;
        </button>
      </div>
      {activeTab === 'conflicting' && (
        <div style={{ padding: '8px 16px', opacity: 0.6, fontSize: 12, borderBottom: '1px solid var(--color-border-muted)' }}>
          Multiple page objects claim the same element. Only one should own it.
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--color-border-muted)',
              background: item.needsMigration ? TODO_ROW_BG : undefined,
              cursor: item.selectorId ? 'pointer' : undefined,
            }}
            onMouseEnter={() =>
              item.selectorId && onHighlight(item.selectorId, highlightColorForTab)
            }
            onMouseLeave={() => onHighlight(null)}
          >
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {item.label}
              {item.matchCount > 1 && (
                <span style={COUNT_BADGE_STYLE}>×{item.matchCount}</span>
              )}
              {item.needsMigration && (
                <span style={TODO_BADGE_STYLE}>TODO - Migrate to data-testid</span>
              )}
            </div>
            <div style={{ opacity: 0.6, fontSize: 12, marginTop: 2 }}>{item.detail}</div>
            {item.conflictors && item.conflictors.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12 }}>
                {item.conflictors.map((name) => (
                  <div key={name} style={{ paddingLeft: 8, marginTop: 2 }}>
                    &bull; <span style={{ fontWeight: 700 }}>{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ padding: '12px 16px', opacity: 0.5 }}>
            No elements found.
          </div>
        )}
      </div>
    </div>
  );
};

export function InspectArea({
  target,
  pinnedElements,
  result,
  onUnpin,
  onHighlight,
}: InspectAreaProps) {
  const [activeTab, setActiveTab] = useState<TabKind>('owned');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const owned = useMemo(
    () =>
      result
        ? collectUniqueListItems('owned')
        : { items: [], totalCount: 0 },
    [result],
  );
  const conflicting = useMemo(
    () =>
      result
        ? collectUniqueListItems('conflicting')
        : { items: [], totalCount: 0 },
    [result],
  );
  const panelItems = activeTab === 'owned' ? owned.items : conflicting.items;
  const panelTotal =
    activeTab === 'owned' ? owned.totalCount : conflicting.totalCount;

  const handleTabSelect = (tab: TabKind) => {
    if (isPanelOpen && activeTab === tab) {
      setIsPanelOpen(false);
    } else {
      setActiveTab(tab);
      setIsPanelOpen(true);
    }
  };

  return (
    <>
      {result && (
        <>
          <TabStrip
            ownedCount={owned.totalCount}
            conflictingCount={conflicting.totalCount}
            activeTab={activeTab}
            isOpen={isPanelOpen}
            onSelect={handleTabSelect}
          />
          <SlidingLeftPanel
            isOpen={isPanelOpen}
            activeTab={activeTab}
            items={panelItems}
            totalCount={panelTotal}
            onClose={() => setIsPanelOpen(false)}
            onHighlight={onHighlight}
          />
        </>
      )}
      <div style={PANEL_STYLE}>
        <div style={{ flex: '0 0 auto' }}>
          <div style={SECTION_HEADER_STYLE}>Inspect</div>
          <div style={INSPECT_SECTION_STYLE}>
            {target ? (
              <TargetInfo target={target} />
            ) : (
              <div style={{ opacity: 0.6 }}>
                Hover an element to inspect its page object ownership.
              </div>
            )}
          </div>
        </div>

        <div style={PINNED_SECTION_STYLE}>
          <div style={SECTION_HEADER_STYLE}>
            Pinned ({pinnedElements.length}/5)
          </div>
          {pinnedElements.length === 0 ? (
            <div style={{ padding: '12px 16px', opacity: 0.5 }}>
              Hover 0.5s then click Pin to save element info here.
            </div>
          ) : (
            pinnedElements.map((pin, idx) => (
              <PinnedRow
                key={pin.selector.id || idx}
                pin={pin}
                displayIndex={idx + 1}
                actualIndex={idx}
                onUnpin={onUnpin}
                onMouseEnter={() => onHighlight(pin.selector.id || null, 'cyan')}
                onMouseLeave={() => onHighlight(null)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
