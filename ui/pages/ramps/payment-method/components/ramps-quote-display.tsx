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

const WARNING_TOOLTIP_POPOVER_STYLE = {
  zIndex: 1050,
  paddingTop: '6px',
  paddingBottom: '6px',
  paddingLeft: '16px',
  paddingRight: '16px',
  maxWidth: 250,
} as const;

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
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null,
  );
  const popoverId = useId();

  const handleOpen = useCallback(() => setIsTooltipOpen(true), []);
  const handleClose = useCallback(() => setIsTooltipOpen(false), []);

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
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        justifyContent={BoxJustifyContent.Center}
        data-testid="ramps-quote-display-warning"
      >
        <span
          ref={setReferenceElement}
          onMouseEnter={warningMessage ? handleOpen : undefined}
          onMouseLeave={warningMessage ? handleClose : undefined}
          aria-describedby={isTooltipOpen ? popoverId : undefined}
          data-testid="ramps-quote-display-warning-trigger"
          className="flex"
        >
          <Icon
            name={IconName.Warning}
            size={IconSize.Sm}
            color={IconColor.WarningDefault}
          />
        </span>
        {warningMessage ? (
          <Popover
            id={popoverId}
            isOpen={isTooltipOpen}
            position={PopoverPosition.BottomEnd}
            referenceElement={referenceElement}
            hasArrow
            onPressEscKey={handleClose}
            isPortal
            style={WARNING_TOOLTIP_POPOVER_STYLE}
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
