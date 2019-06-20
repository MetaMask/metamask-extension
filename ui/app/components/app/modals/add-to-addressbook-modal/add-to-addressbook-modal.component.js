import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../ui/button/button.component'

export default class AddToAddressBookModal extends Component {

  static contextTypes = {
    t: PropTypes.func,
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
          />
        </div>
        <div className="add-to-address-book-modal__footer">
          <Button type="secondary">{t('cancel')}</Button>
          <Button type="primary">{t('save')}</Button>
        </div>
      </div>
    )
  }
}
