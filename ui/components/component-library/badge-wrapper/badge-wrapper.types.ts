import React from 'react';

import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
  BoxProps,
} from '..';

export enum BadgeWrapperPosition {
  topRight = 'top-right',
  bottomRight = 'bottom-right',
  topLeft = 'top-left',
  bottomLeft = 'bottom-left',
}

export enum BadgeWrapperAnchorElementShape {
  rectangular = 'rectangular',
  circular = 'circular',
}

export interface BadgeWrapperStyleUtilityProps extends StyleUtilityProps {
  /**
   * The element to be wrapped by the BadgeWrapper and for the badge to be positioned on top of
   */
  children: React.ReactNode;
  /**
   * Use the `badge` prop to define the badge component to be rendered on top of the `children` component
   */
  badge?: React.ReactNode;
  /**
   * The BadgeWrapper props of the component. All Box props can be used
   */
  badgeContainerProps?: BoxProps<'div'>;
  /**
   * The position of the Badge. Possible values could be 'BadgeWrapperPosition.topRight', 'BadgeWrapperPosition.bottomRight','BadgeWrapperPosition.topLeft', 'BadgeWrapperPosition.bottomLeft'
   * Defaults to 'BadgeWrapperPosition.topRight'
   */
  position?: BadgeWrapperPosition;
  /**
   * The positionObj can be used to override the default positioning of the badge it accepts an object with the following keys { top, right, bottom, left }
   */
  positionObj?: {
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
  };
  /**
   * The shape of the anchor element. Possible values could be 'BadgeWrapperAnchorElementShape.circular', 'BadgeWrapperAnchorElementShape.square'
   * Defaults to
   */
  anchorElementShape?: BadgeWrapperAnchorElementShape;
  /**
   * Additional classNames to be added to the BadgeWrapper component
   */
  className?: string;
}

export type BadgeWrapperProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, BadgeWrapperStyleUtilityProps>;

export type BadgeWrapperComponent = <C extends React.ElementType = 'div'>(
  props: BadgeWrapperProps<C>,
) => React.ReactElement | null;
