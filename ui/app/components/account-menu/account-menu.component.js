import React, {Component} from 'react'
import PropTypes from 'prop-types'
import { Menu, Item, Divider, CloseArea } from '../dropdowns/components/menu'
import Identicon from '../identicon'
import { formatBalance } from '../../util'
import {
  SETTINGS_ROUTE,
  INFO_ROUTE,
  NEW_ACCOUNT_ROUTE,
  IMPORT_ACCOUNT_ROUTE,
  DEFAULT_ROUTE,
} from '../../routes'


export default class AccountMenu extends Component {

  static propTypes = {
    isAccountMenuOpen: PropTypes.bool,
    toggleAccountMenu: PropTypes.func,
    lockMetamask: PropTypes.func,
    history: PropTypes.object,
    identities: PropTypes.object,
    accounts: PropTypes.object,
    selectedAddress: PropTypes.string,
    keyrings: PropTypes.array,
    showAccountDetail: PropTypes.func,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const {
      isAccountMenuOpen,
      toggleAccountMenu,
      lockMetamask,
      history,
    } = this.props

    return (
      <Menu className={'account-menu'} isShowing={isAccountMenuOpen}>
        <CloseArea onClick={toggleAccountMenu}/>
        <Item className={'account-menu__header'}>
          {this.context.t('myAccounts')}
          <button
            className={'account-menu__logout-button'}
            onClick={() => {
              lockMetamask()
              history.push(DEFAULT_ROUTE)
            }}
          >
            {this.context.t('logout')}
          </button>
        </Item>
        <Divider/>
        <div className={'account-menu__accounts'}>
          {this.renderAccounts()}
        </div>
        <Divider/>
        <Item
          onClick={() => {
            toggleAccountMenu()
            history.push(NEW_ACCOUNT_ROUTE)
          }}
          text={this.context.t('createAccount')}
          icon={<img className={'account-menu__item-icon'} src={'images/plus-btn-white.svg'}/>}
        />
        <Item
          onClick={() => {
            toggleAccountMenu()
            history.push(IMPORT_ACCOUNT_ROUTE)
          }}
          text={this.context.t('importAccount')}
          icon={<img className={'account-menu__item-icon'} src={'images/import-account.svg'}/>}
        />
        <Divider/>
        <Item
          onClick={() => {
            toggleAccountMenu()
            history.push(INFO_ROUTE)
          }}
          text={this.context.t('infoHelp')}
          icon={<img className={'account-menu__item-icon'} src={'images/mm-info-icon.svg'}/>}
        />
        <Item
          onClick={() => {
            toggleAccountMenu()
            history.push(SETTINGS_ROUTE)
          }}
          text={this.context.t('settings')}
          icon={<img className={'account-menu__item-icon'} src={'images/settings.svg'}/>}
        />
      </Menu>
    )
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
    return accountOrder.map(address => {
      const identity = identities[address]
      const isSelected = identity.address === selectedAddress

      const balanceValue = accounts[address] ? accounts[address].balance : ''
      const formattedBalance = balanceValue ? formatBalance(balanceValue, 6) : '...'
      const simpleAddress = identity.address.substring(2).toLowerCase()

      const keyring = keyrings.find(kr => {
        return kr.accounts.includes(simpleAddress) ||
          kr.accounts.includes(identity.address)
      })

      return (
        <div
          key={address}
          className={'account-menu__account menu__item--clickable'}
          onClick={() => showAccountDetail(identity.address)}
        >
          <div className={'account-menu__check-mark'}>
            {
              isSelected
              ? <div className={'account-menu__check-mark-icon'}/>
              : null
            }
          </div>
          <Identicon address={identity.address} diameter={24}/>
          <div className={'account-menu__account-info'}>
            <div className={'account-menu__name'}>
              {identity.name || ''}
            </div>
            <div className={'account-menu__balance'}>
              {formattedBalance}
            </div>
          </div>
          {this.indicateIfLoose(keyring)}
        </div>
      )
    })
  }

  indicateIfLoose (keyring) {
    try { // Sometimes keyrings aren't loaded yet:
      const type = keyring.type
      const isLoose = type !== 'HD Key Tree'
      return isLoose
        ? <div className={'keyring-label allcaps'}>{this.context.t('imported')}</div>
        : null
    } catch (e) {
    }
  }

}
