import React from 'react';
import type {
  BoxProps,
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box';

export enum BadgeWrapperPosition {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  topRight = 'top-right',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bottomRight = 'bottom-right',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  topLeft = 'top-left',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bottomLeft = 'bottom-left',
}

export enum BadgeWrapperAnchorElementShape {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  rectangular = 'rectangular',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  circular = 'circular',
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type BadgeWrapperProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, BadgeWrapperStyleUtilityProps>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type BadgeWrapperComponent = <C extends React.ElementType = 'div'>(
  props: BadgeWrapperProps<C>,
) => React.ReactElement | null;
