import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

class SimpleDropdown extends Component {
  static propTypes = {
    options: PropTypes.array.isRequired,
    placeholder: PropTypes.string,
    onSelect: PropTypes.func,
    selectedOption: PropTypes.string,
  }

  state = {
    isOpen: false,
  }

  getDisplayValue() {
    const { selectedOption, options } = this.props
    const matchesOption = (option) => option.value === selectedOption
    const matchingOption = options.find(matchesOption)
    return matchingOption
      ? matchingOption.displayValue || matchingOption.value
      : selectedOption
  }

  handleClose() {
    this.setState({ isOpen: false })
  }

  toggleOpen() {
    this.setState((prevState) => ({
      isOpen: !prevState.isOpen,
    }))
  }

  renderOptions() {
    const { options, onSelect, selectedOption } = this.props

    return (
      <div>
        <div
          className="simple-dropdown__close-area"
          onClick={(event) => {
            event.stopPropagation()
            this.handleClose()
          }}
        />
        <div className="simple-dropdown__options">
          {options.map((option) => (
            <div
              className={classnames('simple-dropdown__option', {
                'simple-dropdown__option--selected':
                  option.value === selectedOption,
              })}
              key={option.value}
              onClick={(event) => {
                event.stopPropagation()
                if (option.value !== selectedOption) {
                  onSelect(option.value)
                }

                this.handleClose()
              }}
            >
              {option.displayValue || option.value}
            </div>
          ))}
        </div>
      </div>
    )
  }

  render() {
    const { placeholder } = this.props
    const { isOpen } = this.state

    return (
      <div className="simple-dropdown" onClick={() => this.toggleOpen()}>
        <div className="simple-dropdown__selected">
          {this.getDisplayValue() || placeholder || 'Select'}
        </div>
        <i className="fa fa-caret-down fa-lg simple-dropdown__caret" />
        {isOpen && this.renderOptions()}
      </div>
    )
  }
}

export default SimpleDropdown
