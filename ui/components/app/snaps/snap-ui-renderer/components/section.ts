import { SectionElement, BoxElement } from '@metamask/snaps-sdk/jsx';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { UIComponentFactory, UIComponentParams } from './types';
import { box } from './box';

export const section: UIComponentFactory<SectionElement> = ({
  element,
  ...params
}) => {
  const { children, props } = box({
    element,
    ...params,
  } as unknown as UIComponentParams<BoxElement>);
  return {
    element: 'Box',
    children,
    props: {
      ...props,
      className: 'snap-ui-renderer__section',
      padding: 4,
      backgroundColor: BackgroundColor.backgroundDefault,
      borderRadius: BorderRadius.LG,
    },
  };
};
