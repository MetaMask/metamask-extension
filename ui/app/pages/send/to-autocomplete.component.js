import React, {Component} from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import AccountListItem from './account-list-item/account-list-item.component'


export default class ToAutoComplete extends Component {

  static propTypes = {
    dropdownOpen: PropTypes.bool,
    openDropdown: PropTypes.func,
    closeDropdown: PropTypes.func,
    onChange: PropTypes.func,
    to: PropTypes.string,
    accounts: PropTypes.array,
    inError: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    accountsToRender: [],
  }

  getListItemIcon (listItemAddress, toAddress) {
    return toAddress && listItemAddress === toAddress
      ? <i className={'fa fa-check fa-lg'}
        style={{
          color: '#02c9b1',
        }}
      />
      : null
  }

  renderDropdown () {
    const {
      closeDropdown,
      onChange,
      to,
    } = this.props
    const {accountsToRender} = this.state

    if (!accountsToRender.length) {
      return null
    }

    return (
      <div>
        <div className={'send-v2__from-dropdown__close-area'} onClick={closeDropdown} />
        <div className={'send-v2__from-dropdown__list'}>
          {accountsToRender.map((account, i) => (
            <AccountListItem
              key={i}
              account={account}
              className={'account-list-item__dropdown'}
              handleClick={() => {
                onChange(account.address)
                closeDropdown()
              }}
              icon={this.getListItemIcon(account.address, to)}
              displayBalance={false}
              displayAddress={true}
            />
          ))}
        </div>
      </div>
    )
  }

  handleInputEvent (event = {}, cb) {
    const {
      to,
      accounts,
      closeDropdown,
      openDropdown,
    } = this.props

    const matchingAccounts = accounts.filter(({address}) => address.match(to || ''))
    const matches = matchingAccounts.length

    if (!matches || matchingAccounts[0].address === to) {
      this.setState({accountsToRender: []})
      event.target && event.target.select()
      closeDropdown()
    } else {
      this.setState({accountsToRender: matchingAccounts})
      openDropdown()
    }
    cb && cb(event.target.value)
  }

  componentDidUpdate (nextProps) {
    if (this.props.to !== nextProps.to) {
      this.handleInputEvent()
    }
  }

  render () {
    const {
      to,
      dropdownOpen,
      onChange,
      inError,
    } = this.props

    return (
      <div className={'send-v2__to-autocomplete'}>
        <input
          className={classnames('send-v2__to-autocomplete__input', {
            'send-v2__error-border': inError,
          })}
          placeholder={this.context.t('recipientAddress')}
          value={to}
          onChange={event => onChange(event.target.value)}
          onFocus={event => this.handleInputEvent(event)}
          style={{
            borderColor: inError ? 'red' : null,
          }}
        />
        {
          to
            ? null
            : <i className={'fa fa-caret-down fa-lg send-v2__to-autocomplete__down-caret'}
              onClick={() => this.handleInputEvent()}
              style={{
                style: {color: '#dedede'},
              }}
            />
        }
        {
          dropdownOpen
            ? this.renderDropdown()
            : null
        }
      </div>
    )
  }

}
