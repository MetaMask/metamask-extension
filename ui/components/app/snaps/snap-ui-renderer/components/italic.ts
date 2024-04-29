import { ItalicElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { UIComponentFactory } from './types';
import { mapTextToTemplate } from '../utils';
import {
  TextVariant,
  OverflowWrap,
  TextColor,
  Display,
  FontStyle
} from '../../../../../helpers/constants/design-system';

export const italic: UIComponentFactory<ItalicElement> = ({ element, ...params }) => ({
  element: 'i',
  children: mapTextToTemplate(getJsxChildren(element), params),
});
