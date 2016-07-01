const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = NewComponent

inherits(NewComponent, Component)
function NewComponent () {
  Component.call(this)
}

NewComponent.prototype.render = function () {
  const props = this.props
  let { states, selectedKey, actions, store } = props

  const state = this.state || {}
  const selected = state.selected || selectedKey

  return h('select', {
    value: selected,
    onChange:(event) => {
      const selectedKey = event.target.value
      store.dispatch(actions.update(selectedKey))
      this.setState({ selected: selectedKey })
    },
  }, Object.keys(states).map((stateName) => {
    return h('option', { value: stateName }, stateName)
  }))

}
