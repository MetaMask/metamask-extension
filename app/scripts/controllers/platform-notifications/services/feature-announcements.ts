import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import log from 'loglevel';
import type { Entry } from 'contentful';
import { TRIGGER_TYPES } from '../constants/triggers';
import type {
  FeatureAnnouncementRawNotification,
  TypeFeatureAnnouncement,
} from '../types/feature-announcement';
import type { Notification } from '../types/notification';
import { processFeatureAnnouncement } from '../processors/process-feature-announcement';

async function fetchFromContentful(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    log.error(`Error fetching from Contentful: ${error}`);
    return null;
  }
}

async function fetchFeatureAnnouncementNotifications(): Promise<
  FeatureAnnouncementRawNotification[]
> {
  const spaceId = process.env.CONTENTFUL_ACCESS_SPACE_ID || '';
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN || '';
  const url = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries?access_token=${accessToken}&content_type=productAnnouncement&include=10`;

  const data = await fetchFromContentful(url);

  if (!data) {
    return [];
  }

  const findIncludedItem = (sysId: string) => {
    const item =
      data.includes.Entry?.find((i: Entry) => i.sys.id === sysId) ||
      data.includes.Asset?.find((i: Entry) => i.sys.id === sysId);
    return item ? item.fields : null;
  };

  const rawNotifications: FeatureAnnouncementRawNotification[] = data.items.map(
    (n: TypeFeatureAnnouncement) => {
      const { action, image, link, longDescription, ...otherFields } = n.fields;

      const imageFields = image ? findIncludedItem(image.sys.id) : undefined;
      const actionFields = action ? findIncludedItem(action.sys.id) : undefined;
      const linkFields = link ? findIncludedItem(link.sys.id) : undefined;

      return {
        type: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
        createdAt: new Date(n.sys.createdAt),
        data: {
          ...otherFields,
          image: imageFields
            ? {
                title: imageFields?.title,
                description: imageFields?.description,
                url: imageFields.file.url,
              }
            : undefined,
          link: linkFields,
          action: actionFields,
          longDescription: documentToHtmlString(longDescription),
        },
      };
    },
  );

  return rawNotifications;
}

export async function getFeatureAnnouncementNotifications(
  readPlatformNotificationsList: string[],
): Promise<Notification[]> {
  const rawNotifications = await fetchFeatureAnnouncementNotifications();
  const notifications = rawNotifications.map((notification) =>
    processFeatureAnnouncement(notification, readPlatformNotificationsList),
  );

  return notifications;
}
