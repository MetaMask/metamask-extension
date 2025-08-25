import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
// eslint-disable-next-line import/no-named-as-default
import DOMPurify from 'dompurify';
import { isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import {
  createTextItems,
  formatIsoDateString,
} from '../../../../helpers/utils/notification.util';
import { Box, Text } from '../../../../components/component-library';
import {
  NotificationListItem,
  NotificationDetailTitle,
} from '../../../../components/multichain';
import {
  TextVariant,
  Display,
  JustifyContent,
  BorderRadius,
  BlockSize,
} from '../../../../helpers/constants/design-system';
import { FeatureAnnouncementNotification } from './types';
import {
  ExtensionLinkButton,
  ExternalLinkButton,
} from './annonucement-footer-buttons';

const purify = DOMPurify(window);

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

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
        type: NotificationComponentType.AnnouncementBody,
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
              as="div"
              // TODO - we can replace the raw HTML string injection with react components
              dangerouslySetInnerHTML={{
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                __html: purify.sanitize(notification.data.longDescription),
              }}
            />
          </Box>
        ),
      },
    },
    footer: {
      type: NotificationComponentType.AnnouncementFooter,
      ExtensionLink: ExtensionLinkButton,
      ExternalLink: ExternalLinkButton,
    },
  };
