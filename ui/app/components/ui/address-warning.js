import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class AddressWarning extends PureComponent {
  static propTypes = {
    children: PropTypes.node.isRequired,
    warning: PropTypes.node.isRequired,
  }

  render() {
    const { children, warning } = this.props
    return (
      <div>
        <span style={{ color: 'white' }}>{children}</span>
        <p
          style={{
            color: 'yellow',
            fontWeight: 'bold',
            width: '240px',
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          {warning}
        </p>
      </div>
    )
  }
}
