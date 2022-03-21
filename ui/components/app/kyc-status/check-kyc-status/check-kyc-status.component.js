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
const ipfsUri = require('../../../../../kyc.config.json').ipfs;

function isVerified(kycInfo) {
  return kycInfo.status === true && kycInfo.urlStatus.urlMatch === true;
}

export default class CheckKycStatus extends Component {
  static propTypes = {
    currentAddress: PropTypes.string.isRequired,
  };

  state = {
    isLoading: false,
    kycStatus: false,
    address: '',
    storageKeySubmitted: '',
    // cid
    storageKeyHash: '',
    hash: '',
  };

  componentDidMount() {
    // this.props.initializeEnsSlice();
    this.updateAddress(this.props.currentAddress);
  }

  componentDidUpdate() {
    this.updateAddress(this.props.currentAddress);
  }

  updateAddress = (address) => {
    if (address !== this.state.address) {
      const lastStr = address.slice(-7);
      this.setState(
        {
          address,
          storageKeySubmitted: `submitted_${lastStr}`,
          storageKeyHash: `hash_${lastStr}`,
        },
        this.handleCheckKycStatus,
      );
    }
  };

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

  // clearStorage = async (storageKey) => {
  //   await setStorageItem(storageKey, false);
  //   await this.handleCheckKycStatus();
  // };

  checkKycStatusIpfs = async (cid) => {
    const apiUri = `${ipfsUri}/${cid}`;
    const response = await window.fetch(apiUri, {
      method: 'GET',
      mode: 'cors',
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Network response was not ok.');
  };

  handleCheckKycStatus = async () => {
    // console.log('handleCheckKycStatus');
    let isLoading = true;
    this.setState({ isLoading });
    const { storageKeySubmitted, storageKeyHash } = this.state;
    let { kycStatus } = this.state;
    const { currentAddress, selectedAccount, getPrivateKey } = this.props;

    const hash = await getStorageItem(storageKeyHash);
    if (hash) {
      try {
        const kycInfo = await this.checkKycStatusIpfs(hash);
        if (isVerified(kycInfo)) {
          this.setState({
            kycStatus: 'Verified',
            isLoading: false,
          });
          return;
        }
      } catch (error) {
        console.log(`check IPFS error: ${error.message}`);
      }
    }

    // if no hash
    const apiUri = `${kycApiHost}/api/v1/user/kyc/${currentAddress}`;
    const response = await window.fetch(apiUri, {
      method: 'GET',
      mode: 'cors',
    });
    const kycInfo = await response.json();
    if (kycInfo.status) {
      const message = JSON.stringify(kycInfo);
      const privateKey = await getPrivateKey(currentAddress);
      const signer = await this.doSignMessage(privateKey, message);

      kycInfo.signer = signer;
      const cid = await this.signKycMessage(currentAddress, kycInfo);
      if (cid) {
        await setStorageItem(storageKeyHash, cid);
        try {
          const kycInfoIpfs = await this.checkKycStatusIpfs(cid);
          if (isVerified(kycInfoIpfs)) {
            kycStatus = 'Verified';
            await setStorageItem(storageKeySubmitted, false);
          }
        } catch (error) {
          console.log(`check IPFS error: ${error.message}`);
        }
      } else {
        kycStatus = 'Pending';
      }
      isLoading = false;
      this.setState({ kycStatus, isLoading });
      return;
    }

    // const { status, filestatus } = kycInfo

    // if (status === true && filestatus === 'verified') {
    const isSubmitted = await getStorageItem(storageKeySubmitted);
    // console.log('handleCheckKycStatus', isSubmitted);
    if (isSubmitted === true) {
      isLoading = false;
      kycStatus = 'Submitted';
      this.setState({ kycStatus, isLoading });
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
    const apiUri = `${kycApiHost}/api/v1/user/sign_message`;
    const response = await window.fetch(apiUri, {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify(message),
    });

    const result = await response.json();
    return result.cid || null;
  };

  render() {
    // const { t } = this.context;
    // const { className, selectedAddress, selectedName, userInput } = this.props;

    // const hasSelectedAddress = Boolean(selectedAddress);
    const { isLoading } = this.state;
    const { kycStatus } = this.state;
    let statusBlock;
    if (kycStatus === false) {
      statusBlock = (
        <div>
          <Button
            disabled={isLoading === true}
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
      );
    } else {
      statusBlock = (
        <div style={{ fontSize: '.75rem' }}>
          {kycStatus}
          {kycStatus === 'Verified' && (
            <i
              className="fas fa-check-circle"
              style={{ color: 'green', marginLeft: '4px' }}
            ></i>
          )}
          {/* test */}
          {/* {kycStatus === 'Submitted' && (
            <Button
              onClick={this.clearStorage.bind(
                this,
                this.state.storageKeySubmitted,
              )}
              type="link"
              rounded={false}
            >
              Clear submitted
            </Button>
          )} */}
        </div>
      );
    }

    return (
      <div className="">
        {this.state.isLoading ? (
          <Spinner color="#F7C06C" className="app-loading-spinner__inner" />
        ) : (
          <div>{statusBlock}</div>
        )}
      </div>
    );
  }
}
