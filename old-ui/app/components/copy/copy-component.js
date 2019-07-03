import React, { Component } from 'react'
import PropTypes from 'prop-types'
import copyToClipboard from 'copy-to-clipboard'
import Tooltip from '../tooltip'

class CopyComponent extends Component {
  constructor (props) {
    super(props)
    this.timerID = null
    this.state = {
      copied: false,
    }
  }

  static propTypes = {
    style: PropTypes.object,
    tooltipPosition: PropTypes.oneOf(['left', 'right', 'top', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight']),
  }

  onClick (event, value) {
    event.preventDefault()
    event.stopPropagation()
    copyToClipboard(value)
    this.debounceRestore()
  }

  componentWillUnmount () {
    clearTimeout(this.timerID)
  }

  renderTooltip (message, position, children, id) {
    return (
      <Tooltip
        title={message}
        position={position}
        id={id}
      >
      {children}
      </Tooltip>
    )
  }

  debounceRestore () {
    this.setState({ copied: true })
    clearTimeout(this.timerID)
    this.timerID = setTimeout(() => {
      this.setState({ copied: false })
    }, 850)
  }
}

module.exports = CopyComponent
