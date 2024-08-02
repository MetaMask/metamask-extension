import { JSXElement, FooterElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { NonEmptyArray } from '@metamask/utils';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { mapToTemplate } from '../utils';
import { UIComponent, UIComponentFactory } from './types';

export const footer: UIComponentFactory<FooterElement> = ({
  element,
  ...params
}) => ({
  element: 'Box',
  children: getJsxChildren(element).map((children) =>
    mapToTemplate({ ...params, element: children as JSXElement }),
  ) as NonEmptyArray<UIComponent>,
  props: {
    display: Display.Flex,
    flexDirection: FlexDirection.Row,
    width: BlockSize.Full,
    padding: 4,
    className: 'snap-ui-renderer__footer',
    backgroundColor: BackgroundColor.backgroundDefault,
    style: {
      boxShadow: 'var(--shadow-size-lg) var(--color-shadow-default)',
    },
  },
});
