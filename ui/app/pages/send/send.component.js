import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ethUtil from 'ethereumjs-util';
import { debounce } from 'lodash';
import {
  getAmountErrorObject,
  getGasFeeErrorObject,
  getToAddressForGasUpdate,
  doesAmountErrorRequireUpdate,
} from './send.utils';
import {
  getToWarningObject,
  getToErrorObject,
} from './send-content/add-recipient/add-recipient';
import SendHeader from './send-header';
import AddRecipient from './send-content/add-recipient';
import SendContent from './send-content';
import SendFooter from './send-footer';
import EnsInput from './send-content/add-recipient/ens-input';
import {
  INVALID_RECIPIENT_ADDRESS_ERROR,
  KNOWN_RECIPIENT_ADDRESS_ERROR,
  CONTRACT_ADDRESS_ERROR,
} from './send.constants';

export default class SendTransactionScreen extends Component {
  static propTypes = {
    addressBook: PropTypes.arrayOf(PropTypes.object),
    amount: PropTypes.string,
    blockGasLimit: PropTypes.string,
    conversionRate: PropTypes.number,
    editingTransactionId: PropTypes.string,
    fetchBasicGasEstimates: PropTypes.func.isRequired,
    from: PropTypes.object,
    gasLimit: PropTypes.string,
    gasPrice: PropTypes.string,
    gasTotal: PropTypes.string,
    history: PropTypes.object,
    chainId: PropTypes.string,
    primaryCurrency: PropTypes.string,
    resetSendState: PropTypes.func.isRequired,
    selectedAddress: PropTypes.string,
    sendToken: PropTypes.object,
    showHexData: PropTypes.bool,
    to: PropTypes.string,
    toNickname: PropTypes.string,
    tokens: PropTypes.array,
    tokenBalance: PropTypes.string,
    tokenContract: PropTypes.object,
    updateAndSetGasLimit: PropTypes.func.isRequired,
    updateSendEnsResolution: PropTypes.func.isRequired,
    updateSendEnsResolutionError: PropTypes.func.isRequired,
    updateSendErrors: PropTypes.func.isRequired,
    updateSendTo: PropTypes.func.isRequired,
    updateSendTokenBalance: PropTypes.func.isRequired,
    updateToNicknameIfNecessary: PropTypes.func.isRequired,
    scanQrCode: PropTypes.func.isRequired,
    qrCodeDetected: PropTypes.func.isRequired,
    qrCodeData: PropTypes.object,
    sendTokenAddress: PropTypes.string,
    gasIsExcessive: PropTypes.bool.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  state = {
    query: '',
    toError: null,
    toWarning: null,
    internalSearch: false,
  };

  constructor(props) {
    super(props);
    this.dValidate = debounce(this.validate, 1000);
  }

  componentDidUpdate(prevProps) {
    const {
      amount,
      conversionRate,
      from: { address, balance },
      gasTotal,
      chainId,
      primaryCurrency,
      sendToken,
      tokenBalance,
      updateSendErrors,
      updateSendTo,
      updateSendTokenBalance,
      tokenContract,
      to,
      toNickname,
      addressBook,
      updateToNicknameIfNecessary,
      qrCodeData,
      qrCodeDetected,
    } = this.props;
    const { toError, toWarning } = this.state;

    let updateGas = false;
    const {
      from: { balance: prevBalance },
      gasTotal: prevGasTotal,
      tokenBalance: prevTokenBalance,
      chainId: prevChainId,
      sendToken: prevSendToken,
      to: prevTo,
    } = prevProps;

    const uninitialized = [prevBalance, prevGasTotal].every((n) => n === null);

    const amountErrorRequiresUpdate = doesAmountErrorRequireUpdate({
      balance,
      gasTotal,
      prevBalance,
      prevGasTotal,
      prevTokenBalance,
      sendToken,
      tokenBalance,
    });

    if (amountErrorRequiresUpdate) {
      const amountErrorObject = getAmountErrorObject({
        amount,
        balance,
        conversionRate,
        gasTotal,
        primaryCurrency,
        sendToken,
        tokenBalance,
      });
      const gasFeeErrorObject = sendToken
        ? getGasFeeErrorObject({
            balance,
            conversionRate,
            gasTotal,
            primaryCurrency,
            sendToken,
          })
        : { gasFee: null };
      updateSendErrors(Object.assign(amountErrorObject, gasFeeErrorObject));
    }

    if (!uninitialized) {
      if (chainId !== prevChainId && chainId !== undefined) {
        updateSendTokenBalance({
          sendToken,
          tokenContract,
          address,
        });
        updateToNicknameIfNecessary(to, toNickname, addressBook);
        this.props.fetchBasicGasEstimates();
        updateGas = true;
      }
    }

    const prevTokenAddress = prevSendToken && prevSendToken.address;
    const sendTokenAddress = sendToken && sendToken.address;

    if (sendTokenAddress && prevTokenAddress !== sendTokenAddress) {
      this.updateSendToken();
      this.validate(this.state.query);
      updateGas = true;
    }

    let scannedAddress;
    if (qrCodeData) {
      if (qrCodeData.type === 'address') {
        scannedAddress = qrCodeData.values.address.toLowerCase();
        if (ethUtil.isValidAddress(scannedAddress)) {
          const currentAddress = prevTo?.toLowerCase();
          if (currentAddress !== scannedAddress) {
            updateSendTo(scannedAddress);
            updateGas = true;
            // Clean up QR code data after handling
            qrCodeDetected(null);
          }
        } else {
          scannedAddress = null;
          qrCodeDetected(null);
          this.setState({ toError: INVALID_RECIPIENT_ADDRESS_ERROR });
        }
      }
    }

    if (updateGas) {
      if (scannedAddress) {
        this.updateGas({ to: scannedAddress });
      } else {
        this.updateGas();
      }
    }

    // If selecting ETH after selecting a token, clear token related messages.
    if (prevSendToken && !sendToken) {
      let error = toError;
      let warning = toWarning;

      if (toError === CONTRACT_ADDRESS_ERROR) {
        error = null;
      }

      if (toWarning === KNOWN_RECIPIENT_ADDRESS_ERROR) {
        warning = null;
      }

      this.setState({
        toError: error,
        toWarning: warning,
      });
    }
  }

  componentDidMount() {
    this.props.fetchBasicGasEstimates().then(() => {
      this.updateGas();
    });
  }

  UNSAFE_componentWillMount() {
    this.updateSendToken();

    // Show QR Scanner modal  if ?scan=true
    if (window.location.search === '?scan=true') {
      this.props.scanQrCode();

      // Clear the queryString param after showing the modal
      const cleanUrl = window.location.href.split('?')[0];
      window.history.pushState({}, null, `${cleanUrl}`);
      window.location.hash = '#send';
    }
  }

  componentWillUnmount() {
    this.props.resetSendState();
  }

  onRecipientInputChange = (query) => {
    const { internalSearch } = this.state;

    if (!internalSearch) {
      if (query) {
        this.dValidate(query);
      } else {
        this.dValidate.cancel();
        this.validate(query);
      }
    }

    this.setState({ query });
  };

  setInternalSearch(internalSearch) {
    this.setState({ query: '', internalSearch });
  }

  validate(query) {
    const { tokens, sendToken, chainId, sendTokenAddress } = this.props;

    const { internalSearch } = this.state;

    if (!query || internalSearch) {
      this.setState({ toError: '', toWarning: '' });
      return;
    }

    const toErrorObject = getToErrorObject(query, sendTokenAddress, chainId);
    const toWarningObject = getToWarningObject(query, tokens, sendToken);

    this.setState({
      toError: toErrorObject.to,
      toWarning: toWarningObject.to,
    });
  }

  updateSendToken() {
    const {
      from: { address },
      sendToken,
      tokenContract,
      updateSendTokenBalance,
    } = this.props;

    updateSendTokenBalance({
      sendToken,
      tokenContract,
      address,
    });
  }

  updateGas({ to: updatedToAddress, amount: value, data } = {}) {
    const {
      amount,
      blockGasLimit,
      editingTransactionId,
      gasLimit,
      gasPrice,
      selectedAddress,
      sendToken,
      to: currentToAddress,
      updateAndSetGasLimit,
    } = this.props;

    updateAndSetGasLimit({
      blockGasLimit,
      editingTransactionId,
      gasLimit,
      gasPrice,
      selectedAddress,
      sendToken,
      to: getToAddressForGasUpdate(updatedToAddress, currentToAddress),
      value: value || amount,
      data,
    });
  }

  render() {
    const { history, to } = this.props;
    let content;

    if (to) {
      content = this.renderSendContent();
    } else {
      content = this.renderAddRecipient();
    }

    return (
      <div className="page-container">
        <SendHeader history={history} />
        {this.renderInput()}
        {content}
      </div>
    );
  }

  renderInput() {
    const { internalSearch } = this.state;
    return (
      <EnsInput
        className="send__to-row"
        scanQrCode={(_) => {
          this.context.metricsEvent({
            eventOpts: {
              category: 'Transactions',
              action: 'Edit Screen',
              name: 'Used QR scanner',
            },
          });
          this.props.scanQrCode();
        }}
        onChange={this.onRecipientInputChange}
        onValidAddressTyped={(address) => this.props.updateSendTo(address, '')}
        onPaste={(text) => {
          this.props.updateSendTo(text) && this.updateGas();
        }}
        onReset={() => this.props.updateSendTo('', '')}
        updateEnsResolution={this.props.updateSendEnsResolution}
        updateEnsResolutionError={this.props.updateSendEnsResolutionError}
        internalSearch={internalSearch}
      />
    );
  }

  renderAddRecipient() {
    const { toError, toWarning } = this.state;
    return (
      <AddRecipient
        updateGas={({ to, amount, data } = {}) =>
          this.updateGas({ to, amount, data })
        }
        query={this.state.query}
        toError={toError}
        toWarning={toWarning}
        setInternalSearch={(internalSearch) =>
          this.setInternalSearch(internalSearch)
        }
      />
    );
  }

  renderSendContent() {
    const { history, showHexData, gasIsExcessive } = this.props;
    const { toWarning, toError } = this.state;

    return [
      <SendContent
        key="send-content"
        updateGas={({ to, amount, data } = {}) =>
          this.updateGas({ to, amount, data })
        }
        showHexData={showHexData}
        warning={toWarning}
        error={toError}
        gasIsExcessive={gasIsExcessive}
      />,
      <SendFooter key="send-footer" history={history} />,
    ];
  }
}
