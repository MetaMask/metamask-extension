import React, { Component, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
// import Select from 'react-select'
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
// import { getCurrentChainId, isCustomPriceExcessive } from '../../selectors';
// import { getSendHexDataFeatureFlagState } from '../../ducks/metamask/metamask';
// import { showQrScanner } from '../../store/actions';
// import { useMetricEvent } from '../../hooks/useMetricEvent';
// import AddRecipient from './form-content/add-recipient';
// import EnsInput from './form-content/add-recipient/ens-input';
// import EmailInput from './form-content/add-recipient/email-input';
import TextField from '../../components/ui/text-field';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import UnitInput from '../../components/ui/unit-input';
// import AppLoadingSpinner from '../../components/app/app-loading-spinner';
import Spinner from '../../components/ui/spinner';
import {
  getStorageItem,
  setStorageItem,
} from '../../helpers/utils/storage-helpers';
import { COUNTRY_LIST } from './kyc.constants';
import FormFooter from './form-footer';
import FormContent from './form-content';
import FormHeader from './form-header';
// const sendSliceIsCustomPriceExcessive = (state) =>
//   isCustomPriceExcessive(state, true);
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
    // console.log('country:', this.state.userCountry);
    const address = this.props.currentAddress;
    // console.log('window:', window);
    const apiUri = `${kycApiHost}/api/v1/user/kyc`;
    // console.log('apiUri:', apiUri);

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
    // const history = useHistory();
    const {
      // acceptWatchAsset,
      history,
      // mostRecentOverviewPage,
      // rejectWatchAsset,
      // suggestedAssets,
      // tokens,
    } = this.props;

    history.push(DEFAULT_ROUTE);
  }

  // const handleBlur = () => {};
  // const title = 'Account verify';
  render() {
    const { history, clearPendingTokens, mostRecentOverviewPage } = this.props;

    return (
      <div className="page-container" style={{ position: 'relative' }}>
        {/* <AppLoadingSpinner className="cancel-speedup-popover__spinner" /> */}
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
          {/* <TextField
              id="custom-address"
              label='Email'
              type="email"
              value={this.state.userEmail}
              onChange={(e) => this.handleChange(e.target.value)}
              // onChange={(e) => this.handleCustomAddressChange(e.target.value)}
              // error={
              //   customAddressError || mainnetTokenWarning || collectibleAddressError
              // }
              fullWidth
              autoFocus
              margin="normal"
            /> */}
          {/* <UnitInput
              onChange={handleChange}
              onBlur={handleBlur}
              value={userEmail}
            /> */}
          <br />
          <label htmlFor="country">
            <span>country:</span>
            <strong>
              <abbr title="required">*</abbr>
            </strong>
          </label>
          <br />
          {/* <Select
              options={COUNTRY_LIST} /> */}
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

          {/* <div className='form-footer'>
            <button type="button" onClick={() => this.onSubmit()}>Submit</button>
          </div> */}
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
        {/* <FormHeader history={history} />
        <FormContent
          showHexData={showHexData}
          gasIsExcessive={gasIsExcessive}
        />
        <FormFooter key="form-footer" history={history} /> */}
      </div>
    );
  }
  // return (
  //   <div className="page-container">
  //     <form>
  //       <div className="form-header">
  //         {title}
  //       </div>
  //         {/* <label for="mail">
  //           <span>E-mail: </span>
  //           <strong><abbr title="required">*</abbr></strong>
  //         </label> */}
  //         {/* <input
  //           type="email"
  //           id="mail"
  //           name="usermail"
  //           onChange={handleChange}
  //           value={userEmail} /> */}
  //         <TextField
  //           id="custom-address"
  //           label='Email'
  //           type="email"
  //           value={userEmail}
  //           onChange={handleChange}
  //           // onChange={(e) => this.handleCustomAddressChange(e.target.value)}
  //           // error={
  //           //   customAddressError || mainnetTokenWarning || collectibleAddressError
  //           // }
  //           fullWidth
  //           autoFocus
  //           margin="normal"
  //         />
  //         {/* <UnitInput
  //           onChange={handleChange}
  //           onBlur={handleBlur}
  //           value={userEmail}
  //         /> */}
  //         {/* <label for="country">
  //           <span>country:</span>
  //           <strong><abbr title="required">*</abbr></strong>
  //         </label> */}
  //         <select id="country" name="usercountry">
  //           <option value="visa">Visa</option>
  //           <option value="mc">Mastercard</option>
  //           <option value="amex">American Express</option>
  //         </select>
  //       <div className='form-footer'>
  //         <button type="button" onClick={onSubmit}>Submit</button>
  //       </div>
  //     </form>
  //     {/* <FormHeader history={history} />
  //     <FormContent
  //       showHexData={showHexData}
  //       gasIsExcessive={gasIsExcessive}
  //     />
  //     <FormFooter key="form-footer" history={history} /> */}
  //   </div>
  // );
}
