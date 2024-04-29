import { TextElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { UIComponentFactory } from './types';
import { mapTextToTemplate } from '../utils';
import {
  TextVariant,
  OverflowWrap,
  TextColor,
  Display,
} from '../../../../../helpers/constants/design-system';

// This is not actually exposed to Snaps, but used as a utility to construct UIs
export const span: UIComponentFactory<TextElement> = ({
  element,
  ...params
}) => ({
  element: 'span',
  children: mapTextToTemplate(getJsxChildren(element), params),
});
