import type { ItalicElement, JSXElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import type { NonEmptyArray } from '@metamask/utils';

import {
  TextVariant,
  OverflowWrap,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { mapTextToTemplate } from '../utils';
import type { UIComponentFactory } from './types';

export const italic: UIComponentFactory<ItalicElement> = ({
  element,
  ...params
}) => ({
  element: 'Text',
  children: mapTextToTemplate(
    getJsxChildren(element) as NonEmptyArray<string | JSXElement>,
    params,
  ),
  props: {
    variant: TextVariant.bodyMd,
    overflowWrap: OverflowWrap.Anywhere,
    color: TextColor.inherit,
    className: 'snap-ui-renderer__text',
    as: 'i',
  },
});
