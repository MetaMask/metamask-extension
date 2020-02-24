const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const classnames = require('classnames')
const R = require('ramda')

class SimpleDropdown extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isOpen: false,
    }
  }

  getDisplayValue () {
    const { selectedOption, options } = this.props
    const matchesOption = (option) => option.value === selectedOption
    const matchingOption = R.find(matchesOption)(options)
    return matchingOption
      ? matchingOption.displayValue || matchingOption.value
      : selectedOption
  }

  handleClose () {
    this.setState({ isOpen: false })
  }

  toggleOpen () {
    const { isOpen } = this.state
    this.setState({ isOpen: !isOpen })
  }

  renderOptions () {
    const { options, onSelect, selectedOption } = this.props

<<<<<<< HEAD
    return h('div', [
      h('div.simple-dropdown__close-area', {
        onClick: event => {
          event.stopPropagation()
          this.handleClose()
        },
      }),
      h('div.simple-dropdown__options', [
        ...options.map(option => {
          return h(
            'div.simple-dropdown__option',
            {
              className: classnames({
                'simple-dropdown__option--selected': option.value === selectedOption,
              }),
              key: option.value,
              onClick: () => {
=======
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
                'simple-dropdown__option--selected': option.value === selectedOption,
              })}
              key={option.value}
              onClick={(event) => {
                event.stopPropagation()
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
                if (option.value !== selectedOption) {
                  onSelect(option.value)
                }

                this.handleClose()
              },
            },
            option.displayValue || option.value,
          )
        }),
      ]),
    ])
  }

  render () {
    const { placeholder } = this.props
    const { isOpen } = this.state

    return h(
      'div.simple-dropdown',
      {
        onClick: () => this.toggleOpen(),
      },
      [
        h('div.simple-dropdown__selected', this.getDisplayValue() || placeholder || 'Select'),
        h('i.fa.fa-caret-down.fa-lg.simple-dropdown__caret'),
        isOpen && this.renderOptions(),
      ]
    )
  }
}

<<<<<<< HEAD
SimpleDropdown.propTypes = {
  options: PropTypes.array.isRequired,
  placeholder: PropTypes.string,
  onSelect: PropTypes.func,
  selectedOption: PropTypes.string,
}

module.exports = SimpleDropdown
=======
export default SimpleDropdown
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
