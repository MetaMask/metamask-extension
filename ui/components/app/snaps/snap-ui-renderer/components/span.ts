import { TextElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import {
  TextVariant,
  OverflowWrap,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { UIComponentFactory } from './types';

// This is not actually exposed to Snaps, but used as a utility to construct UIs, the children are expected to be exclusively strings.
export const span: UIComponentFactory<TextElement> = ({ element }) => ({
  element: 'Text',
  children: getJsxChildren(element),
  props: {
    variant: TextVariant.bodyMd,
    overflowWrap: OverflowWrap.Anywhere,
    color: TextColor.inherit,
    className: 'snap-ui-renderer__text',
    as: 'span',
  },
});
