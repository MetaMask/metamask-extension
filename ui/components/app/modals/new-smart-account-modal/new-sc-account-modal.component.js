import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ethers } from 'ethers';
import Button from '../../../ui/button/button.component';
import { ButtonIcon, IconName } from '../../../component-library';
import factoryAbi from './MimoWalletFactory.json';

export default class NewSCAccountModal extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    newAccountNumber: PropTypes.number.isRequired,
    onSave: PropTypes.func.isRequired,
  };

  state = {
    alias: this.context.t('newAccountNumberName', [
      this.props.newAccountNumber,
    ]),
    guardians: [],
  };

  onChange = (e) => {
    this.setState({
      alias: e.target.value,
    });
  };

  onSubmit = () => {
    this.props.onSave(this.state.alias).then(this.props.hideModal);
  };

  onKeyPress = async (e) => {
    // create instance of AA account
    const signer = new ethers.Wallet();
    const factory = new ethers.Contract(
      '0x665cf455371e12EA5D49a7bA295cD060f436D95e',
      factoryAbi,
      signer,
    );
    const salt = 123123213;
    await factory.createAccount(signer.address, salt, this.state.guardians);

    if (e.key === 'Enter' && this.state.alias) {
      this.onSubmit();
    }
  };

  render() {
    const { t } = this.context;

    return (
      <div className="new-account-modal">
        <div className="new-account-modal__content">
          <div className="new-account-modal__content__header">
            {t('newAccount')}
            <ButtonIcon
              className="new-account-modal__content__header-close"
              ariaLabel={t('close')}
              onClick={this.props.hideModal}
              iconName={IconName.Close}
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
    );
  }
}
