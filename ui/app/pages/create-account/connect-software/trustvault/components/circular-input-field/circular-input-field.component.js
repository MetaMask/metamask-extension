import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const CLASSNAME_CIRCULAR_INPUT = 'circular-input'
const CLASSNAME_INLINE_BLOCK = 'inline-block-child'
const CLASSNAME_BACKGROUND_FILLED = 'background-filled'
const CLASSNAME_BACKGROUND_EMPTY = 'background-empty'

export default class CircularInputField extends PureComponent {
  static propTypes = {
    handleChange: PropTypes.func,
    autoFocus: PropTypes.bool,
    setRef: PropTypes.func,
    filled: PropTypes.func,
    maxLength: PropTypes.number,
  }

  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div>
        <input
          className={classnames(
            "circle-input",
            CLASSNAME_CIRCULAR_INPUT,
            CLASSNAME_INLINE_BLOCK,
            this.props.filled()
              ? CLASSNAME_BACKGROUND_FILLED
              : CLASSNAME_BACKGROUND_EMPTY
          )}
          maxLength={this.props.maxLength.toString()}
          type="password"
          onChange={this.props.handleChange}
          autoFocus={this.props.autoFocus}
          ref={this.props.setRef}
          onKeyPress={this.props.keyPress}
        ></input>
      </div>
    )
  }
}
