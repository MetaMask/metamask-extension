import React, { useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { toHex } from '@metamask/controller-utils';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { ButtonVariant } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getNetworkDetailsByChainId } from '../../../helpers/utils/notification.util';
import { NotificationDetailButton } from '../notification-detail-button';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

type Notification = NotificationServicesController.Types.INotification;

type NotificationDetailBlockExplorerButtonProps = {
  notification: Notification;
  chainId: number;
  txHash: string;
};

export const NotificationDetailBlockExplorerButton = ({
  notification,
  chainId,
  txHash,
}: NotificationDetailBlockExplorerButtonProps) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const chainIdHex = toHex(chainId);
  const { blockExplorerConfig } = getNetworkDetailsByChainId(chainId);

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const networkConfiguration = networkConfigurations[chainIdHex];
  const configuredBlockExplorer =
    networkConfiguration?.blockExplorerUrls?.[
      networkConfiguration.defaultBlockExplorerUrlIndex ?? -1
    ];

  const blockExplorerUrl = configuredBlockExplorer ?? blockExplorerConfig?.url;
  const blockExplorerButtonText = useMemo(() => {
    if (configuredBlockExplorer) {
      return t('notificationItemCheckBlockExplorer');
    }
    if (blockExplorerConfig?.name) {
      return t('notificationTransactionSuccessView', [
        blockExplorerConfig.name,
      ]);
    }
    return t('notificationItemCheckBlockExplorer');
  }, [blockExplorerConfig?.name, configuredBlockExplorer, t]);

  const analyticsEvent = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.NotificationDetailClicked,
      properties: {
        notification_id: notification.id,
        notification_type: notification.type,
        chain_id: chainId,
        clicked_item: 'block_explorer',
      },
    });
  }, [chainId, notification.id, notification.type, trackEvent]);

  if (!blockExplorerUrl) {
    return null;
  }

  return (
    <NotificationDetailButton
      variant={ButtonVariant.Secondary}
      text={blockExplorerButtonText}
      href={`${blockExplorerUrl}/tx/${txHash}`}
      isExternal={true}
      onClick={analyticsEvent}
    />
  );
};
