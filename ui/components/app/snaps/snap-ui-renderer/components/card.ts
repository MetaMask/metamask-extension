import { CardElement } from '@metamask/snaps-sdk/jsx';
import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const card: UIComponentFactory<CardElement> = ({
  element,
  ...params
}) => ({
  element: 'SnapUICard',
  props: {
    image: element.props.image,

    description: element.props.description,
    value: element.props.value,
    extra: element.props.extra,
  },
  propComponents: {
    title:
      typeof element.props.title === 'string'
        ? element.props.title
        : mapToTemplate({ element: element.props.title, ...params }),
  },
});
