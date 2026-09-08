import React, { useCallback, useEffect, useState } from 'react';
import { brandColor } from '@metamask/design-tokens';
import { useTheme } from '../../../../hooks/useTheme';

/**
 * [POC — THROWAWAY] IndicatorBar
 *
 * Mirrors mobile's IndicatorBar.tsx.
 * Renders MA dropdown + BOL/RSI/Volume/MACD toggle pills.
 * Displayed BELOW the chart, as a separate component in the parent layout.
 */

const TOGGLE_INDICATORS = ['BOL', 'RSI', 'Volume', 'MACD'] as const;
const MA_OPTIONS = ['MA5', 'MA10', 'MA20', 'MA50', 'MA200'] as const;

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
  const toolbarMuted = 'var(--color-text-muted)';
  const activeCheckColor = isDark ? brandColor.lime100 : brandColor.green500;
  const pillStyle = (isSelected: boolean) => ({
    padding: '4px 10px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer' as const,
    fontSize: '12px',
    fontWeight: isSelected ? 600 : 500,
    background: 'transparent',
    color: isSelected ? toolbarText : toolbarMuted,
  });

  const selectedMAs = [...activeIndicators].filter((n) => /^MA\d+$/u.test(n));
  let maLabel: string;
  if (selectedMAs.length === 0) {
    maLabel = 'MA';
  } else if (selectedMAs.length === 1) {
    maLabel = selectedMAs[0];
  } else {
    maLabel = `MA ×${selectedMAs.length}`;
  }

  // Close MA dropdown when clicking outside
  useEffect(() => {
    if (!showMADropdown) {
      return;
    }
    const handleClickOutside = () => setShowMADropdown(false);
    const timer = setTimeout(
      () => document.addEventListener('click', handleClickOutside),
      0,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMADropdown]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0px',
        padding: '6px 16px',
        borderTop: '1px solid var(--color-border-muted)',
        borderBottom: '1px solid var(--color-border-muted)',
        position: 'relative',
      }}
    >
      {/* MA dropdown trigger */}
      <button
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

      {/* MA dropdown popover */}
      {showMADropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '12px',
            zIndex: 100,
            background: 'var(--color-background-default)',
            border: '1px solid var(--color-border-muted)',
            borderRadius: '8px',
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

      {/* Divider after MA */}
      <div
        style={{
          width: '1px',
          height: '16px',
          background: 'var(--color-border-muted)',
          marginRight: '4px',
        }}
      />

      {/* Indicator toggle pills */}
      {TOGGLE_INDICATORS.map((name) => {
        const isActive = activeIndicators.has(name);
        return (
          <React.Fragment key={name}>
            <button
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
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default IndicatorBar;
