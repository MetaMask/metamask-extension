import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import RampsTokenSelectionHeader from '../../token-selection/components/ramps-token-selection-header';
import type { RampsBuildQuoteReadyViewModel } from '../hooks/useRampsBuildQuote';
import RampsPaymentMethodPill from './ramps-payment-method-pill';

export default function RampsBuildQuoteView({
  pageTitle,
  pageSubtitle,
  currencySymbol,
  amount,
  amountTextClassName,
  paymentMethodLabel,
  showPaymentMethodSpinner,
  displayedQuoteError,
  providerStatusLabel,
  isQuoteLoading,
  canContinue,
  handleBack,
  handleAmountChange,
  handleContinue,
}: RampsBuildQuoteReadyViewModel) {
  const t = useI18nContext();

  return (
    <Box
      className="flex h-full flex-col bg-background-default"
      flexDirection={BoxFlexDirection.Column}
      data-testid="ramps-build-quote-screen"
    >
      <RampsTokenSelectionHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        onBack={handleBack}
      />

      <Box
        className="flex flex-1 flex-col px-4"
        flexDirection={BoxFlexDirection.Column}
        justifyContent={BoxJustifyContent.Between}
      >
        <Box
          className="flex flex-1 flex-col items-center justify-center gap-4"
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
        >
          <Box
            className="flex items-baseline justify-center"
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
          >
            <span className={amountTextClassName}>{currencySymbol}</span>
            <input
              aria-label={t('amount')}
              className={`min-w-[1ch] max-w-full border-0 bg-transparent p-0 text-left outline-none ${amountTextClassName}`}
              data-testid="ramps-build-quote-amount-input"
              inputMode="decimal"
              onChange={handleAmountChange}
              size={Math.max(amount.length, 1)}
              type="text"
              value={amount}
            />
          </Box>

          <RampsPaymentMethodPill
            label={paymentMethodLabel}
            isLoading={showPaymentMethodSpinner}
          />
        </Box>

        {displayedQuoteError ? (
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.ErrorDefault}
            className="mb-4 text-center"
            data-testid="ramps-build-quote-error"
          >
            {displayedQuoteError}
          </Text>
        ) : null}

        <Box
          className="pb-4"
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          gap={3}
        >
          {providerStatusLabel ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              data-testid="ramps-build-quote-provider-label"
            >
              {providerStatusLabel}
            </Text>
          ) : null}

          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={handleContinue}
            isDisabled={!canContinue}
            isLoading={isQuoteLoading}
            data-testid="ramps-build-quote-continue"
          >
            {t('continue')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
