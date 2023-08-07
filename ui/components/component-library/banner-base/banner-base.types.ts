import React from 'react';

import type {
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box';

export interface BannerBaseStyleUtilityProps extends StyleUtilityProps {
  /**
   * The title of the BannerBase
   */
  title?: string;
  /**
   * Additional props to pass to the `Text` component used for the `title` text
   */
  titleProps?: any;
  /**
   * The description is the content area below BannerBase title
   */
  description?: string;
  /**
   * Additional props to pass to the `Text` component used for the `description` text
   */
  descriptionProps?: any;
  /**
   * The children is an alternative to using the description prop for BannerBase content below the title
   */
  children?: React.ReactNode;
  /**
   * Label for action button (ButtonLink) of the BannerBase below the children
   */
  actionButtonLabel?: string;
  /**
   * Props for action button (ButtonLink) of the BannerBase below the children
   */
  actionButtonProps?: any;
  /**
   * The onClick handler for the action button (ButtonLink)
   */
  actionButtonOnClick?: () => void;
  /**
   * The start(defualt left) content area of BannerBase
   */
  startAccessory?: React.ReactNode;
  /**
   * The onClick handler for the close button
   * When passed this will allow for the close button to show
   */
  onClose?: () => void;
  /**
   * The props to pass to the close button
   */
  closeButtonProps?: any;
  /**
   * An additional className to apply to the BannerBase
   */
  className?: string;
}

export type BannerBaseProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, BannerBaseStyleUtilityProps>;

export type BannerBaseComponent = <C extends React.ElementType = 'div'>(
  props: BannerBaseProps<C>,
) => React.ReactElement | null;
