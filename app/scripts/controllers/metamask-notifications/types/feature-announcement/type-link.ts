import type { Entry } from 'contentful';

export type TypeLinkFields = {
  fields: {
    linkText: string;
    linkUrl: string;
    isExternal: boolean;
  };
  contentTypeId: 'link';
};

export type TypeLink = Entry<TypeLinkFields, 'WITHOUT_UNRESOLVABLE_LINKS'>;
