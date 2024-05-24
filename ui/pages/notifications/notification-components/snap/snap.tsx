import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { NotificationListItemSnap } from '../../../../components/multichain';
import type { SnapNotification } from '../../snap/types/types';
import { getSnapsMetadata } from '../../../../selectors';
import { markNotificationsAsRead } from '../../../../store/actions';
import { getSnapRoute, getSnapName } from '../../../../helpers/utils/util';

type SnapComponentProps = {
  snapNotification: SnapNotification;
};

export const SnapComponent = ({ snapNotification }: SnapComponentProps) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const snapsMetadata = useSelector(getSnapsMetadata);

  const snapsNameGetter = getSnapName(snapsMetadata);

  const handleSnapClick = () => {
    dispatch(markNotificationsAsRead([snapNotification.id]));
  };

  const handleSnapButton = () => {
    dispatch(markNotificationsAsRead([snapNotification.id]));
    history.push(getSnapRoute(snapNotification.data.origin));
  };

  return (
    <NotificationListItemSnap
      id={snapNotification.id}
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
