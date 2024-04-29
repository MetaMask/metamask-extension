import { FormElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const form: UIComponentFactory<FormElement> = ({ element, ...params }) => ({
  element: 'SnapUIForm',
  // @ts-expect-error This seems to be compatibility issue between superstruct and this repo.
  children: getJsxChildren(element).map((children) =>
    mapToTemplate({
      element: children,
      form: element.props.name,
      ...params,
    }),
  ),
  props: {
    name: element.props.name,
  },
});
