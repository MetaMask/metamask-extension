import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import validUrl from 'valid-url';
import log from 'loglevel';
import TextField from '../../../../components/ui/text-field';
import Button from '../../../../components/ui/button';
import Tooltip from '../../../../components/ui/tooltip';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/modules/network.utils';
import { jsonRpcRequest } from '../../../../../shared/modules/rpc.utils';
import { decimalToHex } from '../../../../helpers/utils/conversions.util';

export default class AddNetworkForm extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
    metricsEvent: PropTypes.func.isRequired,
  };

  static propTypes = {
    onClear: PropTypes.func.isRequired,
    setRpcTarget: PropTypes.func.isRequired,
    rpcPrefs: PropTypes.object,
    networksToRender: PropTypes.array,
    onAddNetwork: PropTypes.func.isRequired,
  };

  state = {
    rpcUrl: '',
    chainId: '',
    ticker: '',
    networkName: '',
    blockExplorerUrl: '',
    errors: {},
    isSubmitting: false,
  };

  componentWillUnmount() {
    this.setState({
      rpcUrl: '',
      chainId: '',
      ticker: '',
      networkName: '',
      blockExplorerUrl: '',
      errors: {},
    });

    // onClear will push the network settings route unless was pass false.
    // Since we call onClear to cause this component to be unmounted, the
    // route will already have been updated, and we avoid setting it twice.
    this.props.onClear(false);
  }

  /**
   * Attempts to convert the given chainId to a decimal string, for display
   * purposes.
   *
   * Should be called with the props chainId whenever it is used to set the
   * component's state.
   *
   * @param {unknown} chainId - The chainId to convert.
   * @returns {string} The props chainId in decimal, or the original value if
   * it can't be converted.
   */
  getDisplayChainId(chainId) {
    if (!chainId || typeof chainId !== 'string' || !chainId.startsWith('0x')) {
      return chainId;
    }
    return parseInt(chainId, 16).toString(10);
  }

  /**
   * Prefixes a given id with '0x' if the prefix does not exist
   *
   * @param {string} chainId - The chainId to prefix
   * @returns {string} The chainId, prefixed with '0x'
   */
  prefixChainId(chainId) {
    let prefixedChainId = chainId;
    if (!chainId.startsWith('0x')) {
      prefixedChainId = `0x${parseInt(chainId, 10).toString(16)}`;
    }
    return prefixedChainId;
  }

  onSubmit = async () => {
    this.setState({
      isSubmitting: true,
    });

    try {
      const { setRpcTarget, rpcPrefs = {}, onAddNetwork } = this.props;
      const {
        networkName,
        rpcUrl,
        chainId: stateChainId,
        ticker,
        blockExplorerUrl,
      } = this.state;

      const formChainId = stateChainId.trim().toLowerCase();
      const chainId = this.prefixChainId(formChainId);

      if (!(await this.validateChainIdOnSubmit(formChainId, chainId, rpcUrl))) {
        this.setState({
          isSubmitting: false,
        });
        return;
      }

      await setRpcTarget(rpcUrl, chainId, ticker, networkName, {
        ...rpcPrefs,
        blockExplorerUrl: blockExplorerUrl || rpcPrefs.blockExplorerUrl,
      });
      onAddNetwork();
    } catch (error) {
      this.setState({
        isSubmitting: false,
      });
      throw error;
    }
  };

  onCancel = () => {
    const { onClear } = this.props;
    onClear();
  };

  isSubmitting() {
    return this.state.isSubmitting;
  }

  renderFormTextField({
    fieldKey,
    textFieldId,
    onChange,
    value,
    optionalTextFieldKey,
    tooltipText,
    autoFocus = false,
  }) {
    const { errors } = this.state;
    const errorMessage = errors[fieldKey]?.msg || '';

    return (
      <div className="add-network-form__network-form-row">
        <div className="add-network-form__network-form-label">
          <div className="add-network-form__network-form-label-text">
            {this.context.t(optionalTextFieldKey || fieldKey)}
          </div>
          {tooltipText ? (
            <Tooltip
              position="top"
              title={tooltipText}
              wrapperClassName="add-network-form__network-form-label-tooltip"
            >
              <i className="fa fa-info-circle" />
            </Tooltip>
          ) : null}
        </div>
        <TextField
          type="text"
          id={textFieldId}
          onChange={onChange}
          fullWidth
          margin="dense"
          value={value}
          error={errorMessage}
          autoFocus={autoFocus}
        />
      </div>
    );
  }

  setStateWithValue = (stateKey, validator) => {
    return (e) => {
      validator?.(e.target.value, stateKey);
      this.setState({ [stateKey]: e.target.value });
    };
  };

  setErrorTo = (errorKey, errorVal) => {
    this.setState({
      errors: {
        ...this.state.errors,
        [errorKey]: errorVal,
      },
    });
  };

  setErrorEmpty = (errorKey) => {
    this.setState({
      errors: {
        ...this.state.errors,
        [errorKey]: {
          msg: '',
          key: '',
        },
      },
    });
  };

  hasError = (errorKey, errorKeyVal) => {
    return this.state.errors[errorKey]?.key === errorKeyVal;
  };

  hasErrors = () => {
    const { errors } = this.state;
    return Object.keys(errors).some((key) => {
      const error = errors[key];
      // Do not factor in duplicate chain id error for submission disabling
      if (key === 'chainId' && error.key === 'chainIdExistsErrorMsg') {
        return false;
      }
      return error.key && error.msg;
    });
  };

  validateChainIdOnChange = (selfRpcUrl, chainIdArg = '') => {
    const { t } = this.context;
    const { networksToRender } = this.props;
    const chainId = chainIdArg.trim();

    let errorKey = '';
    let errorMessage = '';
    let radix = 10;
    let hexChainId = chainId;

    if (!hexChainId.startsWith('0x')) {
      try {
        hexChainId = `0x${decimalToHex(hexChainId)}`;
      } catch (err) {
        this.setErrorTo('chainId', {
          key: 'invalidHexNumber',
          msg: t('invalidHexNumber'),
        });
        return;
      }
    }

    const [matchingChainId] = networksToRender.filter(
      (e) => e.chainId === hexChainId && e.rpcUrl !== selfRpcUrl,
    );

    if (chainId === '') {
      this.setErrorEmpty('chainId');
      return;
    } else if (matchingChainId) {
      errorKey = 'chainIdExistsErrorMsg';
      errorMessage = t('chainIdExistsErrorMsg', [
        matchingChainId.label ?? matchingChainId.labelKey,
      ]);
    } else if (chainId.startsWith('0x')) {
      radix = 16;
      if (!/^0x[0-9a-f]+$/iu.test(chainId)) {
        errorKey = 'invalidHexNumber';
        errorMessage = t('invalidHexNumber');
      } else if (!isPrefixedFormattedHexString(chainId)) {
        errorMessage = t('invalidHexNumberLeadingZeros');
      }
    } else if (!/^[0-9]+$/u.test(chainId)) {
      errorKey = 'invalidNumber';
      errorMessage = t('invalidNumber');
    } else if (chainId.startsWith('0')) {
      errorKey = 'invalidNumberLeadingZeros';
      errorMessage = t('invalidNumberLeadingZeros');
    } else if (!isSafeChainId(parseInt(chainId, radix))) {
      errorKey = 'invalidChainIdTooBig';
      errorMessage = t('invalidChainIdTooBig');
    }

    this.setErrorTo('chainId', {
      key: errorKey,
      msg: errorMessage,
    });
  };

  /**
   * Validates the chain ID by checking it against the `eth_chainId` return
   * value from the given RPC URL.
   * Assumes that all strings are non-empty and correctly formatted.
   *
   * @param {string} formChainId - Non-empty, hex or decimal number string from
   * the form.
   * @param {string} parsedChainId - The parsed, hex string chain ID.
   * @param {string} rpcUrl - The RPC URL from the form.
   */
  validateChainIdOnSubmit = async (formChainId, parsedChainId, rpcUrl) => {
    const { t } = this.context;
    let errorKey;
    let errorMessage;
    let endpointChainId;
    let providerError;

    try {
      endpointChainId = await jsonRpcRequest(rpcUrl, 'eth_chainId');
    } catch (err) {
      log.warn('Failed to fetch the chainId from the endpoint.', err);
      providerError = err;
    }

    if (providerError || typeof endpointChainId !== 'string') {
      errorKey = 'failedToFetchChainId';
      errorMessage = t('failedToFetchChainId');
    } else if (parsedChainId !== endpointChainId) {
      // Here, we are in an error state. The endpoint should always return a
      // hexadecimal string. If the user entered a decimal string, we attempt
      // to convert the endpoint's return value to decimal before rendering it
      // in an error message in the form.
      if (!formChainId.startsWith('0x')) {
        try {
          endpointChainId = parseInt(endpointChainId, 16).toString(10);
        } catch (err) {
          log.warn(
            'Failed to convert endpoint chain ID to decimal',
            endpointChainId,
          );
        }
      }

      errorKey = 'endpointReturnedDifferentChainId';
      errorMessage = t('endpointReturnedDifferentChainId', [
        endpointChainId.length <= 12
          ? endpointChainId
          : `${endpointChainId.slice(0, 9)}...`,
      ]);
    }

    if (errorKey) {
      this.setErrorTo('chainId', {
        key: errorKey,
        msg: errorMessage,
      });
      return false;
    }

    this.setErrorEmpty('chainId');
    return true;
  };

  isValidWhenAppended = (url) => {
    const appendedRpc = `http://${url}`;
    return validUrl.isWebUri(appendedRpc) && !url.match(/^https?:\/\/$/u);
  };

  validateBlockExplorerURL = (url, stateKey) => {
    const { t } = this.context;
    if (!validUrl.isWebUri(url) && url !== '') {
      let errorKey;
      let errorMessage;

      if (this.isValidWhenAppended(url)) {
        errorKey = 'urlErrorMsg';
        errorMessage = t('urlErrorMsg');
      } else {
        errorKey = 'invalidBlockExplorerURL';
        errorMessage = t('invalidBlockExplorerURL');
      }

      this.setErrorTo(stateKey, {
        key: errorKey,
        msg: errorMessage,
      });
    } else {
      this.setErrorEmpty(stateKey);
    }
  };

  validateUrlRpcUrl = (url, stateKey) => {
    const { t } = this.context;
    const { networksToRender } = this.props;
    const { chainId: stateChainId } = this.state;
    const isValidUrl = validUrl.isWebUri(url);
    const chainIdFetchFailed = this.hasError('chainId', 'failedToFetchChainId');
    const [matchingRPCUrl] = networksToRender.filter((e) => e.rpcUrl === url);

    if (!isValidUrl && url !== '') {
      let errorKey;
      let errorMessage;
      if (this.isValidWhenAppended(url)) {
        errorKey = 'urlErrorMsg';
        errorMessage = t('urlErrorMsg');
      } else {
        errorKey = 'invalidRPC';
        errorMessage = t('invalidRPC');
      }
      this.setErrorTo(stateKey, {
        key: errorKey,
        msg: errorMessage,
      });
    } else if (matchingRPCUrl) {
      this.setErrorTo(stateKey, {
        key: 'urlExistsErrorMsg',
        msg: t('urlExistsErrorMsg', [
          matchingRPCUrl.label ?? matchingRPCUrl.labelKey,
        ]),
      });
    } else {
      this.setErrorEmpty(stateKey);
    }

    // Re-validate the chain id if it could not be found with previous rpc url
    if (stateChainId && isValidUrl && chainIdFetchFailed) {
      const formChainId = stateChainId.trim().toLowerCase();
      const chainId = this.prefixChainId(formChainId);
      this.validateChainIdOnSubmit(formChainId, chainId, url);
    }
  };

  renderSubHeader() {
    const { t } = this.context;
    return (
      <div className="add-network-form__subheader">
        <span className="add-network-form__sub-header-text">
          {t('networks')}
        </span>
        <span>{'  >  '}</span>
        <div className="add-network-form__subheader--break">
          {t('addANetwork')}
        </div>
      </div>
    );
  }

  renderWarning() {
    const { t } = this.context;
    return (
      <div className="add-network-form__network-form-row--warning">
        {t('onlyAddTrustedNetworks')}
      </div>
    );
  }

  render() {
    const { t } = this.context;
    const {
      networkName,
      rpcUrl,
      chainId = '',
      ticker,
      blockExplorerUrl,
    } = this.state;

    const isSubmitDisabled =
      this.hasErrors() || this.isSubmitting() || !rpcUrl || !chainId;

    return (
      <div className="add-network-form__body">
        {this.renderSubHeader()}
        <div className="add-network-form__content">
          {this.renderWarning()}
          <div className="add-network-form__form-row">
            <div className="add-network-form__form-column add-network-form__form-column__left">
              {this.renderFormTextField({
                fieldKey: 'networkName',
                textFieldId: 'network-name',
                onChange: this.setStateWithValue('networkName'),
                value: networkName,
                autoFocus: true,
              })}
              {this.renderFormTextField({
                fieldKey: 'chainId',
                textFieldId: 'chainId',
                onChange: this.setStateWithValue(
                  'chainId',
                  this.validateChainIdOnChange.bind(this, rpcUrl),
                ),
                value: chainId,
                tooltipText: t('networkSettingsChainIdDescription'),
              })}
              {this.renderFormTextField({
                fieldKey: 'blockExplorerUrl',
                textFieldId: 'block-explorer-url',
                onChange: this.setStateWithValue(
                  'blockExplorerUrl',
                  this.validateBlockExplorerURL,
                ),
                value: blockExplorerUrl,
                optionalTextFieldKey: 'optionalBlockExplorerUrl',
              })}
            </div>
            <div className="add-network-form__form-column add-network-form__form-column__right">
              {this.renderFormTextField({
                fieldKey: 'rpcUrl',
                textFieldId: 'rpc-url',
                onChange: this.setStateWithValue(
                  'rpcUrl',
                  this.validateUrlRpcUrl,
                ),
                value: rpcUrl,
              })}
              {this.renderFormTextField({
                fieldKey: 'symbol',
                textFieldId: 'network-ticker',
                onChange: this.setStateWithValue('ticker'),
                value: ticker,
                optionalTextFieldKey: 'optionalCurrencySymbol',
              })}
            </div>
          </div>
          <div className="add-network-form__footer">
            <Button
              type="secondary"
              onClick={this.onCancel}
              rounded
              className="add-network-form__footer-cancel-button"
            >
              {t('cancel')}
            </Button>
            <Button
              type="primary"
              disabled={isSubmitDisabled}
              onClick={this.onSubmit}
              rounded
              className="add-network-form__footer-submit-button"
            >
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
