import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class Selector extends Component {
  state = {}

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
}
