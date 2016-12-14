const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const findDOMNode = require('react-dom').findDOMNode

module.exports = EditableLabel

inherits(EditableLabel, Component)
function EditableLabel () {
  Component.call(this)
}

EditableLabel.prototype.render = function () {
  return h('div.name-label', {
    contentEditable: true,
    style: { outline: 'none' },
    onInput: (event) => this.saveText(),
  }, this.props.children)
}

EditableLabel.prototype.saveText = function () {
  var text = findDOMNode(this).textContent.trim()
  var truncatedText = text.substring(0, 20)
  this.props.saveText(truncatedText)
  this.setState({ isEditingLabel: false, textLabel: truncatedText })
}
