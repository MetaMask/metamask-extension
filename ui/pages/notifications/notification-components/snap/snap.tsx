import React, { useContext, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { hasProperty } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { NotificationListItemSnap } from '../../../../components/multichain';
import type { SnapNotification } from '../../snap/types/types';
import { getSnapsMetadata } from '../../../../selectors';
import { markNotificationsAsRead } from '../../../../store/actions';
import { getSnapRoute, getSnapName } from '../../../../helpers/utils/util';
import SnapNotificationModal from '../../../../components/app/snaps/snap-notification-modal/snap-notification-modal';

type SnapComponentProps = {
  snapNotification: SnapNotification;
};

export const SnapComponent = ({ snapNotification }: SnapComponentProps) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const [isOpen, setIsOpen] = useState(false);

  const snapsMetadata = useSelector(getSnapsMetadata);

  const snapsNameGetter = getSnapName(snapsMetadata);

  const hasExpandedView = hasProperty(snapNotification.data, 'expandedView');

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSnapClick = () => {
    dispatch(markNotificationsAsRead([snapNotification.id]));
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.NotificationClicked,
      properties: {
        notification_id: snapNotification.id,
        notification_type: snapNotification.type,
        previously_read: snapNotification.isRead,
      },
    });
    if (hasExpandedView) {
      setIsOpen(true);
    }
  };

  const handleSnapButton = () => {
    dispatch(markNotificationsAsRead([snapNotification.id]));
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
    <>
      {hasExpandedView && (
        <SnapNotificationModal
          isOpen={isOpen}
          handleClose={handleClose}
          data={snapNotification.data}
        />
      )}
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
    </>
  );
};
