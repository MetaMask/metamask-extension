import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../ui/button/button.component'

export default class AddToAddressBookModal extends Component {
  render () {
    return (
      <div className="add-to-address-book-modal">
        <div className="add-to-address-book-modal__content">
          <div className="add-to-address-book-modal__content__header">
            Add to adress book
          </div>
          <div className="add-to-address-book-modal__input-label">
            Enter an alias
          </div>
          <input
            type="text"
            className="add-to-address-book-modal__input"
            placeholder="e.g. John D."
          />
        </div>
        <div className="add-to-address-book-modal__footer">
          <Button type="secondary">Cancel</Button>
          <Button type="primary">Save</Button>
        </div>
      </div>
    )
  }
}
