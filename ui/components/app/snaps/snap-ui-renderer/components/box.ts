import { BoxElement, JSXElement, BoxProps } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { NonEmptyArray } from '@metamask/utils';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { mapToTemplate } from '../utils';
import { UIComponent, UIComponentFactory } from './types';

function generateJustifyContent(alignment?: BoxProps['alignment']) {
  switch (alignment) {
    default:
    case 'start':
      return JustifyContent.flexStart;

    case 'center':
      return JustifyContent.center;

    case 'end':
      return JustifyContent.flexEnd;

    case 'space-between':
      return JustifyContent.spaceBetween;

    case 'space-around':
      return JustifyContent.spaceAround;
  }
}

export const box: UIComponentFactory<BoxElement> = ({
  element,
  ...params
}) => ({
  element: 'Box',
  children: getJsxChildren(element).map((children) =>
    mapToTemplate({ ...params, element: children as JSXElement }),
  ) as NonEmptyArray<UIComponent>,
  props: {
    display: Display.Flex,
    flexDirection:
      element.props.direction === 'horizontal'
        ? FlexDirection.Row
        : FlexDirection.Column,
    justifyContent: generateJustifyContent(element.props.alignment),
    className: 'snap-ui-renderer__panel',
    color: TextColor.textDefault,
  },
});
