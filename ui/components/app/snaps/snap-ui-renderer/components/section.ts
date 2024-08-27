import { SectionElement, JSXElement, SectionProps } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { NonEmptyArray } from '@metamask/utils';
import {
  Display,
  FlexDirection,
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { mapToTemplate } from '../utils';
import { UIComponent, UIComponentFactory } from './types';

export const box: UIComponentFactory<SectionElement> = ({
  element,
  ...params
}) => ({
  element: 'Box',
  children: getJsxChildren(element).map((children) =>
    mapToTemplate({ ...params, element: children as JSXElement }),
  ) as NonEmptyArray<UIComponent>,
  props: {
    display: Display.Flex,
    flexDirection: FlexDirection.Column,
    className: 'snap-ui-renderer__section',
    padding: 4,
    backgroundColor: BackgroundColor.backgroundDefault,
    borderRadius: BorderRadius.LG,
  },
});
