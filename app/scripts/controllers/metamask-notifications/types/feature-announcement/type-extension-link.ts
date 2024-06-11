import type { Entry } from 'contentful';

export type TypeExtensionLinkFields = {
  fields: {
    extensionLinkText: string;
    extensionLinkRoute: string;
  };
  contentTypeId: 'extensionLink';
};

export type TypeExtensionLink = Entry<
  TypeExtensionLinkFields,
  'WITHOUT_UNRESOLVABLE_LINKS'
>;
