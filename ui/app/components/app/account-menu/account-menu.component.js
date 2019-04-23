import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash.debounce'
import { Menu, Item, Divider, CloseArea } from '../dropdowns/components/menu'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'
import Tooltip from '../../ui/tooltip'
import Identicon from '../../ui/identicon'
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display'
import { PRIMARY } from '../../../helpers/constants/common'
import {
  SETTINGS_ROUTE,
  ABOUT_US_ROUTE,
  NEW_ACCOUNT_ROUTE,
  IMPORT_ACCOUNT_ROUTE,
  CONNECT_HARDWARE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes'

export default class AccountMenu extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    accounts: PropTypes.object,
    history: PropTypes.object,
    identities: PropTypes.object,
    isAccountMenuOpen: PropTypes.bool,
    prevIsAccountMenuOpen: PropTypes.bool,
    keyrings: PropTypes.array,
    lockMetamask: PropTypes.func,
    selectedAddress: PropTypes.string,
    showAccountDetail: PropTypes.func,
    showRemoveAccountConfirmationModal: PropTypes.func,
    toggleAccountMenu: PropTypes.func,
  }

  state = {
    atAccountListBottom: false,
  }

  componentDidUpdate (prevProps) {
    const { prevIsAccountMenuOpen } = prevProps
    const { isAccountMenuOpen } = this.props

    if (!prevIsAccountMenuOpen && isAccountMenuOpen) {
      this.setAtAccountListBottom()
    }
  }

  renderAccounts () {
    const {
      identities,
      accounts,
      selectedAddress,
      keyrings,
      showAccountDetail,
    } = this.props

    const accountOrder = keyrings.reduce((list, keyring) => list.concat(keyring.accounts), [])

    return accountOrder.filter(address => !!identities[address]).map(address => {
      const identity = identities[address]
      const isSelected = identity.address === selectedAddress

      const balanceValue = accounts[address] ? accounts[address].balance : ''
      const simpleAddress = identity.address.substring(2).toLowerCase()

      const keyring = keyrings.find(kr => {
        return kr.accounts.includes(simpleAddress) || kr.accounts.includes(identity.address)
      })

      return (
        <div
          className="account-menu__account menu__item--clickable"
          onClick={() => {
            this.context.metricsEvent({
              eventOpts: {
                category: 'Navigation',
                action: 'Main Menu',
                name: 'Switched Account',
              },
            })
            showAccountDetail(identity.address)
          }}
          key={identity.address}
        >
          <div className="account-menu__check-mark">
            { isSelected && <div className="account-menu__check-mark-icon" /> }
          </div>
          <Identicon
            address={identity.address}
            diameter={24}
          />
          <div className="account-menu__account-info">
            <div className="account-menu__name">
              { identity.name || '' }
            </div>
            <UserPreferencedCurrencyDisplay
              className="account-menu__balance"
              value={balanceValue}
              type={PRIMARY}
            />
          </div>
          { this.renderKeyringType(keyring) }
          { this.renderRemoveAccount(keyring, identity) }
        </div>
      )
    })
  }

  renderRemoveAccount (keyring, identity) {
    const { t } = this.context
    // Any account that's not from the HD wallet Keyring can be removed
    const { type } = keyring
    const isRemovable = type !== 'HD Key Tree'

    return isRemovable && (
      <Tooltip
        title={t('removeAccount')}
        position="bottom"
      >
        <a
          className="remove-account-icon"
          onClick={e => this.removeAccount(e, identity)}
        />
      </Tooltip>
    )
  }

  removeAccount (e, identity) {
    e.preventDefault()
    e.stopPropagation()
    const { showRemoveAccountConfirmationModal } = this.props
    showRemoveAccountConfirmationModal(identity)
  }

  renderKeyringType (keyring) {
    const { t } = this.context

    // Sometimes keyrings aren't loaded yet
    if (!keyring) {
      return null
    }

    const { type } = keyring
    let label

    switch (type) {
      case 'Trezor Hardware':
      case 'Ledger Hardware':
        label = t('hardware')
        break
      case 'Simple Key Pair':
        label = t('imported')
        break
    }

    return label && (
      <div className="keyring-label allcaps">
        { label }
      </div>
    )
  }

  setAtAccountListBottom = () => {
    const target = document.querySelector('.account-menu__accounts')
    const { scrollTop, offsetHeight, scrollHeight } = target
    const atAccountListBottom = scrollTop + offsetHeight >= scrollHeight
    this.setState({ atAccountListBottom })
  }

  onScroll = debounce(this.setAtAccountListBottom, 25)

  handleScrollDown = e => {
    e.stopPropagation()
    const target = document.querySelector('.account-menu__accounts')
    const { scrollHeight } = target
    target.scroll({ left: 0, top: scrollHeight, behavior: 'smooth' })
    this.setAtAccountListBottom()
  }

  renderScrollButton () {
    const { accounts } = this.props
    const { atAccountListBottom } = this.state

    return !atAccountListBottom && Object.keys(accounts).length > 3 && (
      <div
        className="account-menu__scroll-button"
        onClick={this.handleScrollDown}
      >
        <img
          src="./images/icons/down-arrow.svg"
          width={28}
          height={28}
        />
      </div>
    )
  }

  render () {
    const { t } = this.context
    const {
      isAccountMenuOpen,
      toggleAccountMenu,
      lockMetamask,
      history,
    } = this.props
    const { metricsEvent } = this.context

    return (
      <Menu
        className="account-menu"
        isShowing={isAccountMenuOpen}
      >
        <CloseArea onClick={toggleAccountMenu} />
        <Item className="account-menu__header">
          { t('myAccounts') }
          <button
            className="account-menu__logout-button"
            onClick={() => {
              lockMetamask()
              history.push(DEFAULT_ROUTE)
            }}
          >
            { t('logout') }
          </button>
        </Item>
        <Divider />
        <div className="account-menu__accounts-container">
          <div
            className="account-menu__accounts"
            onScroll={this.onScroll}
          >
            { this.renderAccounts() }
          </div>
          { this.renderScrollButton() }
        </div>
        <Divider />
        <Item
          onClick={() => {
            toggleAccountMenu()
            metricsEvent({
              eventOpts: {
                category: 'Navigation',
                action: 'Main Menu',
                name: 'Clicked Create Account',
              },
            })
            history.push(NEW_ACCOUNT_ROUTE)
          }}
          icon={
            <img
              className="account-menu__item-icon"
              src="images/plus-btn-white.svg"
            />
          }
          text={t('createAccount')}
        />
        <Item
          onClick={() => {
            toggleAccountMenu()
            metricsEvent({
              eventOpts: {
                category: 'Navigation',
                action: 'Main Menu',
                name: 'Clicked Import Account',
              },
            })
            history.push(IMPORT_ACCOUNT_ROUTE)
          }}
          icon={
            <img
              className="account-menu__item-icon"
              src="images/import-account.svg"
            />
          }
          text={t('importAccount')}
        />
        <Item
          onClick={() => {
            toggleAccountMenu()
            metricsEvent({
              eventOpts: {
                category: 'Navigation',
                action: 'Main Menu',
                name: 'Clicked Connect Hardware',
              },
            })
            if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP) {
              global.platform.openExtensionInBrowser(CONNECT_HARDWARE_ROUTE)
            } else {
              history.push(CONNECT_HARDWARE_ROUTE)
            }
          }}
          icon={
            <img
              className="account-menu__item-icon"
              src="images/connect-icon.svg"
            />
          }
          text={t('connectHardwareWallet')}
        />
        <Divider />
        <Item
          onClick={() => {
            toggleAccountMenu()
            history.push(ABOUT_US_ROUTE)
          }}
          icon={
            <img src="images/mm-info-icon.svg" />
          }
          text={t('infoHelp')}
        />
        <Item
          onClick={() => {
            toggleAccountMenu()
            history.push(SETTINGS_ROUTE)
            this.context.metricsEvent({
              eventOpts: {
                category: 'Navigation',
                action: 'Main Menu',
                name: 'Opened Settings',
              },
            })
          }}
          icon={
            <img
              className="account-menu__item-icon"
              src="images/settings.svg"
            />
          }
          text={t('settings')}
        />
      </Menu>
    )
  }
}
