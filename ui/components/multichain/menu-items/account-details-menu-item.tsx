import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setAccountDetailsAddress } from '../../../store/actions';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import { IconName, Text } from '../../component-library';
import { MenuItem } from '../../ui/menu';

type AccountDetailsMenuItemProps = {
  metricsLocation: string;
  closeMenu: () => void;
  address: string;
  textProps: object;
  isRedesign: boolean;
};

export const AccountDetailsMenuItem = ({
  metricsLocation,
  closeMenu,
  address,
  textProps,
  isRedesign = false,
}: AccountDetailsMenuItemProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);

  const LABEL = isRedesign ? t('manageWallet') : t('accountDetails');

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
      iconName={isRedesign ? IconName.ScanBarcode : IconName.ScanBarcode}
      className={isRedesign ? 'redesign-menu-item' : ''}
      data-testid="account-list-menu-details"
    >
      {textProps ? <Text {...textProps}>{LABEL}</Text> : LABEL}
    </MenuItem>
  );
};