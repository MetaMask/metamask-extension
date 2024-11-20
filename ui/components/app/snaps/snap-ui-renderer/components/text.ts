import { JSXElement, TextElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { NonEmptyArray } from '@metamask/utils';
import { mapTextToTemplate } from '../utils';
import {
  TextVariant,
  OverflowWrap,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { UIComponentFactory } from './types';

export const text: UIComponentFactory<TextElement> = ({
  element,
  ...params
}) => {
  const getTextColor = () => {
    switch (element.props.color) {
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
  };

  return {
    element: 'Text',
    children: mapTextToTemplate(
      getJsxChildren(element) as NonEmptyArray<string | JSXElement>,
      params,
    ),
    props: {
      variant: TextVariant.bodyMd,
      overflowWrap: OverflowWrap.Anywhere,
      color: getTextColor(),
      className: 'snap-ui-renderer__text',
      textAlign: element.props.alignment,
    },
  };
};
