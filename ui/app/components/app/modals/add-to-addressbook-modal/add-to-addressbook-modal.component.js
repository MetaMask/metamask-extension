import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../ui/button/button.component'

export default class AddToAddressBookModal extends Component {

  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    addToAddressBook: PropTypes.func.isRequired,
    recipient: PropTypes.string.isRequired,
  }

  state = {
    alias: null,
  }

  onSave = () => {
    const { recipient, addToAddressBook, hideModal } = this.props
    addToAddressBook(recipient, this.state.alias)
    hideModal()
  }

  render () {
    const { t } = this.context

    return (
      <div className="add-to-address-book-modal">
        <div className="add-to-address-book-modal__content">
          <div className="add-to-address-book-modal__content__header">
            {t('addToAddressBook')}
          </div>
          <div className="add-to-address-book-modal__input-label">
            {t('enterAnAlias')}
          </div>
          <input
            type="text"
            className="add-to-address-book-modal__input"
            placeholder={t('addToAddressBookModalPlaceholder')}
            onChange={e => this.setState({ alias: e.target.value })}
            value={this.state.alias}
          />
        </div>
        <div className="add-to-address-book-modal__footer">
          <Button
            type="secondary"
            onClick={this.props.hideModal}
          >
            {t('cancel')}
          </Button>
          <Button
            type="primary"
            onClick={this.onSave}
            disabled={!this.state.alias}
          >
            {t('save')}
          </Button>
        </div>
      </div>
    )
  }
}
