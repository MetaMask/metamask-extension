import type { JSXElement, RowElement } from '@metamask/snaps-sdk/jsx';

import { FlexDirection } from '../../../../../helpers/constants/design-system';
import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const row: UIComponentFactory<RowElement> = ({
  element,
  ...params
}) => ({
  element: 'ConfirmInfoRow',
  children: [
    mapToTemplate({ ...params, element: element.props.children as JSXElement }),
  ],
  props: {
    label: element.props.label,
    variant: element.props.variant,
    tooltip: element.props.tooltip,
    style: {
      // Warning text can wrap inside a scrollable flex panel, so retain its content height.
      ...(element.props.variant === 'warning'
        ? {
            flexDirection: FlexDirection.Column,
            flexShrink: 0,
          }
        : {}),
      marginLeft: '-8px',
      marginRight: '-8px',
      marginTop: '0px',
      marginBottom: '0px',
    },
  },
});
