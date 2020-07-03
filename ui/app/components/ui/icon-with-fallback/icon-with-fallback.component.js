import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class IconWithFallback extends PureComponent {
  static propTypes = {
    icon: PropTypes.string,
    name: PropTypes.string,
    size: PropTypes.number.isRequired,
  }

  static defaultProps = {
    name: '',
    icon: null,
  }

  state = {
    iconError: false,
  }

  render () {
    const { icon, name, size } = this.props
    const style = { height: `${size}px`, width: `${size}px` }

    return !this.state.iconError && icon
      ? (
        <img
          onError={() => this.setState({ iconError: true })}
          src={icon}
          style={style}
        />
      )
      : (
        <i className="icon-with-fallback__fallback">
          { name.length ? name.charAt(0).toUpperCase() : '' }
        </i>
      )
  }
}
