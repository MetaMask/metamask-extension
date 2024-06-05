import type { Entry } from 'contentful';

export type TypeActionFields = {
  fields: {
    actionText: string;
    actionUrl: string;
    isExternal: boolean;
  };
  contentTypeId: 'action';
};

export type TypeAction = Entry<TypeActionFields, 'WITHOUT_UNRESOLVABLE_LINKS'>;
