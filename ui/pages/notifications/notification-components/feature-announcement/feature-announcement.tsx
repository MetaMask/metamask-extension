import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import type { NotificationComponent } from '../types/notifications/notifications';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';

import {
  createTextItems,
  formatIsoDateString,
} from '../../../../helpers/utils/notification.util';

import {
  Box,
  ButtonVariant,
  Text,
} from '../../../../components/component-library';
import {
  NotificationListItem,
  NotificationDetailTitle,
  NotificationDetailButton,
} from '../../../../components/multichain';
import {
  TextVariant,
  Display,
  JustifyContent,
  BorderRadius,
  BlockSize,
} from '../../../../helpers/constants/design-system';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type FeatureAnnouncementNotification =
  ExtractedNotification<NotificationServicesController.Constants.TRIGGER_TYPES.FEATURES_ANNOUNCEMENT>;
const isFeatureAnnouncementNotification = isOfTypeNodeGuard([
  TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
]);

const getTitle = (n: FeatureAnnouncementNotification) => {
  const items = createTextItems([n.data.title], TextVariant.bodySm);
  return items;
};

const getDescription = (n: FeatureAnnouncementNotification) => {
  const items = createTextItems([n.data.shortDescription], TextVariant.bodyMd);
  return items;
};

export const components: NotificationComponent<FeatureAnnouncementNotification> =
  {
    guardFn: isFeatureAnnouncementNotification,
    item: ({ notification, onClick }) => (
      <NotificationListItem
        id={notification.id}
        isRead={notification.isRead}
        icon={{
          type: NotificationListItemIconType.Token,
          value: './images/product-announcement-logo.svg',
        }}
        title={getTitle(notification)}
        description={getDescription(notification)}
        createdAt={new Date(notification.createdAt)}
        onClick={onClick}
      />
    ),
    details: {
      title: ({ notification }) => (
        <NotificationDetailTitle
          title={notification.data.title}
          date={formatIsoDateString(notification.createdAt)}
        />
      ),
      body: {
        type: 'body_feature_announcement',
        Image: ({ notification }) => (
          <Box
            display={Display.Block}
            width={BlockSize.Full}
            paddingLeft={4}
            paddingRight={4}
            paddingBottom={4}
          >
            <Box
              as="img"
              src={`https:${notification.data.image.url}?fm=jpg&fl=progressive&w=1000&q=80`}
              alt={notification.data.title}
              title={notification.data.title}
              display={Display.Block}
              justifyContent={JustifyContent.center}
              borderRadius={BorderRadius.XL}
              width={BlockSize.Full}
            />
          </Box>
        ),
        Description: ({ notification }) => (
          <Box paddingLeft={4} paddingRight={4}>
            <Text
              variant={TextVariant.bodyMd}
              dangerouslySetInnerHTML={{
                __html: notification.data.longDescription,
              }}
            />
          </Box>
        ),
      },
    },
    footer: {
      type: 'footer_feature_announcement',
      ExtensionLink: ({ notification }) =>
        notification.data.extensionLink ? (
          <NotificationDetailButton
            notification={notification}
            variant={ButtonVariant.Primary}
            text={notification.data.extensionLink.extensionLinkText}
            href={`/${notification.data.extensionLink.extensionLinkRoute}`}
            id={notification.id}
            endIconName={false}
            isExternal={true}
          />
        ) : null,
    },
  };
