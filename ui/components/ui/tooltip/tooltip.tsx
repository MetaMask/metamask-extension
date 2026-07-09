import PropTypes from 'prop-types';
import React, { memo, type CSSProperties, type ReactNode } from 'react';
import { Tooltip as ReactTippy, type Position, type Size } from 'react-tippy';

const Tooltip = ({
  arrow = true,
  children = null,
  containerClassName = '',
  html = null,
  interactive,
  onHidden = null,
  distance = 0,
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
  tooltipInnerClassName: _tooltipInnerClassName,
  tooltipArrowClassName: _tooltipArrowClassName,
}: {
  arrow?: boolean;
  children?: ReactNode;
  containerClassName?: string;
  disabled?: boolean;
  html?: ReactNode;
  interactive?: boolean;
  onHidden?: (() => void) | null;
  distance?: number;
  position?: 'top' | 'right' | 'bottom' | 'left' | Position;
  offset?: number;
  open?: boolean;
  size?: Size;
  title?: string | null;
  trigger?: string;
  wrapperClassName?: string;
  theme?: string;
  tag?: keyof JSX.IntrinsicElements | string;
  wrapperStyle?: CSSProperties;
  style?: CSSProperties;
  tabIndex?: number;
  tooltipInnerClassName?: string;
  tooltipArrowClassName?: string;
}) => {
  if (!title && !html) {
    return <div className={wrapperClassName}>{children}</div>;
  }

  const Tag = tag as keyof JSX.IntrinsicElements;

  return React.createElement(
    Tag,
    { className: wrapperClassName, style: wrapperStyle },
    <ReactTippy
      arrow={arrow}
      className={containerClassName}
      disabled={disabled}
      hideOnClick={false}
      distance={distance}
      html={html as React.ReactElement | undefined}
      interactive={interactive}
      onHidden={onHidden ?? undefined}
      position={position}
      size={size}
      offset={offset}
      style={style}
      title={disabled ? '' : (title ?? undefined)}
      trigger={trigger}
      open={open}
      theme={`tippy-tooltip--mm-custom ${theme}`}
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
  tooltipInnerClassName: PropTypes.string,
  tooltipArrowClassName: PropTypes.string,
};

export default memo(Tooltip);
