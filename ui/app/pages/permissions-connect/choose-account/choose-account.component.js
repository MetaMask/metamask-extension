import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes'
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
  }

  static contextTypes = {
    t: PropTypes.func,
  };

  renderAccountsList = () => {
    const { accounts, selectAccount, nativeCurrency } = this.props
    return (
      <div className="permissions-connect-choose-account__accounts-list">
        {
          accounts.map(account => {
            const { address, addressLabel, lastConnectedDate, balance } = account
            return (<div
              onClick={ () => selectAccount(address) }
              className="permissions-connect-choose-account__account"
            >
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
              { lastConnectedDate
                ? <div className="permissions-connect-choose-account__account__last-connected">{ lastConnectedDate }</div>
                : null
              }
            </div>)
          })
        }
      </div>
    )
  }

  render () {
    const { originName, selectNewAccountViaModal } = this.props
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
        <div
          onClick={ () => selectNewAccountViaModal() }
          className="permissions-connect-choose-account__new-account"
        >
          { t('newAccount') }
        </div>
      </div>
    )
  }
}
