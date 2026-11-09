import React, { useEffect, useState } from 'react';
import { brandColor } from '@metamask/design-tokens';
import { useTheme } from '../../../../hooks/useTheme';

/**
 * IndicatorBar
 *
 * Renders the moving-average dropdown and the BOL/RSI/Volume/MACD toggle
 * pills. Rendered below the chart as a separate component in the parent
 * layout, mirroring mobile's IndicatorBar.
 */

const TOGGLE_INDICATORS = ['BOL', 'RSI', 'Volume', 'MACD'] as const;
const MA_OPTIONS = ['MA5', 'MA10', 'MA20', 'MA50', 'MA200'] as const;

/**
 * Moving averages are driven by a single `SET_MA_VISIBILITY` message rather
 * than the per-indicator add/remove messages, so callers need to tell the two
 * kinds of indicator apart.
 *
 * @param name - Indicator name, e.g. `MA20` or `RSI`.
 */
export const isMovingAverage = (name: string) => /^MA\d+$/u.test(name);

type IndicatorBarProps = {
  activeIndicators: Set<string>;
  onIndicatorToggle: (name: string) => void;
  onMAToggle: (ma: string) => void;
};

const IndicatorBar = ({
  activeIndicators,
  onIndicatorToggle,
  onMAToggle,
}: IndicatorBarProps) => {
  const theme = useTheme();
  const isDark = theme === 'dark';
  const [showMADropdown, setShowMADropdown] = useState(false);

  const toolbarText = 'var(--color-text-default)';
  const toolbarMuted = 'var(--color-text-alternative)';
  const activeCheckColor = isDark ? brandColor.lime100 : brandColor.green500;
  const pillStyle = (isSelected: boolean) => ({
    padding: '4px 10px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer' as const,
    fontSize: '12px',
    fontWeight: isSelected ? 600 : 500,
    background: 'transparent',
    color: isSelected ? toolbarText : toolbarMuted,
    // The row scrolls when it runs out of width; squashing the labels to
    // illegible widths instead would be worse.
    flexShrink: 0,
  });

  const selectedMAs = [...activeIndicators].filter(isMovingAverage);
  let maLabel: string;
  if (selectedMAs.length === 0) {
    maLabel = 'MA';
  } else if (selectedMAs.length === 1) {
    maLabel = selectedMAs[0];
  } else {
    maLabel = `MA ×${selectedMAs.length}`;
  }

  // Close MA dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!showMADropdown) {
      return undefined;
    }
    const handleClickOutside = () => setShowMADropdown(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMADropdown(false);
      }
    };
    const timer = setTimeout(
      () => document.addEventListener('click', handleClickOutside),
      0,
    );
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMADropdown]);

  return (
    <div
      data-testid="advanced-chart-indicator-bar"
      style={{
        borderTop: '1px solid var(--color-border-muted)',
        borderBottom: '1px solid var(--color-border-muted)',
        // Anchors the MA popover. It sits outside the scrolling row below so
        // that row's `overflow` cannot clip it.
        position: 'relative',
        minWidth: 0,
      }}
    >
      <div
        data-testid="advanced-chart-indicator-pills"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0px',
          padding: '6px 16px',
          // The pills need roughly 300px between them and none of them
          // shrink, which is more than a narrowed side panel has. Scroll the
          // row rather than let it push the whole page wider.
          minWidth: 0,
          overflowX: 'auto',
        }}
      >
        {/* MA dropdown trigger */}
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={showMADropdown}
          onClick={() => setShowMADropdown((v) => !v)}
          style={{
            ...pillStyle(selectedMAs.length > 0),
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            paddingRight: '14px',
            marginRight: '8px',
          }}
        >
          {maLabel} ▾
        </button>

        {/* Divider after MA */}
        <div
          style={{
            width: '1px',
            height: '16px',
            background: 'var(--color-border-muted)',
            marginRight: '4px',
            flexShrink: 0,
          }}
        />

        {/* Indicator toggle pills */}
        {TOGGLE_INDICATORS.map((name) => {
          const isActive = activeIndicators.has(name);
          return (
            <React.Fragment key={name}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onIndicatorToggle(name)}
                style={pillStyle(isActive)}
              >
                {name}
              </button>
              {name === 'BOL' && (
                <div
                  style={{
                    width: '1px',
                    height: '16px',
                    background: 'var(--color-border-muted)',
                    margin: '0 2px',
                    flexShrink: 0,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* MA dropdown popover */}
      {showMADropdown && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: '12px',
            zIndex: 100,
            background: 'var(--color-background-default)',
            border: '1px solid var(--color-border-muted)',
            borderRadius: '8px', // BorderRadius.LG
            padding: '4px 0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '120px',
          }}
        >
          {MA_OPTIONS.map((ma) => {
            const isActive = activeIndicators.has(ma);
            return (
              <button
                key={ma}
                type="button"
                role="menuitemcheckbox"
                aria-checked={isActive}
                onClick={() => onMAToggle(ma)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '6px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? toolbarText : toolbarMuted,
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '3px',
                    border: `1.5px solid ${isActive ? activeCheckColor : toolbarMuted}`,
                    background: isActive ? activeCheckColor : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: isDark ? brandColor.black : brandColor.white,
                  }}
                >
                  {isActive ? '✓' : ''}
                </span>
                {ma}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IndicatorBar;
