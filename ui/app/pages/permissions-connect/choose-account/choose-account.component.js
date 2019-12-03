import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Identicon from '../../../components/ui/identicon'
import { PRIMARY } from '../../../helpers/constants/common'
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display'

export default class ChooseAccount extends Component {
  static propTypes = {
    accounts: PropTypes.arrayOf(PropTypes.shape({
      address: PropTypes.string,
      addressLabel: PropTypes.string,
      lastConnectedDate: PropTypes.string,
      balance: PropTypes.string,
    })).isRequired,
    originName: PropTypes.string.isRequired,
    selectAccount: PropTypes.func.isRequired,
    selectNewAccountViaModal: PropTypes.func.isRequired,
    nativeCurrency: PropTypes.string.isRequired,
    addressLastConnectedMap: PropTypes.object,
    cancelPermissionsRequest: PropTypes.func.isRequired,
    permissionsRequestId: PropTypes.string.isRequired,
  }

  static defaultProps = {
    addressLastConnectedMap: {},
  }

  static contextTypes = {
    t: PropTypes.func,
  };

  renderAccountsList = () => {
    const { accounts, selectAccount, nativeCurrency, addressLastConnectedMap } = this.props
    return (
      <div className="permissions-connect-choose-account__accounts-list">
        {
          accounts.map((account, index) => {
            const { address, addressLabel, balance } = account
            return (
              <div
                key={`permissions-connect-choose-account-${index}`}
                onClick={ () => selectAccount(address) }
                className="permissions-connect-choose-account__account"
              >
                <div className="permissions-connect-choose-account__account-info-wrapper">
                  <Identicon
                    diameter={34}
                    address={address}
                  />
                  <div className="permissions-connect-choose-account__account__info">
                    <div className="permissions-connect-choose-account__account__label">{ addressLabel }</div>
                    <UserPreferencedCurrencyDisplay
                      className="permissions-connect-choose-account__account__balance"
                      type={PRIMARY}
                      value={balance}
                      style={{ color: '#6A737D' }}
                      suffix={nativeCurrency}
                      hideLabel
                    />
                  </div>
                </div>
                { addressLastConnectedMap[address]
                  ? (
                    <div className="permissions-connect-choose-account__account__last-connected">
                      <span>{ this.context.t('lastConnected') }</span>
                      { addressLastConnectedMap[address] }
                    </div>
                  )
                  : null
                }
              </div>
            )
          })
        }
      </div>
    )
  }

  render () {
    const { originName, selectNewAccountViaModal, permissionsRequestId, cancelPermissionsRequest } = this.props
    const { t } = this.context
    return (
      <div className="permissions-connect-choose-account">
        <div className="permissions-connect-choose-account__title">
          { t('chooseAnAcount') }
        </div>
        <div className="permissions-connect-choose-account__text">
          { t('toConnectWith', [originName]) }
        </div>
        { this.renderAccountsList() }
        <div className="permissions-connect-choose-account__bottom-buttons">
          <div
            onClick={ () => cancelPermissionsRequest(permissionsRequestId) }
            className="permissions-connect-choose-account__cancel"
          >
            { t('cancel') }
          </div>
          <div
            onClick={ () => selectNewAccountViaModal() }
            className="permissions-connect-choose-account__new-account"
          >
            { t('newAccount') }
          </div>
        </div>
      </div>
    )
  }
}
