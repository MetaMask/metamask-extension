// Copied and cleaned type definitions for the 'react-tippy' module.
declare module 'react-tippy' {
  import * as React from 'react';

  // --- Core Utility Types ---

  /** Defines the supported placement positions for the tooltip. */
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

  /** Defines the events that trigger the tooltip visibility. */
  export type Trigger = 'mouseenter' | 'focus' | 'click' | 'manual';

  /** Defines the supported entrance/exit animations. */
  export type Animation = 'shift' | 'perspective' | 'fade' | 'scale' | 'none';

  /** Defines the supported size variants for arrow and tooltip. */
  export type Size = 'small' | 'regular' | 'big';

  /** Defines the supported visual themes for the tooltip. */
  export type Theme = 'dark' | 'light' | 'transparent';

  // --- Main Props Definition ---

  /**
   * Represents the props accepted by the Tooltip component.
   * Note: popperOptions type is simplified to object if external Popper types are unavailable.
   */
  export type TooltipProps = {
    // Content and State
    title?: string;
    disabled?: boolean;
    open?: boolean;
    useContext?: boolean;
    onRequestClose?: () => void;

    // Positioning and Triggers
    position?: Position;
    trigger?: Trigger;
    tabIndex?: number;
    interactive?: boolean;
    interactiveBorder?: number;
    distance?: number;
    offset?: number;
    hideOnClick?: boolean | 'persistent';
    multiple?: boolean;
    followCursor?: boolean;
    inertia?: boolean;
    transitionFlip?: boolean;

    // Timing and Animation
    delay?: number;
    hideDelay?: number;
    animation?: Animation;
    duration?: number;
    hideDuration?: number;
    animateFill?: boolean;

    // Appearance and Styling
    arrow?: boolean;
    arrowSize?: Size;
    theme?: Theme;
    size?: Size;
    className?: string;
    style?: React.CSSProperties;

    // Advanced / Custom Content
    // HTML content to display inside the tooltip (instead of 'title').
    // Using ReactNode is generally safer and more flexible than ReactElement<any>.
    html?: React.ReactNode; 
    unmountHTMLWhenHide?: boolean;

    // Popper Configuration (Use unknown for better type safety than 'any')
    // Requires importing specific Popper.js/Popper.js Core types for full safety.
    popperOptions?: Record<string, unknown>; 

    // Sticky Behavior
    sticky?: boolean;
    stickyDuration?: boolean; // Typically takes a number (duration in ms), 'boolean' might be a shorthand.

    // Lifecycle Callbacks
    beforeShown?: () => void;
    shown?: () => void;
    beforeHidden?: () => void;
    hidden?: () => void;
  };

  /**
   * The main Tooltip component.
   */
  export class Tooltip extends React.Component<TooltipProps> {}

  /**
   * A Higher-Order Component (HOC) that wraps a component to add tooltip functionality.
   * It returns a new component type with injected props (P) and TooltipProps.
   * @template P - The props of the wrapped component.
   * @param component - The component to be wrapped.
   * @param options - The TooltipProps configuration.
   * @returns A new React ComponentType.
   */
  export function withTooltip<P>(
    component: React.ComponentType<P>,
    options: TooltipProps,
  ): React.ComponentType<P>;
}
