import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../ui/button/button.component'

export default class NewAccountModal extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    newAccountNumber: PropTypes.number.isRequired,
    onSave: PropTypes.func.isRequired,
  }

  state = {
    alias: this.context.t('newAccountNumberName', [
      this.props.newAccountNumber,
    ]),
  }

  onChange = (e) => {
    this.setState({
      alias: e.target.value,
    })
  }

  onSubmit = () => {
    this.props.onSave(this.state.alias).then(this.props.hideModal)
  }

  onKeyPress = (e) => {
    if (e.key === 'Enter' && this.state.alias) {
      this.onSubmit()
    }
  }

  render() {
    const { t } = this.context

    return (
      <div className="new-account-modal">
        <div className="new-account-modal__content">
          <div className="new-account-modal__content__header">
            {t('newAccount')}
            <button
              className="fas fa-times new-account-modal__content__header-close"
              title={t('close')}
              onClick={this.props.hideModal}
            />
          </div>
          <div className="new-account-modal__input-label">
            {t('accountName')}
          </div>
          <input
            type="text"
            className="new-account-modal__input"
            onChange={this.onChange}
            onKeyPress={this.onKeyPress}
            value={this.state.alias}
            autoFocus
          />
        </div>
        <div className="new-account-modal__footer">
          <Button type="secondary" onClick={this.props.hideModal}>
            {t('cancel')}
          </Button>
          <Button
            type="primary"
            onClick={this.onSubmit}
            disabled={!this.state.alias}
          >
            {t('save')}
          </Button>
        </div>
      </div>
    )
  }
}
