import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BannerBase,
  ButtonLink,
  ButtonLinkSize,
  Icon,
  IconName,
  IconSize,
} from '../../component-library';
import {
  BackgroundColor,
  BorderRadius,
  IconColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Text } from '../../component-library/text';
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

const PrimaryMessage = ({
  t,
  primaryMessageKey,
  networkConnectionBanner,
}: {
  t: ReturnType<typeof useI18nContext>;
  primaryMessageKey: string;
  networkConnectionBanner: Exclude<
    NetworkConnectionBannerType,
    { status: 'unknown' | 'available' }
  >;
}) => {
  return (
    <Text
      variant={TextVariant.bodyXsMedium}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        paddingRight: '4px',
      }}
    >
      {t(primaryMessageKey, [networkConnectionBanner.networkName])}
    </Text>
  );
};

const SecondaryMessage = ({ content }: { content: React.ReactNode }) => {
  return (
    <Text
      variant={TextVariant.bodyXsMedium}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {content}
    </Text>
  );
};

const UpdateRpcButton = ({
  t,
  isLowerCase,
  updateRpc,
}: {
  t: ReturnType<typeof useI18nContext>;
  isLowerCase: boolean;
  updateRpc: () => void;
}) => {
  const updateRpcText = t('updateRpc');

  return (
    <ButtonLink
      key="updateRpc"
      size={ButtonLinkSize.Auto}
      variant={TextVariant.bodyXsMedium}
      onClick={updateRpc}
      paddingTop={0}
      paddingBottom={0}
      style={{ verticalAlign: 'bottom' }}
    >
      {isLowerCase
        ? updateRpcText[0].toLowerCase() + updateRpcText.slice(1)
        : updateRpcText}
    </ButtonLink>
  );
};

const getBannerContent = (
  networkConnectionBanner: Exclude<
    NetworkConnectionBannerType,
    { status: 'unknown' | 'available' }
  >,
  t: ReturnType<typeof useI18nContext>,
  updateRpc: () => void,
): {
  primaryMessage: React.ReactNode;
  secondaryMessage: React.ReactNode;
  backgroundColor: BackgroundColor;
  icon: BannerIcon;
} => {
  // Align the indicator with the text
  const verticalAdjustment = '0.25em';

  if (networkConnectionBanner.status === 'degraded') {
    const primaryMessage = (
      <PrimaryMessage
        t={t}
        primaryMessageKey="stillConnectingTo"
        networkConnectionBanner={networkConnectionBanner}
      />
    );
    const secondaryMessage = networkConnectionBanner.isInfuraEndpoint ? null : (
      <SecondaryMessage
        content={
          <UpdateRpcButton t={t} isLowerCase={false} updateRpc={updateRpc} />
        }
      />
    );

    return {
      primaryMessage,
      secondaryMessage,
      backgroundColor: BackgroundColor.backgroundSection,
      icon: {
        color: IconColor.iconDefault,
        name: IconName.Loading,
        verticalAdjustment,
        className: 'animate-spin',
      },
    };
  }

  const primaryMessage = (
    <PrimaryMessage
      t={t}
      primaryMessageKey="unableToConnectTo"
      networkConnectionBanner={networkConnectionBanner}
    />
  );
  const secondaryMessageContent = networkConnectionBanner.isInfuraEndpoint
    ? t('checkNetworkConnectivity')
    : t('checkNetworkConnectivityOr', [
        <UpdateRpcButton
          key="updateRpc"
          t={t}
          isLowerCase={true}
          updateRpc={updateRpc}
        />,
      ]);
  const secondaryMessage = (
    <SecondaryMessage content={secondaryMessageContent} />
  );

  return {
    primaryMessage,
    secondaryMessage,
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

      dispatch(
        setEditedNetwork({
          chainId: networkConnectionBanner.chainId,
          trackRpcUpdateFromBanner: true,
        }),
      );
      navigate(NETWORKS_ROUTE);
    }
  }, [networkConnectionBanner, dispatch, navigate]);

  if (
    networkConnectionBanner.status === 'degraded' ||
    networkConnectionBanner.status === 'unavailable'
  ) {
    const { primaryMessage, secondaryMessage, backgroundColor, icon } =
      getBannerContent(networkConnectionBanner, t, updateRpc);

    return (
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
        borderRadius={BorderRadius.MD}
      >
        {primaryMessage}
        {secondaryMessage}
      </BannerBase>
    );
  }

  return null;
};

export default NetworkConnectionBanner;
