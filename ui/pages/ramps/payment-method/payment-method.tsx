import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PaymentMethod } from '@metamask/ramps-controller';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRampsController } from '../../../hooks/ramps/useRampsController';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';
import LoadingScreen from '../../../components/ui/loading-screen';
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
    paymentMethodsStatus,
    paymentMethodsError,
    selectedPaymentMethod,
    selectedProvider,
    userRegion,
    setSelectedPaymentMethod,
  } = useRampsController();
  const fiatCurrency = userRegion?.country?.currency ?? 'USD';
  const formatFiat = useFiatFormatter({ overrideCurrency: fiatCurrency });

  const isLoading =
    paymentMethodsStatus === 'loading' && paymentMethods.length === 0;

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handlePaymentMethodSelect = useCallback(
    async (paymentMethod: PaymentMethod) => {
      await setSelectedPaymentMethod(paymentMethod);
      navigate(-1);
    },
    [navigate, setSelectedPaymentMethod],
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  const title = t('rampsSelectPaymentMethod');

  if (paymentMethodsError) {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-payment-method-error"
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
    >
      <ScrollContainer className="flex-1 overflow-y-auto px-2 pb-4">
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          {paymentMethods.map((paymentMethod) => (
            <RampsPaymentMethodListItem
              key={paymentMethod.id}
              paymentMethod={paymentMethod}
              isSelected={selectedPaymentMethod?.id === paymentMethod.id}
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
                handlePaymentMethodSelect(paymentMethod);
              }}
            />
          ))}
        </Box>
      </ScrollContainer>
    </RampsSelectionPage>
  );
}

export default RampsPaymentMethodScreen;
