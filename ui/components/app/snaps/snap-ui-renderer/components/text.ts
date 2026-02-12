import { JSXElement, TextElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { NonEmptyArray } from '@metamask/utils';
import { mapTextToTemplate } from '../utils';
import {
  TextVariant,
  OverflowWrap,
  TextColor,
  FontWeight,
} from '../../../../../helpers/constants/design-system';
import { UIComponentFactory } from './types';

function getTextColor(color: TextElement['props']['color']) {
  switch (color) {
    case 'default':
      return TextColor.textDefault;
    case 'alternative':
      return TextColor.textAlternative;
    case 'muted':
      return TextColor.textMuted;
    case 'error':
      return TextColor.errorDefault;
    case 'success':
      return TextColor.successDefault;
    case 'warning':
      return TextColor.warningDefault;
    default:
      return TextColor.inherit;
  }
}

function getFontWeight(color: TextElement['props']['fontWeight']) {
  switch (color) {
    case 'bold':
      return FontWeight.Bold;
    case 'medium':
      return FontWeight.Medium;
    case 'regular':
    default:
      return FontWeight.Normal;
  }
}

export const text: UIComponentFactory<TextElement> = ({
  element,
  ...params
}) => {
  return {
    element: 'Text',
    children: mapTextToTemplate(
      getJsxChildren(element) as NonEmptyArray<string | JSXElement>,
      params,
    ),
    props: {
      variant:
        element.props.size === 'sm' ? TextVariant.bodySm : TextVariant.bodyMd,
      fontWeight: getFontWeight(element.props.fontWeight),
      overflowWrap: OverflowWrap.BreakWord,
      color: getTextColor(element.props.color),
      className: 'snap-ui-renderer__text',
      textAlign: element.props.alignment,
    },
  };
};
