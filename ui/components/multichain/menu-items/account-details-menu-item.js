import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { IconName } from '@metamask/design-system-react';
import { MenuItem } from '../../ui/menu';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { Text } from '../../component-library';
import { getSelectedAccountGroup } from '../../../selectors/multichain-accounts/account-tree';
import { getHDEntropyIndex } from '../../../selectors';
import { MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE } from '../../../helpers/constants/routes';

export const AccountDetailsMenuItem = ({
  metricsLocation,
  closeMenu,
  textProps,
}) => {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const accountGroupId = useSelector(getSelectedAccountGroup);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const navigate = useNavigate();

  const LABEL = t('accountDetails');

  const handleNavigation = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.AccountDetailsOpened)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location: metricsLocation,
          hd_entropy_index: hdEntropyIndex,
        })
        .build(),
    );

    navigate({
      pathname: MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
      search: createSearchParams({
        accountGroupId,
      }).toString(),
    });

    closeMenu?.();
  }, [
    closeMenu,
    hdEntropyIndex,
    navigate,
    metricsLocation,
    accountGroupId,
    trackEvent,
    createEventBuilder,
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
