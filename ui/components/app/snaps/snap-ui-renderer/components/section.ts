import { SectionElement, BoxElement } from '@metamask/snaps-sdk/jsx';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { UIComponentFactory, UIComponentParams } from './types';
import { box } from './box';

export const section: UIComponentFactory<SectionElement> = ({
  element,
  contentBackgroundColor,
  ...params
}) => {
  const { children, props } = box({
    element,
    ...params,
  } as unknown as UIComponentParams<BoxElement>);

  // Reverse colors to improve visibility on certain backgrounds
  const backgroundColor =
    contentBackgroundColor === BackgroundColor.backgroundDefault
      ? BackgroundColor.backgroundAlternative
      : BackgroundColor.backgroundDefault;

  return {
    element: 'Box',
    children,
    props: {
      ...props,
      className: 'snap-ui-renderer__section',
      padding: 4,
      gap: 2,
      backgroundColor,
      borderRadius: BorderRadius.LG,
    },
  };
};
