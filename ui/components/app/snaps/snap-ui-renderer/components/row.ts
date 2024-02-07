import { Row } from '@metamask/snaps-sdk';
import { mapToTemplate } from '../snap-ui-renderer';
import { UIComponent } from './types';

export const row: UIComponent<Row> = ({ element, elementKeyIndex }) => ({
  element: 'ConfirmInfoRow',
  // eslint-disable-next-line no-use-before-define
  children: [mapToTemplate({ element: element.value, elementKeyIndex })],
  props: {
    label: element.label,
    variant: element.variant,
    style: {
      // We do this to cause an overhang with certain confirmation row variants
      marginLeft: '-8px',
      marginRight: '-8px',
    },
  },
});
