import React from 'react';
import { useSelector } from 'react-redux';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { toHex } from '@metamask/controller-utils';
import { getNetworkConfigurationsByChainId } from '../../../selectors';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { ButtonVariant } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getNetworkDetailsByChainId } from '../../../helpers/utils/notification.util';
import { NotificationDetailButton } from '../notification-detail-button';

type Notification = NotificationServicesController.Types.INotification;

type NotificationDetailBlockExplorerButtonProps = {
  notification: Notification;
  chainId: number;
  txHash: string;
  id: string;
};

export const NotificationDetailBlockExplorerButton = ({
  notification,
  chainId,
  txHash,
  id,
}: NotificationDetailBlockExplorerButtonProps) => {
  const t = useI18nContext();

  const chainIdHex = toHex(chainId);
  const { blockExplorerConfig } = getNetworkDetailsByChainId(
    chainIdHex as keyof typeof CHAIN_IDS,
  );

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const networkConfiguration = networkConfigurations[chainIdHex];
  const configuredBlockExplorer =
    networkConfiguration?.blockExplorerUrls?.[
      networkConfiguration.defaultBlockExplorerUrlIndex ?? -1
    ];

  const blockExplorerUrl = configuredBlockExplorer ?? blockExplorerConfig?.url;

  const getBlockExplorerButtonText = () => {
    if (configuredBlockExplorer) {
      return t('notificationItemCheckBlockExplorer');
    }
    if (blockExplorerConfig?.name) {
      return t('notificationTransactionSuccessView', [
        blockExplorerConfig.name,
      ]);
    }
    return t('notificationItemCheckBlockExplorer');
  };

  const blockExplorerButtonText = getBlockExplorerButtonText();

  if (!blockExplorerUrl) {
    return null;
  }

  return (
    <NotificationDetailButton
      notification={notification}
      variant={ButtonVariant.Secondary}
      text={blockExplorerButtonText}
      href={`${blockExplorerUrl}/tx/${txHash}`}
      id={id}
      isExternal={true}
    />
  );
};