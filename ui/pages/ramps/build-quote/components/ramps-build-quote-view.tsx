import React, { useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontFamily,
  Input,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  AMOUNT_INPUT_TRANSITION_CLASS_NAME,
  getAmountInputTextStyle,
} from '../../../../helpers/utils/amount-input-font-size';
import { useAmountInputFontSize } from '../../../../hooks/useAmountInputFontSize';
import RampsTokenSelectionHeader from '../../token-selection/components/ramps-token-selection-header';
import RampsProviderSelectionModal from '../../provider-selection';
import type { RampsBuildQuoteReadyViewModel } from '../hooks/useRampsBuildQuote';
import { parseFiatAmount } from '../utils/build-quote';
import RampsPaymentMethodPill from './ramps-payment-method-pill';

export default function RampsBuildQuoteView({
  pageTitle,
  pageSubtitle,
  currencySymbol,
  amount,
  hasAmountError,
  paymentMethodLabel,
  showPaymentMethodSpinner,
  displayedQuoteError,
  isQuoteUnavailableError,
  providerStatusLabel,
  isQuoteLoading,
  canContinue,
  handleBack,
  handlePaymentMethodPress,
  handleAmountChange,
  handleContinue,
}: RampsBuildQuoteReadyViewModel) {
  const t = useI18nContext();
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const amountTextColor = hasAmountError
    ? TextColor.ErrorDefault
    : TextColor.TextDefault;
  const { containerRef: amountContainerRef, fontSize: amountFontSize } =
    useAmountInputFontSize(`${currencySymbol}${amount || '0'}`);
  const amountStyle = getAmountInputTextStyle(amountFontSize);

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
          ref={amountContainerRef}
          className="flex flex-1 flex-col items-center justify-center gap-4"
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
        >
          {/* Fixed at the largest step so the pill stays put as the amount shrinks. */}
          <Box
            className="flex h-[88px] max-w-full items-center justify-center"
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            data-testid="ramps-build-quote-amount-row"
          >
            <Text
              variant={TextVariant.AmountDisplayLg}
              fontFamily={FontFamily.Hero}
              color={amountTextColor}
              className={AMOUNT_INPUT_TRANSITION_CLASS_NAME}
              style={amountStyle}
            >
              {currencySymbol}
            </Text>
            {/* The hidden amount sets an exact cross-browser input width. */}
            <span className="relative w-max min-w-[1ch]">
              <Text
                aria-hidden="true"
                variant={TextVariant.AmountDisplayLg}
                fontFamily={FontFamily.Hero}
                className={`invisible block min-w-[1ch] whitespace-pre ${AMOUNT_INPUT_TRANSITION_CLASS_NAME}`}
                style={amountStyle}
              >
                {amount || '0'}
              </Text>
              <Input
                aria-label={t('amount')}
                textVariant={TextVariant.AmountDisplayLg}
                isStateStylesDisabled
                className={`absolute inset-0 min-w-[1ch] max-w-full rounded-none border-0 bg-transparent p-0 text-left font-hero ${amountTextColor} ${AMOUNT_INPUT_TRANSITION_CLASS_NAME}`}
                style={amountStyle}
                data-testid="ramps-build-quote-amount-input"
                inputMode="decimal"
                onChange={handleAmountChange}
                type="text"
                value={amount}
              />
            </span>
          </Box>

          {displayedQuoteError ? (
            <Box
              className="flex flex-col items-center"
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Center}
              gap={1}
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.ErrorDefault}
                className="text-center"
                data-testid="ramps-build-quote-error"
              >
                {displayedQuoteError}
              </Text>
              <TextButton
                size={TextButtonSize.BodySm}
                onClick={() => setIsProviderModalOpen(true)}
                data-testid="ramps-build-quote-change-provider"
              >
                {isQuoteUnavailableError
                  ? t('rampsChangeProviders')
                  : t('rampsChangeProvider')}
              </TextButton>
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

      {isProviderModalOpen ? (
        <RampsProviderSelectionModal
          isOpen
          onClose={() => setIsProviderModalOpen(false)}
          amount={parseFiatAmount(amount)}
        />
      ) : null}
    </Box>
  );
}
