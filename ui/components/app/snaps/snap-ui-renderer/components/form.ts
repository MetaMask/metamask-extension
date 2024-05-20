import { FormElement, JSXElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const form: UIComponentFactory<FormElement> = ({
  element,
  ...params
}) => ({
  element: 'SnapUIForm',
  children: getJsxChildren(element).map((children) =>
    mapToTemplate({
      element: children as JSXElement,
      form: element.props.name,
      ...params,
    }),
  ),
  props: {
    name: element.props.name,
  },
});
