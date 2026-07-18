import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PaymentMethod } from '@metamask/ramps-controller';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRampsController } from '../../../hooks/ramps/useRampsController';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';
import Spinner from '../../../components/ui/spinner';
import { ScrollContainer } from '../../../contexts/scroll-container';
import {
  RampsSelectionCenteredMessage,
  RampsSelectionPage,
} from '../components/ramps-selection-page';
import RampsPaymentMethodListItem from './components/ramps-payment-method-list-item';
import {
  formatPaymentMethodLimits,
  getProviderBuyLimit,
} from './utils/format-payment-method-limits';

/**
 * Ramps buy-flow payment method selection screen.
 *
 * Lists available payment methods for the selected provider/region and
 * updates controller selection before returning to build-quote.
 */
export function RampsPaymentMethodScreen() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const {
    paymentMethods,
    paymentMethodsLoading,
    paymentMethodsStatus,
    paymentMethodsError,
    selectedPaymentMethod,
    selectedProvider,
    userRegion,
    setSelectedPaymentMethod,
  } = useRampsController();
  const fiatCurrency = userRegion?.country?.currency ?? 'USD';
  const formatFiat = useFiatFormatter({ overrideCurrency: fiatCurrency });
  const [isSelecting, setIsSelecting] = useState(false);
  const isSelectingRef = useRef(false);

  // Keep cached methods visible if a background refetch fails.
  const showError = Boolean(paymentMethodsError) && paymentMethods.length === 0;

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handlePaymentMethodSelect = useCallback(
    async (paymentMethod: PaymentMethod) => {
      if (isSelectingRef.current) {
        return;
      }

      isSelectingRef.current = true;
      setIsSelecting(true);

      try {
        await setSelectedPaymentMethod(paymentMethod);
        navigate(-1);
      } catch {
        isSelectingRef.current = false;
        setIsSelecting(false);
      }
    },
    [navigate, setSelectedPaymentMethod],
  );

  const title = t('rampsSelectPaymentMethod');
  const backButtonTestId = 'ramps-payment-method-back';

  // Prerequisites missing — query stays disabled until the user leaves.
  if (paymentMethodsStatus === 'idle') {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-payment-method-empty"
        backButtonTestId={backButtonTestId}
      >
        <RampsSelectionCenteredMessage
          message={t('rampsNoPaymentMethodsAvailable')}
        />
      </RampsSelectionPage>
    );
  }

  if (paymentMethodsLoading) {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-payment-method-loading"
        backButtonTestId={backButtonTestId}
      >
        <Box
          className="flex-1"
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
        >
          <Spinner className="h-8 w-8" />
        </Box>
      </RampsSelectionPage>
    );
  }

  if (showError) {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-payment-method-error"
        backButtonTestId={backButtonTestId}
      >
        <RampsSelectionCenteredMessage
          message={t('rampsErrorLoadingPaymentMethods')}
        />
      </RampsSelectionPage>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-payment-method-empty"
        backButtonTestId={backButtonTestId}
      >
        <RampsSelectionCenteredMessage
          message={t('rampsNoPaymentMethodsAvailable')}
        />
      </RampsSelectionPage>
    );
  }

  return (
    <RampsSelectionPage
      title={title}
      onBack={handleBack}
      testId="ramps-payment-method-screen"
      backButtonTestId={backButtonTestId}
    >
      <ScrollContainer className="flex-1 overflow-y-auto px-2 pb-4">
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          {paymentMethods.map((paymentMethod) => (
            <RampsPaymentMethodListItem
              key={paymentMethod.id}
              paymentMethod={paymentMethod}
              isSelected={selectedPaymentMethod?.id === paymentMethod.id}
              isDisabled={isSelecting}
              limitText={formatPaymentMethodLimits(
                getProviderBuyLimit(
                  selectedProvider,
                  fiatCurrency,
                  paymentMethod.id,
                ),
                formatFiat,
                t,
              )}
              onClick={() => {
                handlePaymentMethodSelect(paymentMethod).catch(() => undefined);
              }}
            />
          ))}
        </Box>
      </ScrollContainer>
    </RampsSelectionPage>
  );
}

export default RampsPaymentMethodScreen;
