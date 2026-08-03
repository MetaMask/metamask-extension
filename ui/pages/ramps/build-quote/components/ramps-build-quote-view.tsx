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
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import RampsTokenSelectionHeader from '../../token-selection/components/ramps-token-selection-header';
import type { RampsBuildQuoteReadyViewModel } from '../hooks/useRampsBuildQuote';
import RampsPaymentMethodPill from './ramps-payment-method-pill';
import RampsWeeklyLimitModal from './ramps-weekly-limit-modal';

export default function RampsBuildQuoteView({
  pageTitle,
  pageSubtitle,
  currencySymbol,
  amount,
  amountTextClassName,
  paymentMethodLabel,
  showPaymentMethodSpinner,
  displayedQuoteError,
  quoteErrorLink,
  providerStatusLabel,
  isQuoteLoading,
  canContinue,
  isWeeklyLimitModalOpen,
  providerSupportUrl,
  providerName,
  handleBack,
  handlePaymentMethodPress,
  handleAmountChange,
  handleContinue,
  handleCloseWeeklyLimitModal,
  handleContactProviderSupport,
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
        backButtonTestId="ramps-build-quote-back"
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

          {displayedQuoteError ? (
            <Box
              className="flex flex-wrap items-center justify-center gap-1 text-center"
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Center}
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.ErrorDefault}
                data-testid="ramps-build-quote-error"
              >
                {displayedQuoteError}
              </Text>
              {quoteErrorLink ? (
                <TextButton
                  size={TextButtonSize.BodySm}
                  onClick={quoteErrorLink.onClick}
                  data-testid="ramps-build-quote-error-link"
                >
                  {quoteErrorLink.label}
                </TextButton>
              ) : null}
            </Box>
          ) : null}

          <RampsPaymentMethodPill
            label={paymentMethodLabel}
            isLoading={showPaymentMethodSpinner}
            onClick={handlePaymentMethodPress}
          />
        </Box>

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

      <RampsWeeklyLimitModal
        isOpen={isWeeklyLimitModalOpen}
        onClose={handleCloseWeeklyLimitModal}
        providerName={providerName}
        supportUrl={providerSupportUrl}
        onContactSupport={handleContactProviderSupport}
      />
    </Box>
  );
}
