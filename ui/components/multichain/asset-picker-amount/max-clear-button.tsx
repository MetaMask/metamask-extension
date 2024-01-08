import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Asset,
  getSendMaxModeState,
  toggleSendMaxMode,
} from '../../../ducks/send';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { ButtonLink } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TextVariant } from '../../../helpers/constants/design-system';
import { AssetType } from '../../../../shared/constants/transaction';

// A button that updates the send amount to max balance or 0.
export default function MaxClearButton({ asset }: { asset: Asset }) {
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

  return asset.type === AssetType.NFT ? null : (
    <ButtonLink
      onClick={onClick}
      marginLeft="auto"
      textProps={{ variant: TextVariant.bodySm }}
      data-testid="max-clear-button"
    >
      {maxModeOn ? t('clear') : t('max')}
    </ButtonLink>
  );
}
