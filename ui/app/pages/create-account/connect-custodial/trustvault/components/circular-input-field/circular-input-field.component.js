import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default class CircularInputField extends PureComponent {
  static propTypes = {
    handleChange: PropTypes.func,
    autoFocus: PropTypes.bool,
    setRef: PropTypes.func,
    filled: PropTypes.func,
    maxLength: PropTypes.number,
    keyPress: PropTypes.func,
  }

  render () {
    return (
      <div>
        <input
          className={classnames(
            'circle-input',
            'circular-input',
            'inline-block-child',
            {
              'background-filled': this.props.filled(),
              'background-empty': !this.props.filled(),
            }
          )}
          maxLength={this.props.maxLength.toString()}
          type="password"
          onChange={this.props.handleChange}
          autoFocus={this.props.autoFocus}
          ref={this.props.setRef}
          onKeyPress={this.props.keyPress}
        />
      </div>
    )
  }
}
