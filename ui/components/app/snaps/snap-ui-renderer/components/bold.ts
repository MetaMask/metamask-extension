import { BoldElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { UIComponentFactory } from './types';
import { mapTextToTemplate } from '../utils';
import {
  TextVariant,
  OverflowWrap,
  TextColor,
  Display,
  FontWeight,
} from '../../../../../helpers/constants/design-system';

export const bold: UIComponentFactory<BoldElement> = ({ element, ...params }) => ({
  element: 'b',
  children: mapTextToTemplate(getJsxChildren(element), params),
});
