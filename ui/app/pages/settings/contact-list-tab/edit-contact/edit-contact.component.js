import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../../components/ui/identicon'
import Button from '../../../../components/ui/button/button.component'
import TextField from '../../../../components/ui/text-field'
import { isValidAddress } from '../../../../helpers/utils/util'
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer'

export default class EditContact extends PureComponent {

  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    addToAddressBook: PropTypes.func,
    removeFromAddressBook: PropTypes.func,
    history: PropTypes.object,
    name: PropTypes.string,
    address: PropTypes.string,
    memo: PropTypes.string,
    viewRoute: PropTypes.string,
    listRoute: PropTypes.string,
    setAccountLabel: PropTypes.func,
  }

  state = {
    newName: '',
    newAddress: '',
    newMemo: '',
    error: '',
  }

  render () {
    const { t } = this.context
    const { history, name, addToAddressBook, removeFromAddressBook, address, memo, viewRoute, listRoute, setAccountLabel } = this.props

    return (
      <div className="settings-page__content-row address-book__edit-contact">
        <div className="settings-page__header address-book__header--edit">
          <Identicon address={address} diameter={60}/>
          <Button
            type="link"
            className="settings-page__address-book-button"
            onClick={() => {
              removeFromAddressBook(address)
              history.push(listRoute)
            }}
          >
            {t('deleteAccount')}
          </Button>
        </div>
        <div className="address-book__edit-contact__content">
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              { t('userName') }
            </div>
            <TextField
              type="text"
              id="nickname"
              placeholder={this.context.t('addAlias')}
              value={this.state.newName || name}
              onChange={e => this.setState({ newName: e.target.value })}
              fullWidth
              margin="dense"
            />
          </div>

          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              { t('ethereumPublicAddress') }
            </div>
            <TextField
              type="text"
              id="address"
              placeholder={address}
              value={this.state.newAddress || address}
              error={this.state.error}
              onChange={e => this.setState({ newAddress: e.target.value })}
              fullWidth
              margin="dense"
            />
          </div>

          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label--capitalized">
              { t('memo') }
            </div>
            <TextField
              type="text"
              id="memo"
              placeholder={memo}
              value={this.state.newMemo || memo}
              onChange={e => this.setState({ newMemo: e.target.value })}
              fullWidth
              margin="dense"
              multiline={true}
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
            if (this.state.newAddress !== '' && this.state.newAddress !== address) {
              // if the user makes a valid change to the address field, remove the original address
              if (isValidAddress(this.state.newAddress)) {
                removeFromAddressBook(address)
                addToAddressBook(this.state.newAddress, this.state.newName || name, this.state.newMemo || memo)
                setAccountLabel(this.state.newAddress, this.state.newName || name)
                history.push(listRoute)
              } else {
                this.setState({ error: 'invalid address' })
              }
            } else {
              // update name
              addToAddressBook(address, this.state.newName || name, this.state.newMemo || memo)
              setAccountLabel(address, this.state.newName || name)
              history.push(listRoute)
            }
          }}
          onCancel={() => {
            history.push(`${viewRoute}/${address}`)
          }}
          submitText={this.context.t('save')}
          submitButtonType={'confirm'}
        />
      </div>
    )
  }
}
