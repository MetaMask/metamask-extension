import React, { Component } from 'react'
import PropTypes from 'prop-types'
import copyToClipboard from 'copy-to-clipboard'
import { base32AddressSlicer } from '../../../helpers/utils/util'
import AddressWarning from '../../ui/address-warning'

import Tooltip from '../../ui/tooltip-v2.js'

class SelectedAccount extends Component {
  state = {
    copied: false,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    selectedBase32Address: PropTypes.string,
    selectedIdentity: PropTypes.object,
  }

  render() {
    const { t } = this.context
    const { selectedBase32Address, selectedIdentity } = this.props

    return (
      <div className="selected-account">
        <Tooltip
          position="bottom"
          html={
            (
<AddressWarning warning={' ' + t('base32AddressNoticeShort')}>
              {this.state.copied
                ? t('copiedExclamation')
                : t('copyToClipboard')}
</AddressWarning>
)
          }
        >
          <div
            className="selected-account__clickable"
            onClick={() => {
              this.setState({ copied: true })
              setTimeout(() => this.setState({ copied: false }), 3000)
              copyToClipboard(selectedBase32Address)
            }}
          >
            <div className="selected-account__name">
              {selectedIdentity.name}
            </div>
            <div className="selected-account__address">
              {base32AddressSlicer(selectedBase32Address)}
            </div>
          </div>
        </Tooltip>
      </div>
    )
  }
}

export default SelectedAccount
