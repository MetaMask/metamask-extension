import { Heading } from '@metamask/snaps-sdk';
import {
  OverflowWrap,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { UIComponentFactory } from './types';

export const heading: UIComponentFactory<Heading> = ({ element }) => ({
  element: 'Text',
  children: element.props.children,
  props: {
    variant: TextVariant.headingSm,
    overflowWrap: OverflowWrap.Anywhere,
  },
});
