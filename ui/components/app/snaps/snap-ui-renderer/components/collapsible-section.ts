import { BoxElement, CollapsibleSectionElement } from '@metamask/snaps-sdk/jsx';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { UIComponentFactory, UIComponentParams } from './types';
import { box } from './box';

export const collapsibleSection: UIComponentFactory<
  CollapsibleSectionElement
> = ({ element, contentBackgroundColor, ...params }) => {
  const { children, props } = box({
    element,
    contentBackgroundColor,
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
      isExpanded: element.props.isExpanded,
      isLoading: element.props.isLoading,
      wrapperBoxProps: {
        backgroundColor,
        style: {
          overflow: 'unset',
        },
        className: 'snap-ui-renderer__collapsible-section',
      },
      contentBoxProps: {
        ...props,
        gap: 2,
        padding: element.props.isLoading ? 0 : undefined,
      },
    },
    propComponents: {
      headerComponent: {
        element: 'Text',
        children: element.props.label,
      },
    },
  };
};
