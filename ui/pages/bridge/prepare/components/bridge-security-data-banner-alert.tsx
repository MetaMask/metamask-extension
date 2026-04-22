import React from 'react';
import { useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
  IconName,
} from '@metamask/design-system-react';
import { getToToken } from '../../../../ducks/bridge/selectors';
import { useAssetSecurityData } from '../../hooks/useAssetSecurityData';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const BridgeSecurityDataBannerAlert = () => {
  const t = useI18nContext();
  const toToken = useSelector(getToToken);
  const { assetIsMalicious, assetIsSuspicious } = useAssetSecurityData(toToken);

  if (!assetIsMalicious && !assetIsSuspicious) {
    return null;
  }

  return (
    <BannerAlert
      severity={
        assetIsMalicious
          ? BannerAlertSeverity.Danger
          : BannerAlertSeverity.Warning
      }
      closeButtonProps={{
        iconProps: {
          name: IconName.ArrowRight,
          onClick: () => console.log('hehehe'),
        },
      }}
      description={t(
        assetIsMalicious
          ? 'bridgeTokenIsMaliciousBanner'
          : 'bridgeTokenIsSuspiciousBanner',
        [toToken.symbol],
      )}
    />
  );
};
