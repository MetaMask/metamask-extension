import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { showModal } from '../../../store/actions';
import { DEVELOPER_OPTIONS_ITEMS } from '../search-config';

export const AutoResetAccountItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);

  const handleClearActivity = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.AccountReset,
      properties: {},
    });
    dispatch(showModal({ name: 'CONFIRM_RESET_ACCOUNT' }));
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={1}
      paddingVertical={3}
      data-testid="developer-options-auto-reset-account"
    >
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        {t(DEVELOPER_OPTIONS_ITEMS['auto-reset-account'])}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('clearActivityDescription')}
      </Text>
      <Box paddingTop={2}>
        <Button
          variant={ButtonVariant.Primary}
          onClick={handleClearActivity}
          data-testid="developer-options-auto-reset-account-button"
        >
          {t('clearActivityButton')}
        </Button>
      </Box>
    </Box>
  );
};
