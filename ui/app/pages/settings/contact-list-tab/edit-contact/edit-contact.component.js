import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../../components/ui/identicon'
import Button from '../../../../components/ui/button/button.component'
import TextField from '../../../../components/ui/text-field'
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer'
import {
  base32ToHex,
  isValidBase32Address,
} from '../../../../../../app/scripts/cip37'

export default class EditContact extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    network: PropTypes.number,
    addToAddressBook: PropTypes.func,
    removeFromAddressBook: PropTypes.func,
    history: PropTypes.object,
    name: PropTypes.string,
    address: PropTypes.string,
    base32Address: PropTypes.string,
    chainId: PropTypes.string,
    memo: PropTypes.string,
    viewRoute: PropTypes.string,
    listRoute: PropTypes.string,
    setAccountLabel: PropTypes.func,
    showingMyAccounts: PropTypes.bool,
  }

  static defaultProps = {
    name: '',
    address: '',
    memo: '',
  }

  state = {
    newName: this.props.name,
    newBase32Address: this.props.base32Address,
    newMemo: this.props.memo,
    error: '',
  }

  render() {
    const { t } = this.context
    const {
      history,
      name,
      addToAddressBook,
      removeFromAddressBook,
      address,
      base32Address,
      chainId,
      memo,
      viewRoute,
      listRoute,
      setAccountLabel,
      showingMyAccounts,
      network,
    } = this.props

    return (
      <div className="settings-page__content-row address-book__edit-contact">
        <div className="settings-page__header address-book__header--edit">
          <Identicon address={address} diameter={60} />
          {!showingMyAccounts && (
            <Button
              type="link"
              className="settings-page__address-book-button"
              onClick={() => {
                removeFromAddressBook(chainId, address)
                history.push(listRoute)
              }}
            >
              {t('deleteAccount')}
            </Button>
          )}
        </div>
        <div className="address-book__edit-contact__content">
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              {t('userName')}
            </div>
            <TextField
              type="text"
              id="nickname"
              placeholder={this.context.t('addAlias')}
              value={this.state.newName}
              onChange={e => this.setState({ newName: e.target.value })}
              fullWidth
              margin="dense"
            />
          </div>

          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              {t('ethereumPublicAddress')}
            </div>
            <TextField
              type="text"
              id="address"
              value={this.state.newBase32Address}
              error={this.state.error}
              onChange={e =>
                this.setState({ newBase32Address: e.target.value })
              }
              fullWidth
              margin="dense"
            />
          </div>

          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label--capitalized">
              {t('memo')}
            </div>
            <TextField
              type="text"
              id="memo"
              placeholder={memo}
              value={this.state.newMemo}
              onChange={e => this.setState({ newMemo: e.target.value })}
              fullWidth
              margin="dense"
              multiline
              rows={3}
              classes={{
                inputMultiline: 'address-book__view-contact__text-area',
                inputRoot: 'address-book__view-contact__text-area-wrapper',
              }}
            />
          </div>
        </div>
        <PageContainerFooter
          cancelText={this.context.t('cancel')}
          onSubmit={() => {
            if (
              this.state.newBase32Address !== '' &&
              this.state.newBase32Address !== base32Address
            ) {
              // if the user makes a valid change to the address field, remove the original address
              if (isValidBase32Address(this.state.newBase32Address, network)) {
                const hexAddress = base32ToHex(this.state.newBase32Address)
                removeFromAddressBook(chainId, hexAddress)
                addToAddressBook(
                  hexAddress,
                  this.state.newName || name,
                  this.state.newMemo || memo
                )
                setAccountLabel(hexAddress, this.state.newName || name)
                history.push(listRoute)
              } else {
                this.setState({ error: this.context.t('invalidAddress') })
              }
            } else {
              // update name
              addToAddressBook(
                address,
                this.state.newName || name,
                this.state.newMemo || memo
              )
              setAccountLabel(address, this.state.newName || name)
              history.push(listRoute)
            }
          }}
          onCancel={() => {
            history.push(`${viewRoute}/${address}`)
          }}
          submitText={this.context.t('save')}
          submitButtonType="confirm"
        />
      </div>
    )
  }
}
