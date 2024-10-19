import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { NotificationServicesController } from '@metamask/notification-services-controller'; } from '@metamask/notification-services-controller';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { NotificationListItemSnap } from '../../../../components/multichain';
import { getSnapsMetadata } from '../../../../selectors';
import { getSnapRoute, getSnapName } from '../../../../helpers/utils/util';
import { useMarkNotificationAsRead } from '../../../../hooks/metamask-notifications/useNotifications';

type SnapComponentProps = {
  snapNotification: NotificationServicesController.Types.INotification;
};

export const SnapComponent = ({ snapNotification }: SnapComponentProps) => {
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const { markNotificationAsRead } = useMarkNotificationAsRead();

  const snapsMetadata = useSelector(getSnapsMetadata);

  const snapsNameGetter = getSnapName(snapsMetadata);

  const handleSnapClick = () => {
    markNotificationAsRead([
      {
        id: snapNotification.id,
        type: snapNotification.type,
        isRead: snapNotification.isRead,
      },
    ]);
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.NotificationClicked,
      properties: {
        notification_id: snapNotification.id,
        notification_type: snapNotification.type,
        previously_read: snapNotification.isRead,
      },
    });
  };

  const handleSnapButton = () => {
    markNotificationAsRead([
      {
        id: snapNotification.id,
        type: snapNotification.type,
        isRead: snapNotification.isRead,
      },
    ]);
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.NotificationClicked,
      properties: {
        notification_id: snapNotification.id,
        notification_type: snapNotification.type,
        previously_read: snapNotification.isRead,
      },
    });
    history.push(getSnapRoute(snapNotification.data.origin));
  };

  return (
    <NotificationListItemSnap
      id={snapNotification.id}
      snapId={snapNotification.data.origin}
      isRead={snapNotification.isRead}
      createdAt={new Date(snapNotification.createdAt)}
      title={{
        items: [
          {
            text: snapsNameGetter(snapNotification.data.origin) || 'Snap',
          },
        ],
      }}
      snapMessage={snapNotification.data.message}
      handleSnapClick={handleSnapClick}
      handleSnapButton={handleSnapButton}
    />
  );
};
