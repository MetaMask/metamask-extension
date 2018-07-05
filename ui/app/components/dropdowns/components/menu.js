import React, {Component} from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'


export class Menu extends Component {

  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]),
    isShowing: PropTypes.bool,
  };

  static defaultProps = {
    className: '',
  };

  render () {
    const { className, children, isShowing } = this.props
    return isShowing
      ? <div className={classnames('menu', className)}>{children}</div>
      : <noscript/>
  }

}

export class Item extends Component {

  static propTypes = {
    className: PropTypes.string,
    icon: PropTypes.object,
    text: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]),
  };

  static defaultProps = {
    className: '',
  };

  render () {
    const {
      icon,
      children,
      text,
      className,
      onClick,
    } = this.props

    return (
      <div
        className={classnames(className, 'menu__item', {
          'menu__item--clickable': onClick,
        })}
        onClick={onClick}>
        {children || [
          icon ? <div className={'menu__item__icon'} key={'icon'}>{icon}</div> : null,
          text ? <div className={'menu__item__text'} key={'text'}>{text}</div> : null,
        ].filter(Boolean)}
      </div>
    )
  }

}

export class Divider extends Component {

  render () {
    return (
      <div className={'menu__divider'}/>
    )
  }

}

export class CloseArea extends Component {

  static propTypes = {
    onClick: PropTypes.func,
  };

  render () {
    const {
      onClick,
    } = this.props

    return (
      <div className={'menu__close-area'} onClick={onClick}/>
    )
  }

}
