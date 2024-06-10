import type { Entry, EntryFieldTypes } from 'contentful';
import type { TypeExtensionLinkFields } from './type-extension-link';

export type ImageFields = {
  fields: {
    title?: string;
    description?: string;
    file?: {
      url: string;
      fileName: string;
      contentType: string;
      details: {
        size: number;
        image?: {
          width: number;
          height: number;
        };
      };
    };
  };
  contentTypeId: 'Image';
};

export type TypeFeatureAnnouncementFields = {
  fields: {
    title: EntryFieldTypes.Text;
    id: EntryFieldTypes.Symbol;
    category: EntryFieldTypes.Text; // E.g. Announcement, etc.
    shortDescription: EntryFieldTypes.Text;
    image: EntryFieldTypes.EntryLink<ImageFields>;
    longDescription: EntryFieldTypes.RichText;
    extensionLink?: EntryFieldTypes.EntryLink<TypeExtensionLinkFields>;
    clients?: EntryFieldTypes.Text<'extension' | 'mobile' | 'portfolio'>;
  };
  contentTypeId: 'productAnnouncement';
};

export type TypeFeatureAnnouncement = Entry<
  TypeFeatureAnnouncementFields,
  'WITHOUT_UNRESOLVABLE_LINKS'
>;
