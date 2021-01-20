import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
// import {
//   hexToBase32,
//   isValidHexAddress,
// } from '../../../../../../app/scripts/cip37'

export default class SignatureRequestMessage extends PureComponent {
  static propTypes = {
    data: PropTypes.object.isRequired,
    // network: PropTypes.number.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    // hoveredHexAddress: false
  }

  renderNode(data) {
    // const { hoveredHexAddress } = this.state
    // const { network } = this.props
    return (
      <div className="signature-request-message--node">
        {Object.entries(data).map(([label, value], i) => {
          if (value === true || value === false) {
            value = value.toString()
          }
          const isLeaf = typeof value !== 'object' || value === null
          /* const isAddress = isLeaf && isValidHexAddress(value) */
          /* const showBase32Address = isAddress && hoveredHexAddress */
          return (
            <div
              className={classnames('signature-request-message--node', {
                'signature-request-message--node-leaf': isLeaf,
              })}
              key={i}
            >
              <span className="signature-request-message--node-label">
                {label}:{' '}
              </span>
              {typeof value === 'object' && value !== null ? (
                this.renderNode(value)
              ) : (
                <span
                  className={classnames(
                    'signature-request-message--node-value'
                    /* { 'is-address': isAddress } */
                  )}
                  /* onMouseOver={() => this.setState({ hoveredHexAddress: true })} */
                  /* onMouseLeave={() => */
                  /*   this.setState({ hoveredHexAddress: false }) */
                  /* } */
                >
                  {value}
                  {/* showBase32Address ? hexToBase32(value, network) : value */}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  render() {
    const { data } = this.props

    return (
      <div className="signature-request-message">
        <div className="signature-request-message__title">
          {this.context.t('signatureRequest1')}
        </div>
        <div className="signature-request-message--root">
          <div className="signature-request-message__type-title">
            {this.context.t('signatureRequest1')}
          </div>
          {this.renderNode(data)}
        </div>
      </div>
    )
  }
}
