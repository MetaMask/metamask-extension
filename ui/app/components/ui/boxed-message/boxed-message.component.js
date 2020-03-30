import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class BoxedMessage extends PureComponent {
  static propTypes = {
    boxClass: PropTypes.string,
    iconSource: PropTypes.string,
    iconSize: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.node,
  }

  static defaultProps = {
    iconSize: '14px',
    iconSource: null,
    boxClass: '',
    style: {},
  }

  render () {
    const {
      iconSize,
      iconSource,
      style,
      boxClass,
      children,
    } = this.props

    return (
      <div
        className={`boxed-message__container ${boxClass}`}
        style={style}
      >
        { iconSource ? (
          <img
            src={iconSource}
            className="boxed-message__icon"
            style={{
              height: iconSize,
              width: iconSize,
            }}
          />
        ) : null }
        <div className="boxed-message__message">{ children }</div>
      </div>
    )
  }
}
