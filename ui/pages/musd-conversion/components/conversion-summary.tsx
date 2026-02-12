/**
 * Conversion Summary Component
 *
 * Displays a summary of the conversion including fees and estimated time.
 */

///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import React from 'react';
import { Box, Text } from '../../../components/component-library';
import {
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { formatMusdAmount } from '../../../../shared/lib/musd';

// ============================================================================
// Types
// ============================================================================

type ConversionSummaryProps = {
  /** Input amount in USD */
  inputAmount: string;
  /** Output amount in mUSD */
  outputAmount: string;
  /** Fee breakdown */
  fees: {
    gasFee: string;
    relayerFee: string;
    totalFee: string;
  } | null;
  /** Estimated time in seconds */
  timeEstimate?: number;
  /** Loading state */
  isLoading?: boolean;
};

// ============================================================================
// Component
// ============================================================================

/**
 * Conversion Summary Component
 *
 * @param options0
 * @param options0.inputAmount
 * @param options0.outputAmount
 * @param options0.fees
 * @param options0.timeEstimate
 * @param options0.isLoading
 */
const ConversionSummary: React.FC<ConversionSummaryProps> = ({
  inputAmount,
  outputAmount,
  fees,
  timeEstimate,
  isLoading = false,
}) => {
  /**
   * Format time estimate for display
   *
   * @param seconds
   */
  const formatTimeEstimate = (seconds?: number): string => {
    if (!seconds) {
      return '~4 seconds';
    }
    if (seconds < 60) {
      return `~${seconds} seconds`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  /**
   * Calculate exchange rate
   */
  const exchangeRate = (): string => {
    const input = parseFloat(inputAmount);
    const output = parseFloat(outputAmount);
    if (!input || !output) {
      return '1.00';
    }
    return (output / input).toFixed(4);
  };

  return (
    <Box
      className="musd-conversion-summary"
      padding={4}
      style={{
        backgroundColor: 'var(--color-background-alternative)',
        borderRadius: '8px',
      }}
    >
      <Text variant={TextVariant.bodySmBold} marginBottom={3}>
        Conversion Details
      </Text>

      {isLoading ? (
        <Box padding={4}>
          <Text
            variant={TextVariant.bodySm}
            color="var(--color-text-alternative)"
            textAlign="center"
          >
            Loading quote...
          </Text>
        </Box>
      ) : (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
        >
          {/* Exchange rate */}
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
          >
            <Text
              variant={TextVariant.bodySm}
              color="var(--color-text-alternative)"
            >
              Rate
            </Text>
            <Text variant={TextVariant.bodySm}>
              1 USD = {exchangeRate()} mUSD
            </Text>
          </Box>

          {/* Estimated time */}
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
          >
            <Text
              variant={TextVariant.bodySm}
              color="var(--color-text-alternative)"
            >
              Time
            </Text>
            <Text variant={TextVariant.bodySm}>
              {formatTimeEstimate(timeEstimate)}
            </Text>
          </Box>

          {/* Fees */}
          {fees && (
            <>
              {/* Divider */}
              <Box
                marginTop={2}
                marginBottom={2}
                style={{
                  borderTop: '1px solid var(--color-border-muted)',
                }}
              />

              {/* Network fee */}
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.center}
              >
                <Text
                  variant={TextVariant.bodySm}
                  color="var(--color-text-alternative)"
                >
                  Network fee
                </Text>
                <Text variant={TextVariant.bodySm}>
                  ${formatMusdAmount(fees.gasFee)}
                </Text>
              </Box>

              {/* Relayer fee */}
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.center}
              >
                <Text
                  variant={TextVariant.bodySm}
                  color="var(--color-text-alternative)"
                >
                  Service fee
                </Text>
                <Text variant={TextVariant.bodySm}>
                  ${formatMusdAmount(fees.relayerFee)}
                </Text>
              </Box>

              {/* Total fee */}
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.center}
                marginTop={1}
              >
                <Text variant={TextVariant.bodySmBold}>Total fees</Text>
                <Text variant={TextVariant.bodySmBold}>
                  ${formatMusdAmount(fees.totalFee)}
                </Text>
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ConversionSummary;
///: END:ONLY_INCLUDE_IF
