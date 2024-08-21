import {
  JSXElement,
  OptionElement,
  SelectorElement,
} from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';

import { UIComponentFactory } from './types';
import { mapToTemplate } from '../utils';

export const selector: UIComponentFactory<SelectorElement> = ({
  element,
  form,
  ...params
}) => {
  const children = getJsxChildren(element) as OptionElement[];

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
      form,
      options,
    },
    propComponents: {
      optionComponents,
    },
  };
};
