import {
  JSXElement,
  SelectorElement,
  SelectorOptionElement,
} from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';

import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const selector: UIComponentFactory<SelectorElement> = ({
  element,
  form,
  ...params
}) => {
  const children = getJsxChildren(element) as SelectorOptionElement[];

  const options = children.map((child) => child.props.value);

  const optionComponents = children.map((child) =>
    mapToTemplate({
      ...params,
      form,
      element: child.props.children as JSXElement,
    }),
  );

  return {
    element: 'SnapUISelector',
    props: {
      id: element.props.name,
      name: element.props.name,
      title: element.props.title,
      form,
      options,
    },
    propComponents: {
      optionComponents,
    },
  };
};
