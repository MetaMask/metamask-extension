import { HeadingElement } from '@metamask/snaps-sdk/jsx';
import {
  OverflowWrap,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { UIComponentFactory } from './types';

export const generateSize = (size: HeadingElement['props']['size']) => {
  switch (size) {
    case 'md':
      return TextVariant.headingMd;
    case 'lg':
      return TextVariant.headingLg;
    default:
      return TextVariant.headingSm;
  }
};

export const heading: UIComponentFactory<HeadingElement> = ({ element }) => ({
  element: 'Text',
  children: element.props.children,
  props: {
    variant: generateSize(element.props.size),
    overflowWrap: OverflowWrap.Anywhere,
  },
});
