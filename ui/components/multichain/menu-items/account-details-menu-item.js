import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { setAccountDetailsAccountId } from '../../../store/actions';

import { MenuItem } from '../../ui/menu';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { IconName, Text } from '../../component-library';

export const AccountDetailsMenuItem = ({
  metricsLocation,
  closeMenu,
  accountId,
  textProps,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const LABEL = t('accountDetails');

  return (
    <MenuItem
      onClick={() => {
        dispatch(setAccountDetailsAccountId(accountId));
        trackEvent({
          event: MetaMetricsEventName.NavAccountDetailsOpened,
          category: MetaMetricsEventCategory.Navigation,
          properties: {
            location: metricsLocation,
          },
        });
        closeMenu?.();
      }}
      iconName={IconName.ScanBarcode}
      data-testid="account-list-menu-details"
    >
      {textProps ? <Text {...textProps}>{LABEL}</Text> : LABEL}
    </MenuItem>
  );
};

AccountDetailsMenuItem.propTypes = {
  metricsLocation: PropTypes.string.isRequired,
  closeMenu: PropTypes.func,
  accountId: PropTypes.string.isRequired,
  textProps: PropTypes.object,
};
