import { JSXElement, Text, TooltipElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const tooltip: UIComponentFactory<TooltipElement> = ({
  element,
  ...params
}) => ({
  element: 'SnapUITooltip',
  children: getJsxChildren(element).map((children) =>
    mapToTemplate({ element: children as JSXElement, ...params }),
  ),
  propComponents: {
    content: mapToTemplate({
      element:
        typeof element.props.content === 'string'
          ? Text({ children: element.props.content })
          : element.props.content,
      ...params,
    }),
  },
});
