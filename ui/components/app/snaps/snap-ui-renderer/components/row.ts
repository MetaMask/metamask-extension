import { Row } from '@metamask/snaps-sdk';

import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const row: UIComponentFactory<Row> = ({ element, ...params }) => ({
  element: 'ConfirmInfoRow',
  children: [mapToTemplate({ ...params, element: element.props.children })],
  props: {
    label: element.props.label,
    variant: element.props.variant,
    style: {
      // We do this to cause an overhang with certain confirmation row variants
      marginLeft: '-8px',
      marginRight: '-8px',
      marginTop: '0px',
      marginBottom: '0px',
    },
  },
});
