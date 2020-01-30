import React, { Component } from 'react'
import PropTypes from 'prop-types'
import copyToClipboard from 'copy-to-clipboard'
import { addressSlicer, checksumAddress } from '../../../helpers/utils/util'

const Tooltip = require('../../ui/tooltip-v2.js').default

class SelectedAccount extends Component {
  state = {
    copied: false,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    selectedAddress: PropTypes.string,
    selectedIdentity: PropTypes.object,
    network: PropTypes.string,
  }

  render () {
    const { t } = this.context
    const { selectedAddress, selectedIdentity, network } = this.props
    const checksummedAddress = checksumAddress(selectedAddress, network)

    return (
      <div className="selected-account">
        <Tooltip
          position="bottom"
          title={this.state.copied ? t('copiedExclamation') : t('copyToClipboard')}
        >
          <div
            className="selected-account__clickable"
            onClick={() => {
              this.setState({ copied: true })
              setTimeout(() => this.setState({ copied: false }), 3000)
              copyToClipboard(checksummedAddress)
            }}
          >
            <div className="selected-account__name">
              { selectedIdentity.name }
            </div>
            <div className="selected-account__address">
              { addressSlicer(checksummedAddress) }
            </div>
          </div>
        </Tooltip>
      </div>
    )
  }
}

export default SelectedAccount
