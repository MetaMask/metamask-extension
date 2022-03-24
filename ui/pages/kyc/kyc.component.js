import React, { Component, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import {
  getIsUsingMyAccountForRecipientSearch,
  getRecipient,
  getRecipientUserInput,
  getSendStage,
  initializeSendState,
  resetRecipientInput,
  resetSendState,
  SEND_STAGES,
  updateRecipient,
  updateRecipientUserInput,
} from '../../ducks/send';
import TextField from '../../components/ui/text-field';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import UnitInput from '../../components/ui/unit-input';
import Spinner from '../../components/ui/spinner';
import {
  getStorageItem,
  setStorageItem,
} from '../../helpers/utils/storage-helpers';
import { COUNTRY_LIST } from './kyc.constants';
import FormFooter from './form-footer';
import FormContent from './form-content';
import FormHeader from './form-header';

const kycApiHost = require('../../../kyc.config.json').host;

export default class KycFlowScreen extends Component {
  state = {
    title: 'Account verify',
    userEmail: '',
    userCountry: '',
    ajaxSuccess: false,
    isLoading: false,
    address: '',
    storageKeySubmitted: '',
  };

  componentDidMount() {
    this.updateStorageKey();
  }

  componentDidUpdate() {
    const { currentAddress } = this.props;
    const { address } = this.state;
    if (currentAddress !== address) {
      this.onBack();
    }
  }

  updateStorageKey = () => {
    const { currentAddress: address } = this.props;
    if (this.state.address !== address) {
      const lastStr = address.slice(-7);
      this.setState({
        address,
        storageKeySubmitted: `submitted_${lastStr}`,
      });
    }
  };

  async onSubmit() {
    const email = this.state.userEmail;
    const country = this.state.userCountry;
    const address = this.props.currentAddress;
    const apiUri = `${kycApiHost}/api/v1/user/kyc`;

    try {
      this.setState({
        isLoading: true,
      });
      const res = await window.fetch(apiUri, {
        method: 'POST',
        body: JSON.stringify({
          email,
          country,
          wallet_address: address,
        }),
      });

      console.log('res', res);

      await setStorageItem(this.state.storageKeySubmitted, true);
      this.setState({
        ajaxSuccess: true,
      });
    } catch (e) {}
    this.setState({
      isLoading: false,
    });
  }

  async handleChange(value) {
    const userEmail = value.trim();
    console.log('email', value);
    this.setState({
      userEmail,
    });
  }

  async handleSelectChange(value) {
    console.log('handleSelectChange', value);
    const userCountry = value.trim();
    this.setState({
      userCountry,
    });
  }

  async onBack() {
    const { history } = this.props;

    history.push(DEFAULT_ROUTE);
  }

  render() {
    const { history, clearPendingTokens, mostRecentOverviewPage } = this.props;

    return (
      <div className="page-container" style={{ position: 'relative' }}>
        {this.state.isLoading && (
          <div
            className="kyc-form app-loading-spinner"
            role="alert"
            aria-busy="true"
          >
            <Spinner color="#F7C06C" className="app-loading-spinner__inner" />
          </div>
        )}
        <form>
          <div className="form-header">{this.state.title}</div>
          <label htmlFor="mail">
            <span>E-mail: </span>
            <strong>
              <abbr title="required">*</abbr>
            </strong>
          </label>
          <br />
          <input
            type="email"
            id="mail"
            name="usermail"
            onChange={(e) => this.handleChange(e.target.value)}
            value={this.state.userEmail}
          />
          <br />
          <br />
          <label htmlFor="country">
            <span>country:</span>
            <strong>
              <abbr title="required">*</abbr>
            </strong>
          </label>
          <br />
          <select
            id="country"
            name="usercountry"
            value={this.state.userCountry}
            onChange={(e) => this.handleSelectChange(e.target.value)}
          >
            {COUNTRY_LIST.map(({ value, label }, index) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {this.state.ajaxSuccess ? (
            <div>
              <span>Account verify submit success!</span>
              <br />
              <button type="button" onClick={() => this.onBack()}>
                Finish
              </button>
            </div>
          ) : (
            <div className="form-footer">
              <button type="button" onClick={() => this.onBack()}>
                Cancel
              </button>
              <button type="button" onClick={() => this.onSubmit()}>
                Submit
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }
}
