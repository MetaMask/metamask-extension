import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

class EditableLabel extends Component {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    defaultValue: PropTypes.string,
    className: PropTypes.string,
  }

  state = {
    isEditing: false,
    value: this.props.defaultValue || '',
  }

  handleSubmit() {
    const { value } = this.state

    if (value === '') {
      return
    }

    Promise.resolve(this.props.onSubmit(value)).then(() =>
      this.setState({ isEditing: false }),
    )
  }

  renderEditing() {
    const { value } = this.state

    return [
      <input
        key={1}
        type="text"
        required
        dir="auto"
        value={this.state.value}
        onKeyPress={(event) => {
          if (event.key === 'Enter') {
            this.handleSubmit()
          }
        }}
        onChange={(event) => this.setState({ value: event.target.value })}
        className={classnames('large-input', 'editable-label__input', {
          'editable-label__input--error': value === '',
        })}
      />,
      <div className="editable-label__icon-wrapper" key={2}>
        <i
          className="fa fa-check editable-label__icon"
          onClick={() => this.handleSubmit()}
        />
      </div>,
    ]
  }

  renderReadonly() {
    return [
      <div key={1} className="editable-label__value">
        {this.state.value}
      </div>,
      <div key={2} className="editable-label__icon-wrapper">
        <i
          className="fas fa-pencil-alt editable-label__icon"
          onClick={() => this.setState({ isEditing: true })}
        />
      </div>,
    ]
  }

  render() {
    const { isEditing } = this.state
    const { className } = this.props

    return (
      <div className={classnames('editable-label', className)}>
        {isEditing ? this.renderEditing() : this.renderReadonly()}
      </div>
    )
  }
}

export default EditableLabel
