import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { isValidDomainName } from '../../../../helpers/utils/util';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../../shared/modules/hexstring-utils';
import { KYC_FLOW } from '../../../../helpers/constants/routes';
import Spinner from '../../../ui/spinner';
import Button from '../../../ui/button';
import {
  getStorageItem,
  setStorageItem,
} from '../../../../helpers/utils/storage-helpers';
// import { getPrivateKey } from '../../../../store/actions';
// store.dispatch(actions.signMsg(msgParams));
const ethUtil = require('ethereumjs-util');
const kycApiHost = require('../../../../../kyc.config.json').host;

export default class CheckKycStatus extends Component {
  state = {
    isLoading: false,
    kycStatus: false,
    localStorageKey: 'is-kyc-submitted',
  };

  componentDidMount() {
    // this.props.initializeEnsSlice();
    this.handleCheckKycStatus();
  }

  // onPaste = (event) => {
  //   if (event.clipboardData.items?.length) {
  //     const clipboardItem = event.clipboardData.items[0];
  //     clipboardItem?.getAsString((text) => {
  //       const input = text.trim();
  //       if (
  //         !isBurnAddress(input) &&
  //         isValidHexAddress(input, { mixedCaseUseChecksum: true })
  //       ) {
  //         this.props.onPaste(input);
  //       }
  //     });
  //   }
  // };

  // onChange = ({ target: { value } }) => {
  //   const {
  //     onValidAddressTyped,
  //     internalSearch,
  //     onChange,
  //     lookupEnsName,
  //     resetEnsResolution,
  //   } = this.props;
  //   const input = value.trim();

  //   onChange(input);
  //   if (internalSearch) {
  //     return null;
  //   }
  //   // Empty ENS state if input is empty
  //   // maybe scan ENS
  //   if (isValidDomainName(input)) {
  //     lookupEnsName(input);
  //   } else {
  //     resetEnsResolution();
  //     if (
  //       onValidAddressTyped &&
  //       !isBurnAddress(input) &&
  //       isValidHexAddress(input, { mixedCaseUseChecksum: true })
  //     ) {
  //       onValidAddressTyped(input);
  //     }
  //   }

  //   return null;
  // };
  handleVerifyButtonClick = async () => {
    const { history } = this.props;
    history.push(KYC_FLOW);
  };

  handleCheckKycStatus = async () => {
    console.log('handleCheckKycStatus');
    let isLoading = true;
    this.setState({ isLoading });
    // console.log(this.state)
    let { kycStatus, localStorageKey } = this.state;
    const { currentAddress, selectedAccount, getPrivateKey } = this.props;

    // const apiUri = `${kycApiHost}/api/v1/user/kyc/${currentAddress}`;

    // const response = await window.fetch(apiUri, {
    //   method: 'GET',
    //   mode: 'cors',
    // });

    // const kycInfo = await response.json();
    // console.log('res', kycInfo);

    // const { status, filestatus } = kycInfo

    // if (status === true && filestatus === 'verified') {
    const isSubmitted = await getStorageItem(this.state.localStorageKey);
    console.log('handleCheckKycStatus', isSubmitted);
    if (isSubmitted === true) {
      isLoading = false;
      kycStatus = 'Submitted';
      this.setState({ kycStatus, isLoading });
      // TODO: check kyc status from api response
      // TODO: if api response === verified
      //       need to clean storage item
      return;
    }

    if (kycStatus === false) {
      isLoading = false;
      kycStatus = false;
      this.setState({ kycStatus, isLoading });
      return;
    }
    isLoading = false;
    this.setState({ kycStatus, isLoading });
    return;

    const message = JSON.stringify(kycInfo);
    const privateKey = await getPrivateKey(currentAddress);
    const signer = await this.doSignMessage(privateKey, message);

    kycInfo.signer = signer;
    await this.signKycMessage(currentAddress, kycInfo);
    isLoading = false;
    kycStatus = 'Pending';
    this.setState({ kycStatus, isLoading });
  };

  doSignMessage = async (key, message) => {
    const data = ethUtil.fromUtf8(message);
    const signMessage = ethUtil.toBuffer(data);
    const messageHash = ethUtil.hashPersonalMessage(signMessage);
    const privateKeyHex = new Buffer.from(key, 'hex');
    const signer = ethUtil.ecsign(messageHash, privateKeyHex);
    const signerHash = ethUtil
      .toRpcSig(signer.v, signer.r, signer.s)
      .toString('hex');
    return signerHash;
  };

  signKycMessage = async (address, message) => {
    // TODO: sign kyc message api
    const apiUri = `${kycApiHost}/api/v1/user/sign_message`;
    // const headers = { 'Content-Type': 'application/json' }
    // const response = await axios.post(path, message, { headers: headers })
    const response = await window.fetch(apiUri, {
      method: 'POST',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    console.log('signKycMessage response', response);
  };

  render() {
    // const { t } = this.context;
    // const { className, selectedAddress, selectedName, userInput } = this.props;

    // const hasSelectedAddress = Boolean(selectedAddress);

    return (
      <div className="">
        {this.state.isLoading ? (
          <Spinner color="#F7C06C" className="app-loading-spinner__inner" />
        ) : this.state.kycStatus === false ? (
          <div>
            <Button
              disabled={this.state.isLoading === true}
              onClick={this.handleVerifyButtonClick}
              type="secondary"
              rounded={false}
              // className="invalid-custom-network-alert__footer-row-button"
            >
              Verify
            </Button>
            {/* <button
              type="button"
              className=""
              onClick={this.handleVerifyButtonClick}
            >Verify</button> */}
          </div>
        ) : (
          <div style={{ fontSize: '.75rem' }}>
            {this.state.kycStatus}
            {this.state.kycStatus === 'Verified' && (
              <i className="fas fa-check-circle" style={{ color: 'green' }}></i>
            )}
          </div>
        )}
      </div>
    );
  }
}
