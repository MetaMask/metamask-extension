import { ValueElement } from '@metamask/snaps-sdk/jsx';
import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const value: UIComponentFactory<ValueElement> = ({
  element,
  ...params
}) => {
  return {
    element: 'ConfirmInfoRowValueDouble',
    props: {
      left:
        typeof element.props.extra === 'string'
          ? element.props.extra
          : undefined,
      right:
        typeof element.props.value === 'string'
          ? element.props.value
          : undefined,
    },
    propComponents: {
      left:
        typeof element.props.extra === 'string'
          ? undefined
          : mapToTemplate({ element: element.props.extra, ...params }),
      right:
        typeof element.props.value === 'string'
          ? undefined
          : mapToTemplate({ element: element.props.value, ...params }),
    },
  };
};
