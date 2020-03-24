import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class BoxedMessage extends PureComponent {
  static propTypes = {
    boxClass: PropTypes.string,
    iconSource: PropTypes.string,
    iconSize: PropTypes.string,
    height: PropTypes.string,
    width: PropTypes.string,
    children: PropTypes.node,
  }

  static defaultProps = {
    height: 'auto',
    width: '100%',
    iconSize: '14px',
    iconSource: null,
    boxClass: '',
  }

  render () {
    const {
      iconSize,
      iconSource,
      height,
      width,
      boxClass,
      children,
    } = this.props

    return (
      <div
        className={`boxed-message__container ${boxClass}`}
        style={{
          height,
          width,
        }}
      >
        { iconSource ? (
          <img
            src={iconSource}
            className="circle-icon__icon"
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
