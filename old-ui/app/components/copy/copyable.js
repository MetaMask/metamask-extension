import React from 'react'
import CopyComponent from './copy-component'

class Copyable extends CopyComponent {

  render () {
    const { value, children } = this.props
    const { copied } = this.state

    const message = copied ? 'Copied!' : 'Copy'
    const position = 'bottom'
    const tooltipChild = (
      <span
        style={{
          cursor: 'pointer',
        }}
        onClick={(event) => this.onClick(event, value)}
      >{children}
      </span>
    )

    return (
      this.renderTooltip(message, position, tooltipChild)
    )
  }

}

module.exports = Copyable
