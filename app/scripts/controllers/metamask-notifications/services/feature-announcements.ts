import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import log from 'loglevel';
import type { Entry } from 'contentful';
import type {
  FeatureAnnouncementRawNotification,
  TypeFeatureAnnouncement,
} from '../types/feature-announcement/feature-announcement';
import type { Notification } from '../types/notification/notification';
import { processFeatureAnnouncement } from '../processors/process-feature-announcement';
import { TRIGGER_TYPES } from '../../../../../shared/constants/metamask-notifications';

export class FeatureAnnouncementsService {
  private async fetchFromContentful(
    url: string,
    retries = 3,
    retryDelay = 1000,
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Fetch failed with status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        if (error instanceof Error) {
          lastError = error;
        }
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    log.error(
      `Error fetching from Contentful after ${retries} retries: ${lastError}`,
    );
    return null;
  }

  private async fetchFeatureAnnouncementNotifications(): Promise<
    FeatureAnnouncementRawNotification[]
  > {
    const spaceId = process.env.CONTENTFUL_ACCESS_SPACE_ID || '';
    const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN || '';
    const url = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries?access_token=${accessToken}&content_type=productAnnouncement&include=10`;

    const data = await this.fetchFromContentful(url);

    if (!data) {
      return [];
    }

    const findIncludedItem = (sysId: string) => {
      const item =
        data.includes.Entry?.find((i: Entry) => i.sys.id === sysId) ||
        data.includes.Asset?.find((i: Entry) => i.sys.id === sysId);
      return item ? item.fields : null;
    };

    const rawNotifications: FeatureAnnouncementRawNotification[] =
      data.items.map((n: TypeFeatureAnnouncement) => {
        const { action, image, link, longDescription, ...otherFields } =
          n.fields;

        const imageFields = image ? findIncludedItem(image.sys.id) : undefined;
        const actionFields = action
          ? findIncludedItem(action.sys.id)
          : undefined;
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
      });

    return rawNotifications;
  }

  async getFeatureAnnouncementNotifications(): Promise<Notification[]> {
    const rawNotifications = await this.fetchFeatureAnnouncementNotifications();
    const notifications = rawNotifications.map((notification) =>
      processFeatureAnnouncement(notification),
    );

    return notifications;
  }
}
