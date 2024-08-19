import { HeadingElement } from '@metamask/snaps-sdk/jsx';
import {
  OverflowWrap,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { UIComponentFactory } from './types';

export const heading: UIComponentFactory<HeadingElement> = ({ element }) => ({
  element: 'Text',
  children: element.props.children,
  props: {
    variant: TextVariant.headingSm,
    overflowWrap: OverflowWrap.Anywhere,
  },
});
