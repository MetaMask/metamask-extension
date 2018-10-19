import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import {Tooltip as ReactTippy} from 'react-tippy'

export default class Tooltip extends PureComponent {
  static defaultProps = {
    arrow: true,
    children: null,
    containerClassName: '',
    hideOnClick: false,
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
  }

  render () {
    const {arrow, children, containerClassName, position, size, title, trigger, onHidden, wrapperClassName } = this.props

    if (!title) {
      return (
        <div className={wrapperClassName}>
          {children}
        </div>
      )
    }

    return (
      <div className={wrapperClassName}>
        <ReactTippy
          className={containerClassName}
          title={title}
          position={position}
          trigger={trigger}
          hideOnClick={false}
          size={size}
          arrow={arrow}
          onHidden={onHidden}
        >
          {children}
        </ReactTippy>
      </div>
    )
  }
}
