import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default class ButtonGroup extends PureComponent {
  static propTypes = {
    defaultActiveButtonIndex: PropTypes.number,
    noButtonActiveByDefault: PropTypes.bool,
    disabled: PropTypes.bool,
    children: PropTypes.array,
    className: PropTypes.string,
    style: PropTypes.object,
    newActiveButtonIndex: PropTypes.number,
  }

  static defaultProps = {
    className: 'button-group',
    defaultActiveButtonIndex: 0,
  }

  state = {
    activeButtonIndex: this.props.noButtonActiveByDefault
      ? null
      : this.props.defaultActiveButtonIndex,
  }

  componentDidUpdate (_, prevState) {
    // Provides an API for dynamically updating the activeButtonIndex
    if (typeof this.props.newActiveButtonIndex === 'number' && prevState.activeButtonIndex !== this.props.newActiveButtonIndex) {
      this.setState({ activeButtonIndex: this.props.newActiveButtonIndex })
    }
  }

  handleButtonClick (activeButtonIndex) {
    this.setState({ activeButtonIndex })
  }

  renderButtons () {
    const { children, disabled } = this.props

    return React.Children.map(children, (child, index) => {
      return child && (
        <button
          className={classnames(
            'button-group__button',
            { 'button-group__button--active': index === this.state.activeButtonIndex },
          )}
          onClick={() => {
            this.handleButtonClick(index)
            child.props.onClick && child.props.onClick()
          }}
          disabled={disabled || child.props.disabled}
          key={index}
        >
          { child.props.children }
        </button>
      )
    })
  }

  render () {
    const { className, style } = this.props

    return (
      <div
        className={className}
        style={style}
      >
        { this.renderButtons() }
      </div>
    )
  }
}
