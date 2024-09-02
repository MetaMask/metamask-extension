import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { NetworkConfiguration } from '@metamask/network-controller';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { getAllNetworks } from '../../../selectors';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { ButtonVariant } from '../../component-library';
import { decimalToHex } from '../../../../shared/modules/conversion.utils';
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

  const chainIdHex = decimalToHex(chainId);
  const { blockExplorerConfig } = getNetworkDetailsByChainId(
    `0x${chainIdHex}` as keyof typeof CHAIN_IDS,
  );

  const defaultNetworks: NetworkConfiguration[] = useSelector(getAllNetworks);
  const defaultNetwork = useMemo(() => {
    return defaultNetworks.find((n) => n.chainId === chainIdHex);
  }, [defaultNetworks]);

  const blockExplorerUrl =
    defaultNetwork?.rpcPrefs?.blockExplorerUrl ?? blockExplorerConfig?.url;

  const getBlockExplorerButtonText = () => {
    if (defaultNetwork?.rpcPrefs?.blockExplorerUrl) {
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
