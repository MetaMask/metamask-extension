import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Tooltip as ReactTippy } from 'react-tippy';

export default class Tooltip extends PureComponent {
  static defaultProps = {
    arrow: true,
    children: null,
    containerClassName: '',
    html: null,
    interactive: undefined,
    onHidden: null,
    position: 'left',
    offset: 0,
    open: undefined,
    size: 'small',
    title: null,
    trigger: 'mouseenter focus',
    wrapperClassName: undefined,
    theme: '',
    tag: 'div',
  };

  static propTypes = {
    arrow: PropTypes.bool,
    children: PropTypes.node,
    containerClassName: PropTypes.string,
    disabled: PropTypes.bool,
    html: PropTypes.node,
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
    theme: PropTypes.string,
    tabIndex: PropTypes.number,
    tag: PropTypes.string,
  };

  render() {
    const {
      arrow,
      children,
      containerClassName,
      disabled,
      position,
      html,
      interactive,
      size,
      title,
      trigger,
      onHidden,
      offset,
      open,
      wrapperClassName,
      style,
      theme,
      tabIndex,
      tag,
    } = this.props;

    if (!title && !html) {
      return <div className={wrapperClassName}>{children}</div>;
    }

    return React.createElement(
      tag,
      { className: wrapperClassName },
      <ReactTippy
        arrow={arrow}
        className={containerClassName}
        disabled={disabled}
        hideOnClick={false}
        html={html}
        interactive={interactive}
        onHidden={onHidden}
        position={position}
        size={size}
        offset={offset}
        style={style}
        title={disabled ? '' : title}
        trigger={trigger}
        open={open}
        theme={`tippy-tooltip--mm-custom ${theme}`} // Required for correct theming
        tabIndex={tabIndex || 0}
        tag={tag}
      >
        {children}
      </ReactTippy>,
    );
  }
}
