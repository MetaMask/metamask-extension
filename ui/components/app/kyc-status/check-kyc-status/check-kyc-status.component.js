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

  handleVerifyButtonClick = async () => {
    const { history } = this.props;
    history.push(KYC_FLOW);
  };

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
    let isLoading = true;
    this.setState({ isLoading });
    const { storageKeySubmitted, storageKeyHash } = this.state;
    let kycStatus = false;
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
          >
            Verify
          </Button>
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
