import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Text,
  SensitiveText,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Icon,
  IconColor,
  IconName,
  IconSize,
  twMerge,
} from '@metamask/design-system-react';
import { getPreferences } from '../../../../../../../shared/lib/selectors/preferences';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { Popover, PopoverPosition } from '../../../../../component-library';
import { formatPerpsFeeRate } from '../../../../../../hooks/perps/usePerpsOrderFees';
import { PerpsFeesDisplay } from '../../../perps-fees-display';
import type { OrderSummaryProps } from '../../order-entry.types';

const TOOLTIP_POPOVER_STYLE = {
  zIndex: 1051,
  backgroundColor: 'var(--color-text-default)',
  paddingTop: '12px',
  paddingBottom: '12px',
  paddingLeft: '16px',
  paddingRight: '16px',
  maxWidth: 250,
} as const;

type TooltipLabelProps = {
  label: string;
  tooltip: React.ReactNode;
  testId: string;
};

const TooltipLabel = ({ label, tooltip, testId }: TooltipLabelProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const handleOpen = React.useCallback(() => setIsOpen(true), []);
  const handleClose = React.useCallback(() => setIsOpen(false), []);

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={1}
      data-testid={testId}
    >
      <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
        {label}
      </Text>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label} info`}
        data-testid={`${testId}-trigger`}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        className="inline-flex cursor-help border-0 bg-transparent p-0"
      >
        <Icon
          name={IconName.Info}
          size={IconSize.Sm}
          color={IconColor.IconAlternative}
        />
      </button>
      <Popover
        isOpen={isOpen}
        position={PopoverPosition.TopStart}
        referenceElement={triggerRef.current}
        hasArrow
        flip
        preventOverflow
        isPortal
        offset={[-32, 8]}
        onPressEscKey={handleClose}
        onClickOutside={handleClose}
        style={TOOLTIP_POPOVER_STYLE}
      >
        {tooltip}
      </Popover>
    </Box>
  );
};

type TooltipBodyProps = {
  children: React.ReactNode;
  testId: string;
};

const TooltipBody = ({ children, testId }: TooltipBodyProps) => (
  <Box
    role="tooltip"
    data-testid={testId}
    flexDirection={BoxFlexDirection.Column}
    gap={2}
    className="w-full max-w-full"
  >
    {children}
  </Box>
);

type FeeTooltipRowProps = {
  label: string;
  value: string;
};

const FeeTooltipRow = ({ label, value }: FeeTooltipRowProps) => (
  <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4">
    <Text
      variant={TextVariant.BodySm}
      color={TextColor.InfoInverse}
      className="leading-5"
    >
      {label}
    </Text>
    <Text
      variant={TextVariant.BodySm}
      color={TextColor.InfoInverse}
      className="text-right leading-5"
    >
      {value}
    </Text>
  </div>
);

/**
 * OrderSummary - Displays calculated order values (margin, fees, liquidation price)
 *
 * @param props - Component props
 * @param props.marginRequired - Margin required for the position
 * @param props.estimatedFees - Estimated trading fees (after discount)
 * @param props.originalEstimatedFees - Estimated trading fees before discount
 * @param props.liquidationPrice - Estimated liquidation price
 * @param props.metamaskFeeRateDiscountPercentage - MetaMask fee discount percentage (whole numbers)
 * @param props.metamaskFeeRate - Live MetaMask fee rate for the fees tooltip
 * @param props.protocolFeeRate - Live protocol/provider fee rate for the fees tooltip
 * @param props.protocolFeeLabel - Label for the protocol/provider fee row
 * @param props.showSlippageRow
 * @param props.slippageDisplay
 * @param props.exceedsMaxSlippage
 * @param props.onSlippageClick
 * @param props.isSlippageRowDisabled
 */
export const OrderSummary = ({
  marginRequired,
  estimatedFees,
  originalEstimatedFees,
  liquidationPrice,
  metamaskFeeRateDiscountPercentage,
  metamaskFeeRate,
  protocolFeeRate,
  protocolFeeLabel,
  showSlippageRow = false,
  slippageDisplay,
  exceedsMaxSlippage = false,
  onSlippageClick,
  isSlippageRowDisabled = false,
}: OrderSummaryProps) => {
  const t = useI18nContext();
  const { privacyMode } = useSelector(getPreferences);

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      {/* Liquidation price */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <TooltipLabel
          label={t('perpsLiquidationPrice')}
          testId="perps-order-summary-liquidation-price-tooltip-label"
          tooltip={
            <TooltipBody testId="perps-order-summary-liquidation-price-tooltip">
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.InfoInverse}
                className="leading-5"
              >
                {t('perpsLiquidationPriceTooltip')}
              </Text>
            </TooltipBody>
          }
        />
        <SensitiveText
          variant={TextVariant.BodySm}
          color={TextColor.TextDefault}
          isHidden={privacyMode}
          data-testid="perps-order-summary-liquidation-price"
        >
          {liquidationPrice ?? '-'}
        </SensitiveText>
      </Box>

      {showSlippageRow && (
        <button
          type="button"
          onClick={onSlippageClick}
          disabled={isSlippageRowDisabled}
          data-testid="perps-order-summary-slippage-row"
          aria-label={t('perpsSlippageEditAriaLabel')}
          className={twMerge(
            'flex w-full items-center justify-between border-0 bg-transparent p-0 text-left',
            isSlippageRowDisabled
              ? 'cursor-not-allowed opacity-70'
              : 'cursor-pointer',
          )}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsSlippage')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
          >
            <Text
              variant={TextVariant.BodySm}
              color={
                exceedsMaxSlippage
                  ? TextColor.ErrorDefault
                  : TextColor.TextDefault
              }
              data-testid="perps-order-summary-slippage-value"
            >
              {slippageDisplay ?? '-'}
            </Text>
            {exceedsMaxSlippage ? (
              <span
                className="sr-only"
                aria-live="polite"
                data-testid="perps-order-slippage-exceeds-indicator"
              >
                {t('perpsSlippageExceeded')}
              </span>
            ) : null}
            <Icon
              name={IconName.Edit}
              size={IconSize.Sm}
              color={IconColor.IconAlternative}
            />
          </Box>
        </button>
      )}

      {/* Margin */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <TooltipLabel
          label={t('perpsMargin')}
          testId="perps-order-summary-margin-tooltip-label"
          tooltip={
            <TooltipBody testId="perps-order-summary-margin-tooltip">
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.InfoInverse}
                className="leading-5"
              >
                {t('perpsMarginTooltip')}
              </Text>
            </TooltipBody>
          }
        />
        <SensitiveText
          variant={TextVariant.BodySm}
          color={TextColor.TextDefault}
          isHidden={privacyMode}
          data-testid="perps-order-summary-margin-required"
        >
          {marginRequired ?? '-'}
        </SensitiveText>
      </Box>

      {/* Fees */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <TooltipLabel
          label={t('perpsFees')}
          testId="perps-order-summary-fees-tooltip-label"
          tooltip={
            <TooltipBody testId="perps-order-summary-fees-tooltip">
              <FeeTooltipRow
                label={t('perpsFeesTooltipMetamaskFee')}
                value={formatPerpsFeeRate(metamaskFeeRate)}
              />
              <FeeTooltipRow
                label={protocolFeeLabel ?? t('perpsFeesTooltipProviderFee')}
                value={formatPerpsFeeRate(protocolFeeRate)}
              />
            </TooltipBody>
          }
        />
        <PerpsFeesDisplay
          metamaskFeeRateDiscountPercentage={
            estimatedFees === null
              ? undefined
              : metamaskFeeRateDiscountPercentage
          }
          originalFee={originalEstimatedFees ?? undefined}
          fee={estimatedFees ?? undefined}
          feeTextTestId="perps-order-summary-estimated-fees"
        />
      </Box>
    </Box>
  );
};

export default OrderSummary;
