import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSendMaxModeState, toggleSendMaxMode } from '../../../ducks/send';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { Button, ButtonSize, ButtonVariant } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

// A button that updates the send amount to max balance or 0.
// Modified from ui/pages/send/send-content/send-amount-row/amount-max-button/amount-max-button.js
export default function MaxClearButton() {
  const t = useI18nContext();
  const maxModeOn = useSelector(getSendMaxModeState);
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const onClick = () => {
    trackEvent({
      event: 'Clicked "Amount Max"',
      category: MetaMetricsEventCategory.Transactions,
      properties: {
        action: 'Edit Screen',
        legacy_event: true,
      },
    });
    dispatch(toggleSendMaxMode());
  };

  return (
    <>
      <Button
        variant={ButtonVariant.Link}
        size={ButtonSize.Sm}
        onClick={onClick}
        marginLeft="auto"
      >
        {maxModeOn ? t('clear') : t('max')}
      </Button>
    </>
  );
}
