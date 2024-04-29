import { LinkElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { UIComponentFactory } from './types';
import {
  TextVariant,
  OverflowWrap,
  TextColor,
  Display,
  FontStyle
} from '../../../../../helpers/constants/design-system';

export const link: UIComponentFactory<LinkElement> = ({ element, ...params }) => ({
  element: 'SnapUILink',
  children: mapTextToTemplate(getJsxChildren(element), params),
  props: {
    href: element.props.href,
  },
});
