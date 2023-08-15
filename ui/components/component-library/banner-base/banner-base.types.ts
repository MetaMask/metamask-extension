import React from 'react';

import type {
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box';

import type { TextProps } from '../text';
import type { ButtonLinkProps } from '../button-link';
import type { ButtonIconProps } from '../button-icon';

/**
 * Makes all props optional so that if a prop object is used not ALL required props need to be passed
 * TODO: Move to appropriate place in app as this will be highly reusable
 */
type MakePropsOptional<T> = {
  [K in keyof T]?: T[K];
};

export interface BannerBaseStyleUtilityProps extends StyleUtilityProps {
  /**
   * The title of the BannerBase
   */
  title?: string;
  /**
   * Additional props to pass to the `Text` component used for the `title` text
   */
  titleProps?: MakePropsOptional<TextProps<'p'>>;
  /**
   * The description is the content area below BannerBase title
   */
  description?: string;
  /**
   * Additional props to pass to the `Text` component used for the `description` text
   */
  descriptionProps?: MakePropsOptional<TextProps<'p'>>;
  /**
   * The children is an alternative to using the description prop for BannerBase content below the title
   */
  children?: React.ReactNode;
  /**
   * Additional props to pass to the `Text` component used to wrap the `children` if `children` is type `string`
   */
  childrenWrapperProps?: MakePropsOptional<TextProps<'p'>>;
  /**
   * Label for action button (ButtonLink) of the BannerBase below the children
   */
  actionButtonLabel?: string;
  /**
   * Props for action button (ButtonLink) of the BannerBase below the children
   */
  actionButtonProps?: MakePropsOptional<ButtonLinkProps<'button'>>;
  /**
   * The onClick handler for the action button (ButtonLink)
   */
  actionButtonOnClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * The start(default left) content area of BannerBase
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
  closeButtonProps?: MakePropsOptional<ButtonIconProps<'button'>>;
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
