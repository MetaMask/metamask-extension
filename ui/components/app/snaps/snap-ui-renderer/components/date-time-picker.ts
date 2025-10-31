import { DateTimePickerElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const dateTimePicker: UIComponentFactory<DateTimePickerElement> = ({
  element,
  form,
}) => {
  return {
    element: 'SnapUIDateTimePicker',
    props: {
      form,
      type: element.props.type,
      name: element.props.name,
      placeholder: element.props.placeholder,
      disabled: element.props.disabled,
      disablePast: element.props.disablePast,
    },
  };
};
