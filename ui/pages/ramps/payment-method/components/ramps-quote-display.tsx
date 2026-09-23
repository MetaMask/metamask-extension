import React, { useCallback, useId, useState } from 'react';
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
import {
  Popover,
  PopoverPosition,
} from '../../../../components/component-library';

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
  const nativePopoverId = useId();
  const fallbackPopoverId = useId();
  const [triggerElement, setTriggerElement] =
    useState<HTMLButtonElement | null>(null);
  const [isFallbackTooltipOpen, setIsFallbackTooltipOpen] = useState(false);
  const handleFallbackOpen = useCallback(() => {
    setIsFallbackTooltipOpen(true);
  }, []);
  const handleFallbackClose = useCallback(() => {
    setIsFallbackTooltipOpen(false);
  }, []);

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
    const useNativeTooltip =
      interestInvokerSupport.detected && Boolean(warningMessage);
    const useFallbackTooltip =
      !interestInvokerSupport.detected && Boolean(warningMessage);
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        justifyContent={BoxJustifyContent.Center}
        data-testid="ramps-quote-display-warning"
        onMouseEnter={useFallbackTooltip ? handleFallbackOpen : undefined}
        onMouseLeave={useFallbackTooltip ? handleFallbackClose : undefined}
      >
        <button
          type="button"
          ref={setTriggerElement}
          className="border-0 bg-transparent p-0"
          onClick={(event) => event.stopPropagation()}
          onFocus={useFallbackTooltip ? handleFallbackOpen : undefined}
          onBlur={useFallbackTooltip ? handleFallbackClose : undefined}
          onKeyDown={(event) => event.stopPropagation()}
          aria-describedby={
            useFallbackTooltip && isFallbackTooltipOpen
              ? fallbackPopoverId
              : undefined
          }
          // @ts-expect-error React types do not include interestfor yet.
          interestfor={useNativeTooltip ? nativePopoverId : undefined} // eslint-disable-line react/no-unknown-property
          data-testid="ramps-quote-display-warning-trigger"
        >
          <Icon
            name={IconName.Warning}
            size={IconSize.Sm}
            color={IconColor.WarningDefault}
          />
        </button>
        {useNativeTooltip ? (
          <div
            // @ts-expect-error React types do not include popover yet.
            popover="hint"
            id={nativePopoverId}
            onClick={(event) => event.stopPropagation()}
            data-testid="ramps-quote-display-warning-tooltip"
            className="m-0 max-w-[250px] rounded-lg border border-border-muted bg-background-default p-4 text-text-default shadow-md [position-area:bottom]"
          >
            <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
              {warningMessage}
            </Text>
          </div>
        ) : null}
        {useFallbackTooltip ? (
          <Popover
            id={fallbackPopoverId}
            isOpen={isFallbackTooltipOpen}
            position={PopoverPosition.Auto}
            referenceElement={triggerElement}
            hasArrow
            isPortal
            onPressEscKey={handleFallbackClose}
            style={{ maxWidth: '250px' }}
            data-testid="ramps-quote-display-warning-tooltip"
          >
            <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
              {warningMessage}
            </Text>
          </Popover>
        ) : null}
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
