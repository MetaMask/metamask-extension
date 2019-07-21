import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class SignatureRequestMessage extends PureComponent {
  static propTypes = {
    data: PropTypes.object.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  makeNode (node) {
    const leaves = []

    for (const [key, value] of Object.entries(node)) {
      leaves.push([ key, value ])
    }

    return leaves
  }

  renderNode (data) {
    return (
      <div className="signature-request-message--node">
        {this.makeNode(data).map(([ label, value ], i) => (
          <div className="signature-request-message--node" key={i}>
            <span className="signature-request-message--node-label">{label}: </span>
            {
              typeof value === 'object' && value !== null ?
                this.renderNode(value)
                : <span className="signature-request-message--node-value">{value}</span>
            }
          </div>
        ))}
      </div>
    )
  }


  render () {
    const { data } = this.props

    return (
      <div className="signature-request-message">
        <h2>{this.context.t('signatureRequest1')}</h2>
        <div className="signature-request-message--root">
          <p className="signature-request-message--type">{this.context.t('signatureRequest1')}</p>
          {this.renderNode(data)}
        </div>
      </div>
    )
  }
}
