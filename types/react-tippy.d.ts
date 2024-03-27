// Copied from <https://github.com/tvkhoa/react-tippy/blob/c6e6169e3f2cabe05f1bfbd7e0dea1ddef4debe8/index.d.ts>
// which for some reason is not included in the distributed version
declare module 'react-tippy' {
  import * as React from 'react';

  export type Position =
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end';
  export type Trigger = 'mouseenter' | 'focus' | 'click' | 'manual';
  export type Animation = 'shift' | 'perspective' | 'fade' | 'scale' | 'none';
  export type Size = 'small' | 'regular' | 'big';
  export type Theme = 'dark' | 'light' | 'transparent';

  export type TooltipProps = {
    title?: string;
    disabled?: boolean;
    open?: boolean;
    useContext?: boolean;
    onRequestClose?: () => void;
    position?: Position;
    trigger?: Trigger;
    tabIndex?: number;
    interactive?: boolean;
    interactiveBorder?: number;
    delay?: number;
    hideDelay?: number;
    animation?: Animation;
    arrow?: boolean;
    arrowSize?: Size;
    animateFill?: boolean;
    duration?: number;
    hideDuration?: number;
    distance?: number;
    offset?: number;
    hideOnClick?: boolean | 'persistent';
    multiple?: boolean;
    followCursor?: boolean;
    inertia?: boolean;
    transitionFlip?: boolean;
    popperOptions?: any;
    html?: React.ReactElement<any>;
    unmountHTMLWhenHide?: boolean;
    size?: Size;
    sticky?: boolean;
    stickyDuration?: boolean;
    beforeShown?: () => void;
    shown?: () => void;
    beforeHidden?: () => void;
    hidden?: () => void;
    theme?: Theme;
    className?: string;
    style?: React.CSSProperties;
  };

  export class Tooltip extends React.Component<TooltipProps> {}

  export function withTooltip<P>(
    component: React.ComponentType<P>,
    options: TooltipProps,
  ): JSX.Element;
}
