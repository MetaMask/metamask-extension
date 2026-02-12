/**
 * MUSD Prepare Screen
 *
 * Screen for entering conversion amount and reviewing the conversion details.
 * Users select a payment token, enter an amount, and see the expected output.
 */

///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
  TextField,
  TextFieldType,
} from '../../../components/component-library';
import {
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
  TextVariant,
  TextAlign,
  FontWeight,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMusdConversion } from '../../../hooks/musd';
import {
  selectSelectedPaymentToken,
  selectInputAmountFiat,
  selectIsQuoteLoading,
  selectQuoteError,
  selectQuoteDetails,
  selectQuoteFees,
  selectIsReadyToConvert,
} from '../../../ducks/musd';
import { MUSD_CONVERSION_APY } from '../../../../shared/constants/musd';
import {
  formatMusdAmount,
  limitToMaximumDecimalPlaces,
} from '../../../../shared/lib/musd';
import TokenSelector from '../components/token-selector';
import ConversionSummary from '../components/conversion-summary';

/**
 * MUSD Prepare Screen Component
 */
const MusdPrepareScreen: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get conversion hook
  const {
    selectedPaymentToken,
    inputAmountFiat,
    isQuoteLoading,
    quoteError,
    isReadyToConvert,
    quoteDetails,
    quoteFees,
    setAmount,
    selectPaymentToken,
    fetchQuote,
    submitConversion,
    cancelConversion,
    validateAmount,
  } = useMusdConversion();

  // Local state for input
  const [localAmount, setLocalAmount] = useState(inputAmountFiat || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle amount input change
   */
  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;

      // Only allow numbers and one decimal point
      if (!/^\d*\.?\d*$/.test(value)) {
        return;
      }

      setLocalAmount(value);

      // Validate and update global state
      if (value && parseFloat(value) > 0) {
        const validation = validateAmount(value);
        if (validation.isValid) {
          setValidationError(null);
          setAmount(value);
        } else {
          setValidationError(validation.message || 'Invalid amount');
        }
      } else {
        setValidationError(null);
      }
    },
    [validateAmount, setAmount],
  );

  /**
   * Handle "Max" button click
   */
  const handleMaxClick = useCallback(() => {
    if (selectedPaymentToken) {
      const maxAmount = selectedPaymentToken.fiatBalance;
      setLocalAmount(limitToMaximumDecimalPlaces(maxAmount, 2));
      setAmount(maxAmount);
      setValidationError(null);
    }
  }, [selectedPaymentToken, setAmount]);

  /**
   * Handle token selection
   */
  const handleTokenSelect = useCallback(
    (token: typeof selectedPaymentToken) => {
      selectPaymentToken(token);
      // Reset amount when token changes
      setLocalAmount('');
      setValidationError(null);
    },
    [selectPaymentToken],
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    if (!isReadyToConvert || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Fetch fresh quote
      await fetchQuote();

      // Submit conversion
      await submitConversion();
    } catch (error) {
      console.error('[MUSD] Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isReadyToConvert, isSubmitting, fetchQuote, submitConversion]);

  /**
   * Handle back button
   */
  const handleBack = useCallback(() => {
    cancelConversion();
  }, [cancelConversion]);

  /**
   * Auto-fetch quote when amount or token changes
   */
  useEffect(() => {
    if (selectedPaymentToken && inputAmountFiat && !validationError) {
      const debounceTimer = setTimeout(() => {
        fetchQuote();
      }, 500);

      return () => clearTimeout(debounceTimer);
    }
  }, [selectedPaymentToken, inputAmountFiat, validationError, fetchQuote]);

  // Calculate expected output
  const expectedOutput = inputAmountFiat
    ? formatMusdAmount(
        (
          parseFloat(inputAmountFiat) *
          (1 + MUSD_CONVERSION_APY / 100)
        ).toString(),
        2,
      )
    : '0';

  return (
    <Box
      className="musd-prepare-screen"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      height={BlockSize.Full}
      padding={4}
    >
      {/* Header */}
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        marginBottom={4}
      >
        <Button
          variant={ButtonVariant.Link}
          size={ButtonSize.Sm}
          onClick={handleBack}
          data-testid="musd-prepare-back-button"
        >
          ← Back
        </Button>
        <Text
          variant={TextVariant.headingMd}
          fontWeight={FontWeight.Bold}
          textAlign={TextAlign.Center}
          style={{ flex: 1 }}
        >
          Convert to mUSD
        </Text>
        <Box style={{ width: '48px' }} /> {/* Spacer for centering */}
      </Box>

      {/* Main content */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
        style={{ flex: 1 }}
      >
        {/* Token selector */}
        <TokenSelector
          selectedToken={selectedPaymentToken}
          onSelect={handleTokenSelect}
        />

        {/* Amount input */}
        <Box>
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginBottom={2}
          >
            <Text variant={TextVariant.bodySmBold}>Amount</Text>
            {selectedPaymentToken && (
              <Text
                variant={TextVariant.bodySm}
                color="var(--color-text-alternative)"
              >
                Balance: ${formatMusdAmount(selectedPaymentToken.fiatBalance)}
              </Text>
            )}
          </Box>

          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            <Box style={{ flex: 1 }}>
              <TextField
                type={TextFieldType.Text}
                value={localAmount}
                onChange={handleAmountChange}
                placeholder="0.00"
                startAccessory={
                  <Text
                    variant={TextVariant.bodyMd}
                    color="var(--color-text-alternative)"
                  >
                    $
                  </Text>
                }
                error={Boolean(validationError)}
                disabled={!selectedPaymentToken}
                data-testid="musd-amount-input"
              />
            </Box>
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Sm}
              onClick={handleMaxClick}
              disabled={!selectedPaymentToken}
              data-testid="musd-max-button"
            >
              Max
            </Button>
          </Box>

          {validationError && (
            <Text
              variant={TextVariant.bodyXs}
              color="var(--color-error-default)"
              marginTop={1}
            >
              {validationError}
            </Text>
          )}
        </Box>

        {/* Expected output */}
        <Box
          padding={4}
          style={{
            backgroundColor: 'var(--color-background-alternative)',
            borderRadius: '8px',
          }}
        >
          <Text
            variant={TextVariant.bodySm}
            color="var(--color-text-alternative)"
            marginBottom={1}
          >
            You will receive
          </Text>
          <Box display={Display.Flex} alignItems={AlignItems.baseline} gap={2}>
            <Text variant={TextVariant.headingLg} fontWeight={FontWeight.Bold}>
              {expectedOutput}
            </Text>
            <Text variant={TextVariant.bodyMd}>mUSD</Text>
          </Box>
          <Text
            variant={TextVariant.bodyXs}
            color="var(--color-success-default)"
            marginTop={1}
          >
            Includes {MUSD_CONVERSION_APY}% APY bonus
          </Text>
        </Box>

        {/* Conversion summary */}
        {quoteDetails && quoteFees && (
          <ConversionSummary
            inputAmount={inputAmountFiat}
            outputAmount={expectedOutput}
            fees={quoteFees}
            timeEstimate={quoteDetails.timeEstimate}
            isLoading={isQuoteLoading}
          />
        )}

        {/* Quote error */}
        {quoteError && (
          <Box
            padding={3}
            style={{
              backgroundColor: 'var(--color-error-muted)',
              borderRadius: '8px',
            }}
          >
            <Text
              variant={TextVariant.bodySm}
              color="var(--color-error-default)"
            >
              {quoteError}
            </Text>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={4}>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={handleSubmit}
          disabled={!isReadyToConvert || isSubmitting || isQuoteLoading}
          block
          data-testid="musd-convert-button"
        >
          {isSubmitting || isQuoteLoading ? 'Loading...' : 'Convert'}
        </Button>
      </Box>
    </Box>
  );
};

export default MusdPrepareScreen;
///: END:ONLY_INCLUDE_IF
