import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { Popover, PopoverPosition } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

/**
 * Whether the current browser supports Interest Invokers (`interestfor`,
 * Chromium 141+), which power the native tooltip. Exposed as a mutable object
 * so tests can exercise both the native and fallback code paths.
 */
export const rebateTooltipInterestSupport = {
  detected:
    typeof HTMLButtonElement !== 'undefined' &&
    'interestFor' in HTMLButtonElement.prototype,
};

/**
 * Grace period before the fallback tooltip closes, so the pointer can move
 * onto the tooltip text (WCAG 1.4.13 Hoverable).
 */
const FALLBACK_TOOLTIP_CLOSE_DELAY_MS = 300;

type RebateBannerProps = {
  /**
   * The rebate percentage to display, e.g. `10` renders "You're getting 10%
   * back on fees".
   */
  rebatePercent: number;
  /** The `data-testid` of the banner. */
  testId: string;
  /** Extra classes appended to the banner's box, e.g. a margin. */
  className?: string;
};

/**
 * Shared fee-rebate presentation for trading confirmations.
 *
 * Product-specific wrappers own eligibility and data fetching. This component
 * only renders the common copy and educational tooltip.
 *
 * The tooltip opens on hover, focus and (on Chromium 141+) touch via native
 * Interest Invokers, and its `popover="hint"` panel renders in the top layer,
 * so it stays readable above modal overlays. It opens above the trigger,
 * right-aligned to it, because every surface mounts the banner right above a
 * CTA; `position-try-fallbacks` flips it below only when there is no room
 * above. Browsers without Interest Invokers fall back to a hover/focus
 * triggered `Popover` whose z-index sits above the modal layer (1050).
 */
export const RebateBanner = ({
  rebatePercent,
  testId,
  className,
}: RebateBannerProps) => {
  const t = useI18nContext();
  const nativePopoverId = useId();
  const fallbackPopoverId = useId();
  const [triggerElement, setTriggerElement] =
    useState<HTMLButtonElement | null>(null);
  const [isFallbackTooltipOpen, setIsFallbackTooltipOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirrors of hover/focus state, read by the close scheduler so that one
  // trigger going away (e.g. blur) does not close the tooltip while the
  // other (e.g. pointer over the tooltip) is still active.
  const isPointerOverRef = useRef(false);
  const isTriggerFocusedRef = useRef(false);

  const openFallbackTooltip = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsFallbackTooltipOpen(true);
  }, []);

  const scheduleFallbackClose = useCallback(() => {
    if (isPointerOverRef.current || isTriggerFocusedRef.current) {
      return;
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      setIsFallbackTooltipOpen(false);
    }, FALLBACK_TOOLTIP_CLOSE_DELAY_MS);
  }, []);

  const handlePointerEnter = useCallback(() => {
    isPointerOverRef.current = true;
    openFallbackTooltip();
  }, [openFallbackTooltip]);

  const handlePointerLeave = useCallback(() => {
    isPointerOverRef.current = false;
    scheduleFallbackClose();
  }, [scheduleFallbackClose]);

  const handleTriggerFocus = useCallback(() => {
    isTriggerFocusedRef.current = true;
    openFallbackTooltip();
  }, [openFallbackTooltip]);

  const handleTriggerBlur = useCallback(() => {
    isTriggerFocusedRef.current = false;
    scheduleFallbackClose();
  }, [scheduleFallbackClose]);

  // Escape unmounts the tooltip without a mouseleave, so the mirrored
  // interaction refs must be reset here or they go stale and block later
  // close scheduling.
  const dismissFallbackTooltip = useCallback(() => {
    isPointerOverRef.current = false;
    isTriggerFocusedRef.current = false;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsFallbackTooltipOpen(false);
  }, []);

  useEffect(
    () => () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    },
    [],
  );

  if (rebatePercent <= 0) {
    return null;
  }

  const isNativeTooltip = rebateTooltipInterestSupport.detected;

  const tooltipContent = (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      <Text variant={TextVariant.HeadingSm} color={TextColor.TextDefault}>
        {t('rebateTooltipTitle')}
      </Text>
      <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
        {t('rebateTooltipContent', [rebatePercent])}
      </Text>
    </Box>
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
      className={
        className
          ? `w-full rounded-lg bg-muted px-3 py-2 ${className}`
          : 'w-full rounded-lg bg-muted px-3 py-2'
      }
      data-testid={testId}
      {...(isNativeTooltip
        ? {}
        : {
            onMouseEnter: handlePointerEnter,
            onMouseLeave: handlePointerLeave,
          })}
    >
      <img src="./images/money.png" width={16} height={16} alt="" />
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextDefault}
        className="flex-1"
      >
        {t('rebateBanner', [rebatePercent])}
      </Text>
      <ButtonIcon
        ref={setTriggerElement}
        type="button"
        iconName={IconName.Info}
        size={ButtonIconSize.Xs}
        iconProps={{ color: IconColor.IconAlternative }}
        ariaLabel={t('rebateTooltipTitle')}
        onClick={(event) => event.stopPropagation()}
        onFocus={isNativeTooltip ? undefined : handleTriggerFocus}
        onBlur={isNativeTooltip ? undefined : handleTriggerBlur}
        aria-describedby={
          !isNativeTooltip && isFallbackTooltipOpen
            ? fallbackPopoverId
            : undefined
        }
        // @ts-expect-error React types do not include interestfor yet.
        interestfor={isNativeTooltip ? nativePopoverId : undefined}
        data-testid={`${testId}-tooltip-trigger`}
      />
      {isNativeTooltip ? (
        <div
          id={nativePopoverId}
          // @ts-expect-error React types do not include popover yet.
          popover="hint"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          data-testid={`${testId}-tooltip`}
          className="m-0 mb-2 max-w-[264px] rounded-lg border border-border-muted bg-background-default p-4 text-start text-text-default shadow-md [position-area:top_span-x-start] [justify-self:end] [position-try-fallbacks:flip-block]"
        >
          {tooltipContent}
        </div>
      ) : (
        <Popover
          id={fallbackPopoverId}
          isOpen={isFallbackTooltipOpen}
          referenceElement={triggerElement}
          position={PopoverPosition.TopEnd}
          offset={[16, 16]}
          hasArrow
          isPortal
          preventOverflow
          flip
          onPressEscKey={dismissFallbackTooltip}
          onMouseEnter={handlePointerEnter}
          onMouseLeave={handlePointerLeave}
          style={{ maxWidth: '264px', zIndex: 1051 }}
          data-testid={`${testId}-tooltip`}
        >
          {tooltipContent}
        </Popover>
      )}
    </Box>
  );
};
