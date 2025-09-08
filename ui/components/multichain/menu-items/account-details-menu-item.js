import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { useHistory } from 'react-router-dom';
import { setAccountDetailsAddress } from '../../../store/actions';

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
import {
  getIsMultichainAccountsState1Enabled,
  getIsMultichainAccountsState2Enabled,
} from '../../../selectors/multichain-accounts/feature-flags';
import {
  ACCOUNT_DETAILS_ROUTE,
  MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
} from '../../../helpers/constants/routes';

export const AccountDetailsMenuItem = ({
  metricsLocation,
  closeMenu,
  address,
  textProps,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const history = useHistory();
  const isMultichainAccountsState1Enabled = useSelector(
    getIsMultichainAccountsState1Enabled,
  );
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const LABEL = t('accountDetails');

  const handleNavigation = useCallback(() => {
    dispatch(setAccountDetailsAddress(address));
    trackEvent({
      event: MetaMetricsEventName.AccountDetailsOpened,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: metricsLocation,
        hd_entropy_index: hdEntropyIndex,
      },
    });
    if (isMultichainAccountsState2Enabled) {
      history.push(
        `${MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE}/${encodeURIComponent(selectedAccountGroup)}`,
      );
    } else if (isMultichainAccountsState1Enabled) {
      history.push(`${ACCOUNT_DETAILS_ROUTE}/${address}`);
    }
    closeMenu?.();
  }, [
    address,
    closeMenu,
    dispatch,
    hdEntropyIndex,
    history,
    isMultichainAccountsState1Enabled,
    isMultichainAccountsState2Enabled,
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
