import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import AccountDetails from '../account-details'

import { checksumAddress } from '../../../helpers/utils/util'
import AssetList from '../asset-list'
import { CONNECTED_ROUTE } from '../../../helpers/constants/routes'

export default class WalletView extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static defaultProps = {
    responsiveDisplayClassname: '',
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
    identities: PropTypes.object.isRequired,
    keyrings: PropTypes.array.isRequired,
    responsiveDisplayClassname: PropTypes.string,
    selectedAddress: PropTypes.string.isRequired,
  }

  showConnectedSites = () => {
    const { history } = this.props
    history.push(CONNECTED_ROUTE)
  }

  render () {
    const {
      identities,
      keyrings,
      responsiveDisplayClassname,
      selectedAddress,
    } = this.props

    const checksummedAddress = checksumAddress(selectedAddress)

    const keyring = keyrings.find((kr) => {
      return kr.accounts.includes(selectedAddress)
    })

    let label = ''
    let type
    if (keyring) {
      type = keyring.type
      if (type !== 'HD Key Tree') {
        if (type.toLowerCase().search('hardware') !== -1) {
          label = this.context.t('hardware')
        } else {
          label = this.context.t('imported')
        }
      }
    }

    return (
      <div className={classnames('wallet-view', 'flex-column', responsiveDisplayClassname)}>
        <AccountDetails
          label={label}
          checksummedAddress={checksummedAddress}
          name={identities[selectedAddress].name}
          showConnectedSites={this.showConnectedSites}
        />
        <AssetList />
      </div>
    )
  }
}
