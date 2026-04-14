import { BoxElement, CollapsibleSectionElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory, UIComponentParams } from './types';
import { box } from './box';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';

export const collapsibleSection: UIComponentFactory<CollapsibleSectionElement> = ({
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
    element: 'Delineator',
    children,
    props: {
      wrapperBoxProps: {
        backgroundColor,
        style: {
          overflow: 'unset',
        }
      },
      contentBoxProps: {
        ...props,
        gap: 2,
      },
      className: 'snap-ui-renderer__collapsible-section',
    },
    propComponents: {
      headerComponent: {
        element: 'Text',
        children: element.props.label,
      }
    }
  };
};
