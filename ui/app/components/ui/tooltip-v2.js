import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { Tooltip as ReactTippy } from 'react-tippy'

export default class Tooltip extends PureComponent {
  static defaultProps = {
    arrow: true,
    children: null,
    containerClassName: '',
    html: null,
    onHidden: null,
    position: 'left',
    size: 'small',
    title: null,
    trigger: 'mouseenter',
    wrapperClassName: '',
  }

  static propTypes = {
    arrow: PropTypes.bool,
    children: PropTypes.node,
    containerClassName: PropTypes.string,
    disabled: PropTypes.bool,
    html: PropTypes.node,
    onHidden: PropTypes.func,
    position: PropTypes.oneOf([
      'top',
      'right',
      'bottom',
      'left',
    ]),
    size: PropTypes.oneOf([
      'small', 'regular', 'big',
    ]),
    title: PropTypes.string,
    trigger: PropTypes.any,
    wrapperClassName: PropTypes.string,
    style: PropTypes.object,
  }

  render () {
    const { arrow, children, containerClassName, disabled, position, html, size, title, trigger, onHidden, wrapperClassName, style } = this.props

    if (!title && !html) {
      return (
        <div className={wrapperClassName}>
          {children}
        </div>
      )
    }

    return (
      <div className={wrapperClassName}>
        <ReactTippy
          html={html}
          className={containerClassName}
          disabled={disabled}
          title={title}
          position={position}
          trigger={trigger}
          hideOnClick={false}
          size={size}
          arrow={arrow}
          onHidden={onHidden}
          style={style}
        >
          {children}
        </ReactTippy>
      </div>
    )
  }
}
