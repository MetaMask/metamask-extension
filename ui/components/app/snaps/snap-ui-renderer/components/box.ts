import { BoxElement, JSXElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import {
  Display,
  FlexDirection,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const box: UIComponentFactory<BoxElement> = ({
  element,
  ...params
}) => ({
  element: 'Box',
  children: getJsxChildren(element).map((children) =>
    mapToTemplate({ ...params, element: children as JSXElement }),
  ),
  props: {
    display: Display.Flex,
    flexDirection: FlexDirection.Column,
    className: 'snap-ui-renderer__panel',
    color: TextColor.textDefault,
  },
});
