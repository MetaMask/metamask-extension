import React from 'react';
import { useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../../../components/component-library';
import { TextAlign } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import useQuotePriceImpact from '../../hooks/usePriceImpactAlert';
import { getIsQuoteExpired } from '../../../../ducks/bridge/selectors';

type PriceImpactAlertProps = {
  acknowledged: boolean | null;
  setAcknowledged: (value: boolean) => void;
};

const PriceImpactAlert = ({
  acknowledged,
  setAcknowledged,
}: PriceImpactAlertProps) => {
  const t = useI18nContext();
  const { displayPriceImpactAlert, activeQuote } = useQuotePriceImpact();

  const isQuoteExpired = useSelector(getIsQuoteExpired);

  if (!displayPriceImpactAlert || !activeQuote || isQuoteExpired) {
    return null;
  }

  return (
    <BannerAlert
      marginInline={4}
      marginBottom={3}
      title={t('priceImpactAlertTitle')}
      severity={BannerAlertSeverity.Warning}
      description={t('priceImpactAlertDescription')}
      textAlign={TextAlign.Left}
      actionButtonLabel={acknowledged ? null : t('priceImpactAlertAcknowledge')}
      actionButtonOnClick={() => {
        setAcknowledged(true);
      }}
    />
  );
};

export default PriceImpactAlert;
