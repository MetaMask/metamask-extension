const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const classnames = require('classnames')

class EditableLabel extends Component {
  constructor (props) {
    super(props)

    this.state = {
      isEditing: false,
      value: props.defaultValue || '',
    }
  }

  handleSubmit () {
    const { value } = this.state

    if (value === '') {
      return
    }

    Promise.resolve(this.props.onSubmit(value))
      .then(() => this.setState({ isEditing: false }))
  }

  saveIfEnter (event) {
    if (event.key === 'Enter') {
      this.handleSubmit()
    }
  }

  renderEditing () {
    const { value } = this.state

    return ([
      h('input.large-input.editable-label__input', {
        type: 'text',
        required: true,
        dir: 'auto',
        value: this.state.value,
        onKeyPress: (event) => {
          if (event.key === 'Enter') {
            this.handleSubmit()
          }
        },
        onChange: event => this.setState({ value: event.target.value }),
        className: classnames({ 'editable-label__input--error': value === '' }),
      }),
      h('div.editable-label__icon-wrapper', [
        h('i.fa.fa-check.editable-label__icon', {
          onClick: () => this.handleSubmit(),
        }),
      ]),
    ])
  }

  renderReadonly () {
    return ([
      h('div.editable-label__value', this.state.value),
      h('div.editable-label__icon-wrapper', [
        h('i.fa.fa-pencil.editable-label__icon', {
          onClick: () => this.setState({ isEditing: true }),
        }),
      ]),
    ])
  }

  render () {
    const { isEditing } = this.state
    const { className } = this.props

    return (
      h('div.editable-label', { className: classnames(className) },
        isEditing
          ? this.renderEditing()
          : this.renderReadonly()
      )
    )
  }
}

EditableLabel.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  defaultValue: PropTypes.string,
  className: PropTypes.string,
}

module.exports = EditableLabel
