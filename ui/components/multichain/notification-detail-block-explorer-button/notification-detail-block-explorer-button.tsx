import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Notification } from '../../../../app/scripts/controllers/metamask-notifications/types/types';
import type { NetworkConfiguration } from '@metamask/network-controller';
import { getAllNetworks } from '../../../selectors';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { ButtonVariant } from '../../component-library';
import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getNetworkDetailsByChainId } from '../../../helpers/utils/notification.util';
import { NotificationDetailButton } from '../notification-detail-button';

type NotificationDetailBlockExplorerButtonProps = {
  notification: Notification;
  chain_id: number;
  tx_hash: string;
  id: string;
};

export const NotificationDetailBlockExplorerButton = ({
  notification,
  chain_id,
  tx_hash,
  id,
}: NotificationDetailBlockExplorerButtonProps) => {
  const t = useI18nContext();

  const chainId = decimalToHex(chain_id);
  const { nativeBlockExplorerUrl } = getNetworkDetailsByChainId(
    `0x${chainId}` as keyof typeof CHAIN_IDS,
  );

  const defaultNetworks: NetworkConfiguration[] = useSelector(getAllNetworks);
  const defaultNetwork = useMemo(() => {
    return defaultNetworks.find((n) => n.chainId === chainId);
  }, [defaultNetworks]);

  const blockExplorerUrl =
    defaultNetwork?.rpcPrefs?.blockExplorerUrl ??
    defaultNetwork?.rpcUrl ??
    nativeBlockExplorerUrl;

  if (!blockExplorerUrl) {
    return null;
  }

  return (
    <NotificationDetailButton
      notification={notification}
      variant={ButtonVariant.Secondary}
      text={t('notificationItemCheckBlockExplorer') || ''}
      href={`${blockExplorerUrl}/tx/${tx_hash}`}
      id={id}
    />
  );
};
