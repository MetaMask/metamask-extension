import { Form } from '@metamask/snaps-sdk';
import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const form: UIComponentFactory<Form> = ({ element, ...params }) => ({
  element: 'SnapUIForm',
  // @ts-expect-error This seems to be compatibility issue between superstruct and this repo.
  children: element.children.map((children) =>
    mapToTemplate({
      element: children,
      form: element.name,
      ...params,
    }),
  ),
  props: {
    name: element.name,
  },
});
