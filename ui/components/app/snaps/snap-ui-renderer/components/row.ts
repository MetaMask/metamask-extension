import { RowElement } from '@metamask/snaps-sdk/jsx';

import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const row: UIComponentFactory<RowElement> = ({
  element,
  ...params
}) => ({
  element: 'ConfirmInfoRow',
  children: [mapToTemplate({ ...params, element: element.props.children })],
  props: {
    label: element.props.label,
    variant: element.props.variant,
    tooltip: element.props.tooltip,
    style: {
      // We do this to cause an overhang with certain confirmation row variants
      marginLeft: '-8px',
      marginRight: '-8px',
      marginTop: '0px',
      marginBottom: '0px',
    },
  },
});
