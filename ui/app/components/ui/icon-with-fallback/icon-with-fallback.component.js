import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class IconWithFallback extends PureComponent {
  static propTypes = {
    icon: PropTypes.string,
    name: PropTypes.string,
  }

  static defaultProps = {
    name: '',
    icon: null,
  }

  state = {
    iconError: false,
  }

  render () {
    const { icon, name } = this.props

    return (
      <div className="icon-with-fallback__identicon-container">
        <div className="icon-with-fallback__identicon-border" />
        { !this.state.iconError && icon
          ? (
            <img
              className="icon-with-fallback__identicon"
              src={icon}
              onError={() => this.setState({ iconError: true })}
            />
          )
          : (
            <i className="icon-with-fallback__identicon--default">
              { name.length ? name.charAt(0).toUpperCase() : '' }
            </i>
          )
        }
      </div>
    )
  }
}
