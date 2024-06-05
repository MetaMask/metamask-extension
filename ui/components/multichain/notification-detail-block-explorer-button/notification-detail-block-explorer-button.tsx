import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { NetworkConfiguration } from '@metamask/network-controller';
import type { Notification } from '../../../../app/scripts/controllers/metamask-notifications/types/types';
import { getAllNetworks } from '../../../selectors';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { ButtonVariant } from '../../component-library';
import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getNetworkDetailsByChainId } from '../../../helpers/utils/notification.util';
import { NotificationDetailButton } from '../notification-detail-button';

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
  const { nativeBlockExplorerUrl } = getNetworkDetailsByChainId(
    `0x${chainId}` as keyof typeof CHAIN_IDS,
  );

  const defaultNetworks: NetworkConfiguration[] = useSelector(getAllNetworks);
  const defaultNetwork = useMemo(() => {
    return defaultNetworks.find((n) => n.chainId === chainIdHex);
  }, [defaultNetworks]);

  const blockExplorerUrl =
    defaultNetwork?.rpcPrefs?.blockExplorerUrl ?? nativeBlockExplorerUrl;

  if (!blockExplorerUrl) {
    return null;
  }

  return (
    <NotificationDetailButton
      notification={notification}
      variant={ButtonVariant.Secondary}
      text={t('notificationItemCheckBlockExplorer') || ''}
      href={`${blockExplorerUrl}/tx/${txHash}`}
      id={id}
      isExternal={true}
    />
  );
};
