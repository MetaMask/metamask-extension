import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  ButtonBase,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';

/**
 * IndicatorBar
 *
 * Renders the moving-average dropdown plus BOL/RSI/Volume/MACD toggle pills.
 * Displayed BELOW the chart, as a separate component in the parent layout.
 */

const TOGGLE_INDICATORS = ['BOL', 'RSI', 'Volume', 'MACD'] as const;
const MA_OPTIONS = ['MA5', 'MA10', 'MA20', 'MA50', 'MA200'] as const;

// A toolbar toggle is a borderless `ButtonBase` that reads as plain text: the
// pressed state is carried by the label colour, not a filled pill, matching the
// compact chart toolbars in the designs (and mobile).
const PILL_CLASS =
  'h-auto shrink-0 rounded-lg bg-transparent px-1.5 py-1 hover:bg-hover active:bg-pressed';

/**
 * Moving averages are driven by a single `SET_MA_VISIBILITY` message rather
 * than the per-indicator add/remove messages, so callers need to tell the two
 * kinds of indicator apart.
 *
 * @param name - Indicator name, e.g. `MA20` or `RSI`.
 */
export const isMovingAverage = (name: string) => /^MA\d+$/u.test(name);

const pillTextColor = (isActive: boolean) =>
  isActive ? TextColor.TextDefault : TextColor.TextAlternative;

// Selected toggles read as bold (not just a colour change) to match the designs.
const pillFontWeight = (isActive: boolean) =>
  isActive ? FontWeight.Bold : FontWeight.Regular;

type IndicatorBarProps = {
  activeIndicators: Set<string>;
  onIndicatorToggle: (name: string) => void;
  onMAToggle: (ma: string) => void;
  /** Called when the moving-average dropdown is opened, but not when closed. */
  onMASelectorOpen?: () => void;
};

const IndicatorBar = ({
  activeIndicators,
  onIndicatorToggle,
  onMAToggle,
  onMASelectorOpen,
}: IndicatorBarProps) => {
  const [showMADropdown, setShowMADropdown] = useState(false);
  const maTriggerRef = useRef<HTMLButtonElement | null>(null);
  const maMenuRef = useRef<HTMLDivElement | null>(null);

  const selectedMAs = [...activeIndicators].filter(isMovingAverage);
  const hasSelectedMAs = selectedMAs.length > 0;
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
    // Only close on clicks that land outside both the trigger and the menu.
    // A bare close-on-any-click would fire when selecting an MA option (the
    // click bubbles to the document), forcing the user to reopen the menu for
    // every moving average they want to toggle.
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        maTriggerRef.current?.contains(target) ||
        maMenuRef.current?.contains(target)
      ) {
        return;
      }
      setShowMADropdown(false);
    };
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
      <Box
        data-testid="advanced-chart-indicator-pills"
        // The pills need roughly 300px between them and none of them shrink,
        // which is more than a narrowed side panel has. Scroll the row rather
        // than let it push the whole page wider.
        className="flex min-w-0 items-center gap-1 overflow-x-auto px-4 py-1.5"
        style={{
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
          overflowX: 'auto',
        }}
      >
        {/* MA dropdown trigger */}
        <ButtonBase
          ref={maTriggerRef}
          type="button"
          aria-haspopup="true"
          aria-expanded={showMADropdown}
          onClick={() => {
            // Read state outside the updater: updaters must stay pure, and
            // React may invoke them twice in development.
            if (!showMADropdown) {
              onMASelectorOpen?.();
            }
            setShowMADropdown((v) => !v);
          }}
          className={twMerge(PILL_CLASS, 'flex items-center gap-1')}
          data-testid="advanced-chart-ma-trigger"
        >
          <Text
            variant={TextVariant.BodyXs}
            color={pillTextColor(hasSelectedMAs)}
            fontWeight={pillFontWeight(hasSelectedMAs)}
          >
            {maLabel}
          </Text>
          <Icon
            name={IconName.ArrowDown}
            size={IconSize.Xs}
            color={
              hasSelectedMAs ? IconColor.IconDefault : IconColor.IconAlternative
            }
            className="shrink-0"
          />
        </ButtonBase>

        {/* Divider after MA */}
        <Box className="mx-1 h-4 w-px shrink-0 bg-border-muted" />

        {/* Indicator toggle pills */}
        {TOGGLE_INDICATORS.map((name) => {
          const isActive = activeIndicators.has(name);
          return (
            <React.Fragment key={name}>
              <ButtonBase
                type="button"
                aria-pressed={isActive}
                onClick={() => onIndicatorToggle(name)}
                className={PILL_CLASS}
                data-testid={`advanced-chart-indicator-${name}`}
              >
                <Text
                  variant={TextVariant.BodyXs}
                  color={pillTextColor(isActive)}
                  fontWeight={pillFontWeight(isActive)}
                >
                  {name}
                </Text>
              </ButtonBase>
              {name === 'BOL' && (
                <Box className="mx-1 h-4 w-px shrink-0 bg-border-muted" />
              )}
            </React.Fragment>
          );
        })}
      </Box>

      {/* MA dropdown popover */}
      {showMADropdown && (
        <Box
          ref={maMenuRef}
          role="group"
          aria-label="Moving averages"
          data-testid="advanced-chart-ma-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: '12px',
            zIndex: 100,
            background: 'var(--color-background-default)',
            border: '1px solid var(--color-border-muted)',
            borderRadius: '8px', // BorderRadius.LG
            padding: '4px 0',
            boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
            minWidth: '120px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {MA_OPTIONS.map((ma) => {
            const isActive = activeIndicators.has(ma);
            return (
              <ButtonBase
                key={ma}
                type="button"
                role="checkbox"
                aria-checked={isActive}
                onClick={() => onMAToggle(ma)}
                className="h-auto w-full justify-start gap-2 rounded-none bg-transparent px-3 py-1.5 hover:bg-hover active:bg-pressed"
                data-testid={`advanced-chart-ma-option-${ma}`}
              >
                {/* The design uses a small square tick, not MMDS's 24px circular
                    Checkbox, so the box is built from primitives. */}
                <Box
                  className={twMerge(
                    'flex size-3.5 shrink-0 items-center justify-center rounded-sm border border-muted',
                    isActive && 'border-success-default bg-success-default',
                  )}
                >
                  {isActive && (
                    <Icon
                      name={IconName.Check}
                      size={IconSize.Xs}
                      color={IconColor.SuccessInverse}
                    />
                  )}
                </Box>
                <Text
                  variant={TextVariant.BodyXs}
                  color={TextColor.TextDefault}
                >
                  {ma}
                </Text>
              </ButtonBase>
            );
          })}
        </Box>
      )}
    </div>
  );
};

export default IndicatorBar;
