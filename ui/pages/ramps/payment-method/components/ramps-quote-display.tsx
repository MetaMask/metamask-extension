import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Icon,
  IconColor,
  IconName,
  IconSize,
  FontWeight,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { Popover } from '../../../../components/component-library'; // NOSONAR: migrating this fallback to the design-system Popover would add @floating-ui to the bundle and require LavaMoat policy changes, which is deferred to a dedicated design-system follow-up

export type RampsQuoteDisplayProps = {
  cryptoAmount: string;
  fiatAmount: string | null;
  isLoading?: boolean;
  showWarningIcon?: boolean;
  /**
   * Why the quote is unavailable, shown in a hover tooltip next to the
   * warning icon (e.g. provider limits or "Quote unavailable.").
   */
  warningMessage?: string;
};

/**
 * Whether the current browser supports Interest Invokers (`interestfor`,
 * Chromium 141+), which power the native tooltip. Exposed as a mutable object
 * so tests can exercise both the native and fallback code paths.
 */
export const interestInvokerSupport = {
  detected:
    typeof HTMLButtonElement !== 'undefined' &&
    'interestFor' in HTMLButtonElement.prototype,
};

/**
 * Grace period before the fallback tooltip closes, so the pointer can move
 * onto the tooltip text (WCAG 1.4.13 Hoverable).
 */
const FALLBACK_TOOLTIP_CLOSE_DELAY_MS = 300;

type TooltipContentProps = {
  message: string;
};

function tooltipContent({ message }: TooltipContentProps) {
  return (
    <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
      {message}
    </Text>
  );
}

export function NativeTooltip({
  popoverId,
  message,
}: {
  popoverId: string;
  message: string;
}) {
  return (
    <div
      // @ts-expect-error React types do not include popover yet.
      popover="hint"
      id={popoverId}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      data-testid="ramps-quote-display-warning-tooltip"
      className="m-0 max-w-[250px] rounded-lg border border-border-muted bg-background-default p-4 text-text-default shadow-md [position-area:bottom]"
    >
      {tooltipContent({ message })}
    </div>
  );
}

type FallbackTooltipProps = {
  popoverId: string;
  isOpen: boolean;
  message: string;
  referenceElement: HTMLButtonElement | null;
  onDismiss: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export function FallbackTooltip({
  popoverId,
  isOpen,
  message,
  referenceElement,
  onDismiss,
  onMouseEnter,
  onMouseLeave,
}: FallbackTooltipProps) {
  return (
    <Popover // NOSONAR: see import note; legacy Popover migration is deferred to a design-system follow-up
      id={popoverId}
      isOpen={isOpen}
      referenceElement={referenceElement}
      hasArrow
      isPortal
      onPressEscKey={onDismiss}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ maxWidth: '250px' }}
      data-testid="ramps-quote-display-warning-tooltip"
    >
      {tooltipContent({ message })}
    </Popover>
  );
}

type RampsQuoteWarningProps = {
  warningMessage: string;
};

/**
 * Quote-unavailable warning icon with a tooltip explaining why the quote is
 * missing. Uses the native Interest Invokers API on Chromium 141+ and falls
 * back to a hover/focus-triggered `Popover` elsewhere.
 * @param options0
 * @param options0.warningMessage
 */
export function RampsQuoteWarning({ warningMessage }: RampsQuoteWarningProps) {
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

  useEffect(
    () => () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    },
    [],
  );

  const isNativeTooltip = interestInvokerSupport.detected;

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.End}
      justifyContent={BoxJustifyContent.Center}
      data-testid="ramps-quote-display-warning"
      {...(isNativeTooltip
        ? {}
        : {
            onMouseEnter: handlePointerEnter,
            onMouseLeave: handlePointerLeave,
          })}
    >
      <button
        type="button"
        ref={setTriggerElement}
        className="border-0 bg-transparent p-0"
        onClick={(event) => event.stopPropagation()}
        onFocus={isNativeTooltip ? undefined : handleTriggerFocus}
        onBlur={isNativeTooltip ? undefined : handleTriggerBlur}
        aria-describedby={
          !isNativeTooltip && isFallbackTooltipOpen
            ? fallbackPopoverId
            : undefined
        }
        // @ts-expect-error React types do not include interestfor yet.
        interestfor={isNativeTooltip ? nativePopoverId : undefined} // eslint-disable-line react/no-unknown-property
        data-testid="ramps-quote-display-warning-trigger"
      >
        <Icon
          name={IconName.Warning}
          size={IconSize.Sm}
          color={IconColor.WarningDefault}
        />
      </button>
      {isNativeTooltip ? (
        <NativeTooltip popoverId={nativePopoverId} message={warningMessage} />
      ) : (
        <FallbackTooltip
          popoverId={fallbackPopoverId}
          isOpen={isFallbackTooltipOpen}
          message={warningMessage}
          referenceElement={triggerElement}
          onDismiss={() => setIsFallbackTooltipOpen(false)}
          onMouseEnter={handlePointerEnter}
          onMouseLeave={handlePointerLeave}
        />
      )}
    </Box>
  );
}

/**
 * Right-column quote preview for payment method rows (mobile `QuoteDisplay`).
 *
 * @param options0
 * @param options0.cryptoAmount
 * @param options0.fiatAmount
 * @param options0.isLoading
 * @param options0.showWarningIcon
 * @param options0.warningMessage
 */
export default function RampsQuoteDisplay({
  cryptoAmount,
  fiatAmount,
  isLoading = false,
  showWarningIcon = false,
  warningMessage,
}: RampsQuoteDisplayProps) {
  if (isLoading) {
    return (
      <Box
        className="items-end"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
        data-testid="ramps-quote-display-loading"
      >
        <Skeleton height={16} width={80} className="rounded" />
        <Skeleton height={16} width={60} className="rounded" />
      </Box>
    );
  }

  if (showWarningIcon) {
    return warningMessage ? (
      <RampsQuoteWarning warningMessage={warningMessage} />
    ) : (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        justifyContent={BoxJustifyContent.Center}
        data-testid="ramps-quote-display-warning"
      >
        <Icon
          name={IconName.Warning}
          size={IconSize.Sm}
          color={IconColor.WarningDefault}
        />
      </Box>
    );
  }

  if (cryptoAmount || fiatAmount !== null) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        data-testid="ramps-quote-display"
      >
        {cryptoAmount ? (
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {cryptoAmount}
          </Text>
        ) : null}
        {fiatAmount === null ? null : (
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {fiatAmount}
          </Text>
        )}
      </Box>
    );
  }

  return null;
}
