import { Row } from '@metamask/snaps-sdk';

import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const row: UIComponentFactory<Row> = ({ element, ...params }) => ({
  element: 'ConfirmInfoRow',
  children: [mapToTemplate({ element: element.value, ...params })],
  props: {
    label: element.label,
    variant: element.variant,
    style: {
      // We do this to cause an overhang with certain confirmation row variants
      marginLeft: '-8px',
      marginRight: '-8px',
      marginTop: '0px',
      marginBottom: '0px',
    },
  },
});
