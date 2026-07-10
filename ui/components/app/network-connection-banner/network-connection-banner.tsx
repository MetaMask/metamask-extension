import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { FailedNetwork } from '@metamask/network-connection-banner-controller';
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

type BannerIcon = {
  color: IconColor;
  name: IconName;
  verticalAdjustment: string;
  className?: string;
};

const PrimaryMessage = ({
  t,
  primaryMessageKey,
  network,
}: {
  t: ReturnType<typeof useI18nContext>;
  primaryMessageKey: string;
  network: FailedNetwork;
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
      {t(primaryMessageKey, [network.name])}
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

const SwitchToInfuraButton = ({
  t,
  isLowerCase,
  switchToInfura,
}: {
  t: ReturnType<typeof useI18nContext>;
  isLowerCase: boolean;
  switchToInfura: () => Promise<void>;
}) => {
  const switchToInfuraText = t('switchToMetaMaskDefaultRpc');

  return (
    <ButtonLink
      key="switchToInfura"
      size={ButtonLinkSize.Auto}
      variant={TextVariant.bodyXsMedium}
      onClick={switchToInfura}
      paddingTop={0}
      paddingBottom={0}
      style={{ verticalAlign: 'bottom' }}
    >
      {isLowerCase
        ? switchToInfuraText[0].toLowerCase() + switchToInfuraText.slice(1)
        : switchToInfuraText}
    </ButtonLink>
  );
};

const getBannerContent = (
  status: 'degraded' | 'unavailable',
  network: FailedNetwork,
  t: ReturnType<typeof useI18nContext>,
  updateRpc: () => void,
  switchToInfura: () => Promise<void>,
): {
  primaryMessage: React.ReactNode;
  secondaryMessage: React.ReactNode;
  backgroundColor: BackgroundColor;
  icon: BannerIcon;
} => {
  // Align the indicator with the text
  const verticalAdjustment = '0.25em';

  // Check if we have an Infura endpoint available to switch to
  const hasInfuraEndpoint = network.switchableInfuraNetworkClientId !== null;

  if (status === 'degraded') {
    const primaryMessage = (
      <PrimaryMessage
        t={t}
        primaryMessageKey="stillConnectingTo"
        network={network}
      />
    );

    let secondaryMessage: React.ReactNode = null;
    if (!network.isInfuraEndpoint) {
      // For custom endpoints, show either "Switch to MetaMask default RPC" or "Update RPC"
      const buttonContent = hasInfuraEndpoint ? (
        <SwitchToInfuraButton
          t={t}
          isLowerCase={false}
          switchToInfura={switchToInfura}
        />
      ) : (
        <UpdateRpcButton t={t} isLowerCase={false} updateRpc={updateRpc} />
      );
      secondaryMessage = <SecondaryMessage content={buttonContent} />;
    }

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
      network={network}
    />
  );

  let secondaryMessageContent: React.ReactNode;
  if (network.isInfuraEndpoint) {
    // Already on Infura, just show connectivity message
    secondaryMessageContent = t('checkNetworkConnectivity');
  } else if (hasInfuraEndpoint) {
    // Has Infura endpoint available, show "Switch to MetaMask default RPC"
    secondaryMessageContent = t('checkNetworkConnectivityOr', [
      <SwitchToInfuraButton
        key="switchToInfura"
        t={t}
        isLowerCase={true}
        switchToInfura={switchToInfura}
      />,
    ]);
  } else {
    // No Infura endpoint available, show "Update RPC"
    secondaryMessageContent = t('checkNetworkConnectivityOr', [
      <UpdateRpcButton
        key="updateRpc"
        t={t}
        isLowerCase={true}
        updateRpc={updateRpc}
      />,
    ]);
  }

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
  const { status, network, trackNetworkBannerEvent, switchToInfura } =
    useNetworkConnectionBanner();

  const updateRpc = useCallback(() => {
    if ((status === 'degraded' || status === 'unavailable') && network) {
      trackNetworkBannerEvent({
        bannerType: status,
        eventName: MetaMetricsEventName.NetworkConnectionBannerUpdateRpcClicked,
      });

      dispatch(
        setEditedNetwork({
          chainId: network.chainId,
          trackRpcUpdateFromBanner: true,
        }),
      );
      navigate(NETWORKS_ROUTE);
    }
  }, [status, network, trackNetworkBannerEvent, dispatch, navigate]);

  const handleSwitchToInfura = useCallback(async () => {
    if (status === 'degraded' || status === 'unavailable') {
      trackNetworkBannerEvent({
        bannerType: status,
        eventName:
          MetaMetricsEventName.NetworkConnectionBannerSwitchToMetaMaskDefaultRpcClicked,
      });

      await switchToInfura();
    }
  }, [status, trackNetworkBannerEvent, switchToInfura]);

  if ((status === 'degraded' || status === 'unavailable') && network) {
    const { primaryMessage, secondaryMessage, backgroundColor, icon } =
      getBannerContent(status, network, t, updateRpc, handleSwitchToInfura);

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
