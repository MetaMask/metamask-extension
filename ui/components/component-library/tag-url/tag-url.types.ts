import React from 'react';
import type {
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box';
import { AvatarFaviconProps } from '../avatar-favicon';
import { IconProps } from '../icon';
import { TextProps } from '../text';
import { ButtonLinkProps } from '../button-link';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface TagUrlStyleUtilityProps extends StyleUtilityProps {
  /**
   * The src accepts the string of the image to be rendered
   */
  src?: string;
  /**
   * The showLockIcon accepts a boolean prop to render the lock icon instead of https in label
   */
  showLockIcon?: boolean;
  /**
   * It accepts all the props from Avatar Favicon
   */
  avatarFaviconProps?: AvatarFaviconProps<'span'>;
  /**
   * It accepts all the props from Icon
   */
  lockIconProps?: IconProps<'span'>;
  /**
   * The text content of the TagUrl component
   */
  label: string;
  /**
   * It accepts all the props from Text Component
   */
  labelProps?: TextProps<'p'>;
  /**
   * If we want a button in TagUrl component.
   */
  actionButtonLabel?: string | React.ReactNode;
  /**
   * It accepts all the props from ButtonLink
   */
  actionButtonProps?: ButtonLinkProps<'button'>;
  /**
   * Additional classNames to be added to the TagUrl component
   */
  className?: string;
}

export type TagUrlProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, TagUrlStyleUtilityProps>;

export type TagUrlComponent = <C extends React.ElementType = 'div'>(
  props: TagUrlProps<C>,
) => React.ReactElement | null;
