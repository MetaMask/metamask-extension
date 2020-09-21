import React, { Component } from 'react'
import PropTypes from 'prop-types'
import copyToClipboard from 'copy-to-clipboard'
import { shortenAddress, checksumAddress } from '../../../helpers/utils/util'

import Tooltip from '../../ui/tooltip'

class SelectedAccount extends Component {
  state = {
    copied: false,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    selectedIdentity: PropTypes.object.isRequired,
  }

  render () {
    const { t } = this.context
    const { selectedIdentity } = this.props
    const checksummedAddress = checksumAddress(selectedIdentity.address)

    return (
      <div className="selected-account">
        <Tooltip
          wrapperClassName="selected-account__tooltip-wrapper"
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
              { shortenAddress(checksummedAddress) }
            </div>
          </div>
        </Tooltip>
      </div>
    )
  }
}

export default SelectedAccount
