import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import { setAccountDetailsAddress } from '../../../store/actions';
import { IconName, Text } from '../../component-library';
import { MenuItem } from '../../ui/menu';

export const AccountDetailsMenuItem = ({
  metricsLocation,
  closeMenu,
  address,
  textProps,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);

  const LABEL = t('accountDetails');

  return (
    <MenuItem
      onClick={() => {
        dispatch(setAccountDetailsAddress(address));
        trackEvent({
          event: MetaMetricsEventName.AccountDetailsOpened,
          category: MetaMetricsEventCategory.Navigation,
          properties: {
            location: metricsLocation,
            hd_entropy_index: hdEntropyIndex,
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
  /**
   * Represents the "location" property of the metrics event
   */
  metricsLocation: PropTypes.string.isRequired,
  /**
   * Closes the menu
   */
  closeMenu: PropTypes.func,
  /**
   * Address to show account details for
   */
  address: PropTypes.string.isRequired,
  /**
   * Custom properties for the menu item text
   */
  textProps: PropTypes.object,
};
