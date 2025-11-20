import React from 'react';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import { type NotificationComponent } from '../types/notifications/notifications';
import { NotificationListItem } from '../../../../components/multichain';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import { createTextItems } from '../../../../helpers/utils/notification.util';
import { TextVariant } from '../../../../helpers/constants/design-system';

type PlatformNotification = ExtractedNotification<TRIGGER_TYPES.PLATFORM>;
const isPlatformNotification = isOfTypeNodeGuard([TRIGGER_TYPES.PLATFORM]);

const getTitle = (n: PlatformNotification) => {
  const items = createTextItems([n.template.title], TextVariant.bodySm);
  return items;
};

const getDescription = (n: PlatformNotification) => {
  const items = createTextItems([n.template.body], TextVariant.bodyMd);
  return items;
};

export const components: NotificationComponent<PlatformNotification> = {
  guardFn: isPlatformNotification,
  item: ({ notification, onClick }) => {
    return (
      <NotificationListItem
        id={notification.id}
        isRead={notification.isRead}
        icon={{
          type: NotificationListItemIconType.Token,
          value: notification.template.image_url,
        }}
        title={getTitle(notification)}
        description={getDescription(notification)}
        createdAt={new Date(notification.createdAt)}
        onClick={onClick}
        cta={notification.template.cta}
      />
    );
  },
};
