import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getHasDismissedOpenSeaToBlockaidBanner,
  getHasMigratedFromOpenSeaToBlockaid,
  getIsNetworkSupportedByBlockaid,
} from '../../../../selectors';
import { dismissOpenSeaToBlockaidBanner } from '../../../../store/actions';

export const BlockaidUnavailableBannerAlert = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();

  const hasMigratedFromOpenSeaToBlockaid = useSelector(
    getHasMigratedFromOpenSeaToBlockaid,
  );
  const isNetworkSupportedByBlockaid = useSelector(
    getIsNetworkSupportedByBlockaid,
  );
  const hasDismissedOpenSeaToBlockaidBanner = useSelector(
    getHasDismissedOpenSeaToBlockaidBanner,
  );

  const showOpenSeaToBlockaidBannerAlert =
    hasMigratedFromOpenSeaToBlockaid &&
    !isNetworkSupportedByBlockaid &&
    !hasDismissedOpenSeaToBlockaidBanner;

  const handleCloseOpenSeaToBlockaidBannerAlert = () => {
    dispatch(dismissOpenSeaToBlockaidBanner());
  };

  return showOpenSeaToBlockaidBannerAlert ? (
    <BannerAlert
      severity={BannerAlertSeverity.Info}
      title={t('openSeaToBlockaidTitle')}
      description={t('openSeaToBlockaidDescription')}
      actionButtonLabel={t('openSeaToBlockaidBtnLabel')}
      actionButtonProps={{
        href: 'https://snaps.metamask.io/transaction-insights',
        externalLink: true,
      }}
      margin={4}
      onClose={handleCloseOpenSeaToBlockaidBannerAlert}
    />
  ) : null;
};
