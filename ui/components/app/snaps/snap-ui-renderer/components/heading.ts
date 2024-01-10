import { Heading } from '@metamask/snaps-sdk';
import {
  FontWeight,
  OverflowWrap,
  TypographyVariant,
} from '../../../../../helpers/constants/design-system';
import { UiComponent } from './types';

export const heading: UiComponent<Heading> = ({ element }) => ({
  element: 'Typography',
  children: element.value,
  props: {
    variant: TypographyVariant.H4,
    fontWeight: FontWeight.Bold,
    overflowWrap: OverflowWrap.BreakWord,
  },
});
