import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { NotificationListItem } from '../../../../components/multichain';
import type { SnapNotificationWithoutSnapName } from '../../snap/types/types';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import { getSnapsMetadata } from '../../../../selectors';
import { markNotificationsAsRead } from '../../../../store/actions';
import { getSnapRoute, getSnapName } from '../../../../helpers/utils/util';
import { TextVariant } from '../../../../helpers/constants/design-system';

type SnapComponentProps = {
  snapNotification: SnapNotificationWithoutSnapName;
};

export const SnapComponent = ({ snapNotification }: SnapComponentProps) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const snapsMetadata = useSelector(getSnapsMetadata);

  const snapsNameGetter = getSnapName(snapsMetadata);

  const handleNameClick = () => {
    dispatch(markNotificationsAsRead([snapNotification.id]));
    history.push(getSnapRoute(snapNotification.data.origin));
  };

  return (
    <NotificationListItem
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
      description={{
        items: [
          {
            text: snapNotification.data.message,
          },
        ],
        variant: TextVariant.bodyMd,
      }}
      icon={{
        type: NotificationListItemIconType.Token,
        value: 'https://s2.coinmarketcap.com/static/img/coins/64x64/13855.png',
      }}
      onClick={() => handleNameClick()}
      snapButton={{
        text: 'View',
        onClick: () => {
          history.push(getSnapRoute(snapNotification.data.origin));
        },
      }}
    />
  );
};
