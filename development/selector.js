<<<<<<< HEAD
const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
=======
import PropTypes from 'prop-types'
import React, { Component } from 'react'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

module.exports = NewComponent

<<<<<<< HEAD
inherits(NewComponent, Component)
function NewComponent () {
  Component.call(this)
}

NewComponent.prototype.render = function () {
  const props = this.props
  const {
    states,
    selectedKey,
    actions,
    store,
    modifyBackgroundConnection,
    backGroundConnectionModifiers,
  } = props

  const state = this.state || {}
  const selected = state.selected || selectedKey

  return h('select', {
    style: {
      margin: '20px 20px 0px',
    },
    value: selected,
    onChange: (event) => {
      const selectedKey = event.target.value
      const backgroundConnectionModifier = backGroundConnectionModifiers[selectedKey]
      modifyBackgroundConnection(backgroundConnectionModifier || {})
      store.dispatch(actions.update(selectedKey))
      this.setState({ selected: selectedKey })
    },
  }, Object.keys(states).map((stateName) => {
    return h('option', { value: stateName }, stateName)
  }))

=======
  render () {
    const {
      states,
      selectedKey,
      updateState,
      store,
      modifyBackgroundConnection,
      backGroundConnectionModifiers,
    } = this.props
    const selected = this.state.selected || selectedKey

    return (
      <select
        style={{ margin: '20px 20px 0px' }}
        value={selected}
        onChange={(event) => {
          const selectedKey = event.target.value
          const backgroundConnectionModifier = backGroundConnectionModifiers[selectedKey]
          modifyBackgroundConnection(backgroundConnectionModifier || {})
          store.dispatch(updateState(selectedKey))
          this.setState({ selected: selectedKey })
        }}
      >
        {Object.keys(states).map((stateName, index) => {
          return (
            <option key={index} value={stateName}>
              {stateName}
            </option>
          )
        })}
      </select>
    )
  }
}

Selector.propTypes = {
  states: PropTypes.object.isRequired,
  selectedKey: PropTypes.string.isRequired,
  updateState: PropTypes.func.isRequired,
  store: PropTypes.object.isRequired,
  modifyBackgroundConnection: PropTypes.func.isRequired,
  backGroundConnectionModifiers: PropTypes.object.isRequired,
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
}
