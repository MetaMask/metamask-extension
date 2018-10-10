import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default class ButtonGroup extends PureComponent {
  static propTypes = {
    defaultActiveButtonIndex: PropTypes.number,
    disabled: PropTypes.bool,
    children: PropTypes.array,
    className: PropTypes.string,
    style: PropTypes.object,
  }

  static defaultProps = {
    className: 'button-group',
  }

  state = {
    activeButtonIndex: this.props.defaultActiveButtonIndex || 0,
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
