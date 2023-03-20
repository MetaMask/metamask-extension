import type { BoxProps } from '../../ui/box/box.d';

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

export interface BadgeWrapperProps extends BoxProps {
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
  badgeContainerProps?: BoxProps;
  /**
   * The position of the Badge. Possible values could be 'BadgeWrapperPosition.topRight', 'BadgeWrapperPosition.bottomRight','BadgeWrapperPosition.topLeft', 'BadgeWrapperPosition.bottomLeft'
   * Defaults to 'BadgeWrapperPosition.topRight'
   */
  position?: BadgeWrapperPosition;
  /**
   * The positionObj can be used to override the default positioning of the badge it accepts an object with the following keys { top, right, bottom, left }
   */
  positionObj?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
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
