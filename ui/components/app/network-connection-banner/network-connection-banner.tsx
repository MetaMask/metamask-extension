import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BannerBase,
  Box,
  Icon,
  IconName,
  IconSize,
} from '../../component-library';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  IconColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useNetworkConnectionBanner } from '../../../hooks/useNetworkConnectionBanner';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { setEditedNetwork } from '../../../store/actions';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { NetworkConnectionBanner as NetworkConnectionBannerType } from '../../../../shared/constants/app-state';

type BannerIcon = {
  color: IconColor;
  name: IconName;
  verticalAdjustment: string;
  className?: string;
};

const getBannerContent = (
  networkConnectionBanner: Exclude<
    NetworkConnectionBannerType,
    { status: 'unknown' | 'available' }
  >,
  t: ReturnType<typeof useI18nContext>,
): {
  message: string;
  backgroundColor: BackgroundColor;
  icon: BannerIcon;
} => {
  // Align the indicator with the text
  const verticalAdjustment = '0.25em';

  if (networkConnectionBanner.status === 'degraded') {
    return {
      message: t('stillConnectingTo', [networkConnectionBanner.networkName]),
      backgroundColor: BackgroundColor.backgroundSection,
      icon: {
        color: IconColor.iconDefault,
        name: IconName.Loading,
        verticalAdjustment,
        className: 'animate-spin',
      },
    };
  }

  return {
    message: t('unableToConnectTo', [networkConnectionBanner.networkName]),
    backgroundColor: BackgroundColor.errorMuted,
    icon: {
      color: IconColor.errorDefault,
      name: IconName.Danger,
      verticalAdjustment,
    },
  };
};

export const NetworkConnectionBanner = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const networkConnectionBanner = useNetworkConnectionBanner();

  const updateRpc = useCallback(() => {
    if (
      networkConnectionBanner.status === 'degraded' ||
      networkConnectionBanner.status === 'unavailable'
    ) {
      networkConnectionBanner.trackNetworkBannerEvent({
        bannerType: networkConnectionBanner.status,
        eventName: MetaMetricsEventName.NetworkConnectionBannerUpdateRpcClicked,
        networkClientId: networkConnectionBanner.networkClientId,
      });

      dispatch(setEditedNetwork({ chainId: networkConnectionBanner.chainId }));
      navigate(NETWORKS_ROUTE);
    }
  }, [networkConnectionBanner, dispatch, navigate]);

  if (
    networkConnectionBanner.status === 'degraded' ||
    networkConnectionBanner.status === 'unavailable'
  ) {
    const { message, backgroundColor, icon } = getBannerContent(
      networkConnectionBanner,
      t,
    );

    return (
      <Box
        width={BlockSize.Full}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
      >
        <BannerBase
          className="network-connection-banner"
          backgroundColor={backgroundColor}
          startAccessory={
            <Icon
              name={icon.name}
              size={IconSize.Sm}
              color={icon.color}
              className={icon.className}
              style={{ marginTop: icon.verticalAdjustment }}
              data-testid="icon"
            />
          }
          actionButtonLabel={t('updateRpc')}
          actionButtonOnClick={updateRpc}
          borderRadius={BorderRadius.MD}
          childrenWrapperProps={{
            variant: TextVariant.bodyXsMedium,
            style: {
              display: 'inline-block',
              verticalAlign: 'middle',
              paddingRight: '8px',
            },
          }}
          actionButtonProps={{
            variant: TextVariant.bodyXsMedium,
          }}
        >
          {message}
        </BannerBase>
      </Box>
    );
  }

  return null;
};

export default NetworkConnectionBanner;
