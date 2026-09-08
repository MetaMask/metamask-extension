import React, { useCallback, useEffect, useState } from 'react';
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

interface IndicatorBarProps {
  activeIndicators: Set<string>;
  onIndicatorToggle: (name: string) => void;
  onMAToggle: (ma: string) => void;
}

const IndicatorBar = ({
  activeIndicators,
  onIndicatorToggle,
  onMAToggle,
}: IndicatorBarProps) => {
  const theme = useTheme();
  const isDark = theme === 'dark';
  const [showMADropdown, setShowMADropdown] = useState(false);

  const toolbarText = isDark ? '#ffffff' : '#24272a';
  const toolbarMuted = isDark ? '#66676a' : '#9fa6ae';
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

  const selectedMAs = [...activeIndicators].filter((n) => /^MA\d+$/.test(n));
  const maLabel =
    selectedMAs.length === 0
      ? 'MA'
      : selectedMAs.length === 1
        ? selectedMAs[0]
        : `MA ×${selectedMAs.length}`;

  // Close MA dropdown when clicking outside
  useEffect(() => {
    if (!showMADropdown) return;
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
        borderTop: `1px solid ${isDark ? '#333' : '#d6d9dc'}`,
        borderBottom: `1px solid ${isDark ? '#333' : '#d6d9dc'}`,
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
            background: isDark ? '#24242a' : '#fff',
            border: `1px solid ${isDark ? '#444' : '#d6d9dc'}`,
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
                    border: `1.5px solid ${isActive ? (isDark ? '#baf24a' : '#1c8234') : toolbarMuted}`,
                    background: isActive
                      ? isDark
                        ? '#baf24a'
                        : '#1c8234'
                      : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: isDark ? '#000' : '#fff',
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
          background: isDark ? '#444' : '#d6d9dc',
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
                  background: isDark ? '#444' : '#d6d9dc',
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
