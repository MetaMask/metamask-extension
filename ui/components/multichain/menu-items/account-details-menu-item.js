import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { useNavigate } from 'react-router-dom-v5-compat';

import { MenuItem } from '../../ui/menu';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { IconName, Text } from '../../component-library';
import { getSelectedAccountGroup } from '../../../selectors/multichain-accounts/account-tree';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import { MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE } from '../../../helpers/constants/routes';

export const AccountDetailsMenuItem = ({
  metricsLocation,
  closeMenu,
  textProps,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const navigate = useNavigate();

  const LABEL = t('accountDetails');

  const handleNavigation = useCallback(() => {
    trackEvent({
      event: MetaMetricsEventName.AccountDetailsOpened,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: metricsLocation,
        hd_entropy_index: hdEntropyIndex,
      },
    });

    navigate(
      `${MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE}/${encodeURIComponent(selectedAccountGroup)}`,
    );

    closeMenu?.();
  }, [
    closeMenu,
    hdEntropyIndex,
    navigate,
    metricsLocation,
    selectedAccountGroup,
    trackEvent,
  ]);

  return (
    <MenuItem
      onClick={handleNavigation}
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
