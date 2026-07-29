import PropTypes from 'prop-types';
import React, {
  memo,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Tooltip as ReactTippy,
  type Position,
  type Size,
  type Theme,
  type Trigger,
} from 'react-tippy';

const resolveTooltipTitle = ({
  html,
  disabled,
  title,
}: {
  html: ReactNode;
  disabled?: boolean;
  title?: string | null;
}): string | null => {
  if (disabled) {
    return '';
  }

  if (html) {
    return title ?? null;
  }

  return title ?? '';
};

const Tooltip = ({
  arrow = true,
  children = null,
  containerClassName = '',
  html = null,
  interactive,
  onHidden = null,
  distance = 0,
  delay = 0,
  duration = 0,
  position = 'left',
  offset = 0,
  open,
  size = 'small',
  title = null,
  trigger = 'mouseenter focus',
  wrapperClassName,
  theme = '',
  tag = 'div',
  wrapperStyle = {},
  disabled,
  style,
  tabIndex,
  tooltipInnerClassName,
  tooltipArrowClassName,
  onShown = null,
}: {
  arrow?: boolean;
  children?: ReactNode;
  containerClassName?: string;
  disabled?: boolean;
  html?: ReactNode;
  interactive?: boolean;
  onHidden?: (() => void) | null;
  distance?: number;
  delay?: number;
  duration?: number;
  position?: 'top' | 'right' | 'bottom' | 'left' | Position;
  offset?: number;
  open?: boolean;
  size?: Size;
  title?: string | null;
  trigger?: Trigger;
  wrapperClassName?: string;
  theme?: Theme;
  tag?: keyof JSX.IntrinsicElements | string;
  wrapperStyle?: CSSProperties;
  style?: CSSProperties;
  tabIndex?: number;
  tooltipInnerClassName?: string;
  tooltipArrowClassName?: string;
  onShown?: ((...args: unknown[]) => void) | null;
}) => {
  const handleShown = useCallback(
    (instance?: { popper?: Element }) => {
      if (instance?.popper) {
        if (tooltipInnerClassName) {
          instance.popper
            .querySelector('.tippy-tooltip-content')
            ?.classList.add(tooltipInnerClassName);
        }

        if (tooltipArrowClassName) {
          instance.popper
            .querySelector('[x-arrow]')
            ?.classList.add(tooltipArrowClassName);
        }
      }

      onShown?.(instance);
    },
    [onShown, tooltipArrowClassName, tooltipInnerClassName],
  );

  if (!title && !html) {
    return <div className={wrapperClassName}>{children}</div>;
  }

  const Tag = tag as keyof JSX.IntrinsicElements;
  const resolvedTitle = resolveTooltipTitle({ html, disabled, title });

  return React.createElement(
    Tag,
    { className: wrapperClassName, style: wrapperStyle },
    <ReactTippy
      arrow={arrow}
      className={containerClassName}
      disabled={disabled}
      hideOnClick={false}
      distance={distance}
      delay={delay}
      duration={duration}
      html={html as React.ReactElement | undefined}
      interactive={interactive}
      onHidden={onHidden ?? undefined}
      onShown={handleShown}
      position={position}
      size={size}
      offset={offset}
      style={style}
      title={resolvedTitle}
      trigger={trigger}
      open={open}
      theme={`tippy-tooltip--mm-custom ${theme}` as Theme}
      tabIndex={tabIndex || 0}
    >
      {children}
    </ReactTippy>,
  );
};

Tooltip.propTypes = {
  arrow: PropTypes.bool,
  children: PropTypes.node,
  containerClassName: PropTypes.string,
  disabled: PropTypes.bool,
  html: PropTypes.node,
  distance: PropTypes.number,
  interactive: PropTypes.bool,
  offset: PropTypes.number,
  onHidden: PropTypes.func,
  open: PropTypes.bool,
  position: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
  size: PropTypes.oneOf(['small', 'regular', 'big']),
  title: PropTypes.string,
  trigger: PropTypes.any,
  wrapperClassName: PropTypes.string,
  style: PropTypes.object,
  wrapperStyle: PropTypes.object,
  theme: PropTypes.string,
  tabIndex: PropTypes.number,
  tag: PropTypes.string,
  onShown: PropTypes.func,
  tooltipInnerClassName: PropTypes.string,
  tooltipArrowClassName: PropTypes.string,
};

export default memo(Tooltip);
