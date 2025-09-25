import React, { SVGProps, useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useDispatch } from 'react-redux';
import { lightTheme, darkTheme } from '@metamask/design-tokens';
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
  IconColor,
} from '../../../helpers/constants/design-system';
import { useNetworkConnectionBanner } from '../../../hooks/useNetworkConnectionBanner';
import { useTheme } from '../../../hooks/useTheme';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { setEditedNetwork } from '../../../store/actions';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';

type BannerIcon =
  | {
      type: 'spinner';
      color: string;
      verticalAdjustment: string;
    }
  | {
      type: 'static';
      color: IconColor;
      name: IconName;
      verticalAdjustment: string;
    };

const Spinner = ({
  color,
  size,
  ...rest
}: {
  color: string;
  size: number;
} & SVGProps<SVGSVGElement>) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    {/* Draw an arc that covers 60% of the circle */}
    <path
      d="M 12 2 A 10 10 0 1 1 2 12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        values="0 12 12;360 12 12"
        dur="1.5s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

export const NetworkConnectionBanner = () => {
  const t = useI18nContext();
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const networkConnectionBanner = useNetworkConnectionBanner();

  const updateRpc = useCallback(() => {
    if (
      networkConnectionBanner.status === 'slow' ||
      networkConnectionBanner.status === 'unavailable'
    ) {
      // Track event
      const eventName =
        networkConnectionBanner.status === 'slow'
          ? MetaMetricsEventName.SlowRpcBannerUpdateRpcClicked
          : MetaMetricsEventName.UnavailableRpcBannerUpdateRpcClicked;
      networkConnectionBanner.trackNetworkBannerEvent(
        eventName,
        networkConnectionBanner.chainId,
      );

      // Open form to edit network
      dispatch(setEditedNetwork({ chainId: networkConnectionBanner.chainId }));
      navigate(NETWORKS_ROUTE);
    }
  }, [networkConnectionBanner, dispatch, navigate]);

  if (
    networkConnectionBanner.status === 'unknown' ||
    networkConnectionBanner.status === 'available'
  ) {
    return null;
  }

  const getBannerContent = (): {
    message: string;
    backgroundColor: BackgroundColor;
    icon: BannerIcon;
  } => {
    // Align the indicator with the text
    const verticalAdjustment = '0.2rem';

    if (networkConnectionBanner.status === 'slow') {
      const warningColor =
        theme === 'light'
          ? lightTheme.colors.warning.default
          : darkTheme.colors.warning.default;
      return {
        message: t('stillConnectingTo', [networkConnectionBanner.networkName]),
        backgroundColor: BackgroundColor.warningMuted,
        icon: {
          type: 'spinner',
          color: warningColor,
          verticalAdjustment,
        },
      };
    }

    return {
      message: t('unableToConnectTo', [networkConnectionBanner.networkName]),
      backgroundColor: BackgroundColor.errorMuted,
      icon: {
        type: 'static',
        color: IconColor.errorDefault,
        name: IconName.Danger,
        verticalAdjustment,
      },
    };
  };
  const { message, backgroundColor, icon } = getBannerContent();

  return (
    <Box width={BlockSize.Full} paddingLeft={4} paddingRight={4} paddingTop={4}>
      <BannerBase
        className="network-connection-banner"
        backgroundColor={backgroundColor}
        startAccessory={
          icon.type === 'spinner' ? (
            <Spinner
              color={icon.color}
              size={16}
              style={{ marginTop: icon.verticalAdjustment }}
              data-testid="spinner"
            />
          ) : (
            <Icon
              name={icon.name}
              size={IconSize.Sm}
              color={icon.color}
              style={{ marginTop: icon.verticalAdjustment }}
              data-testid="icon"
            />
          )
        }
        actionButtonLabel={t('updateRpc')}
        actionButtonOnClick={updateRpc}
      >
        {message}
      </BannerBase>
    </Box>
  );
};

export default NetworkConnectionBanner;
