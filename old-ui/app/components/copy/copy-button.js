import React from 'react'
import classNames from 'classnames'
import CopyComponent from './copy-component'

class CopyButton extends CopyComponent {

  // As parameters, accepts:
  // "value", which is the value to copy (mandatory)
  // "title", which is the text to show on hover (optional, defaults to 'Copy')
  render () {
    const { value, display, title, style, isWhite, tooltipPosition } = this.props
    const { copied } = this.state

    const message = copied ? 'Copied' : title || ' Copy '
    const defaultCopyStyles = ['clipboard', 'cursor-pointer']
    const originalStyle = {
      display: display || 'flex',
      alignItems: 'center',
    }
    const fullStyle = Object.assign(originalStyle, style)

    const tooltipChild = (
      <i
        style={{
          marginLeft: '5px',
        }}
        className={classNames(defaultCopyStyles, {white: isWhite})}
        onClick={(event) => this.onClick(event, value)}
      />
    )

    return (
        <div className="copy-button"
          style={fullStyle}
          data-tip
          data-for="copyButton"
        >
          {this.renderTooltip(message, tooltipPosition, tooltipChild, 'copyButton')}
        </div>
    )
  }
}

module.exports = CopyButton
