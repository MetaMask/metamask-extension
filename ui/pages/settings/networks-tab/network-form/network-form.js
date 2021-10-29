import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import validUrl from 'valid-url';
import log from 'loglevel';
import classnames from 'classnames';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/modules/network.utils';
import { jsonRpcRequest } from '../../../../../shared/modules/rpc.utils';
import ActionableMessage from '../../../../components/ui/actionable-message';
import TextField from '../../../../components/ui/text-field';
import Tooltip from '../../../../components/ui/tooltip';
import Button from '../../../../components/ui/button';
import FormField from '../../../../components/ui/form-field';

// const FORM_STATE_KEYS = [
//   'networkName',
//   'rpcUrl',
//   'chainId',
//   'ticker',
//   'blockExplorerUrl',
// ];

const NetworkForm = ({
  editRpc,
  showConfirmDeleteNetworkModal,
  selectedNetwork,
  onClear,
  setRpcTarget,
  isCurrentRpcTarget,
  networksToRender,
  onAddNetwork,
  setNewNetworkAdded,
  addNewNetwork,
}) => {
  const t = useI18nContext();
  const { label, labelKey, viewOnly, rpcPrefs } = selectedNetwork;
  const [networkName, setNetworkName] = useState(
    label || (labelKey && t(labelKey)) || '',
  );
  const [rpcUrl, setRpcUrl] = useState(selectedNetwork?.rpcUrl || '');
  const [chainId, setChainId] = useState(selectedNetwork?.chainId || '');
  const [ticker, setTicker] = useState(selectedNetwork?.ticker || '');
  const [blockExplorerUrl, setBlockExplorerUrl] = useState(
    selectedNetwork?.blockExplorerUrl || '',
  );
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const getDisplayChainId = (chainId) => {
    if (!chainId || typeof chainId !== 'string' || !chainId.startsWith('0x')) {
      return chainId;
    }
    return parseInt(chainId, 16).toString(10);
  };

  const resetForm = (selectedNetwork) => {
    setNetworkName(selectedNetwork?.label || (selectedNetwork?.labelKey && t(selectedNetwork?.labelKey)) || '');
    setRpcUrl(selectedNetwork.rpcUrl);
    setChainId(getDisplayChainId(selectedNetwork.chainId));
    setTicker(selectedNetwork?.ticker);
    setBlockExplorerUrl(selectedNetwork?.blockExplorerUrl);
    setErrors({});
    setIsSubmitting(false);
  };

  /**
   * Prefixes a given id with '0x' if the prefix does not exist
   *
   * @param {string} chainId - The chainId to prefix
   * @returns {string} The chainId, prefixed with '0x'
   */
  const prefixChainId = (chainId) => {
    let prefixedChainId = chainId;
    if (!chainId.startsWith('0x')) {
      prefixedChainId = `0x${parseInt(chainId, 10).toString(16)}`;
    }
    return prefixedChainId;
  };

  const onSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const formChainId = chainId.trim().toLowerCase();
      const prefixedChainId = prefixChainId(formChainId);

      if (
        !(await validateChainIdOnSubmit(formChainId, prefixedChainId, rpcUrl))
      ) {
        setIsSubmitting(false);
        return;
      }

      // After this point, isSubmitting will be reset in componentDidUpdate
      if (selectedNetwork.rpcUrl && rpcUrl !== selectedNetwork.rpcUrl) {
        await editRpc(
          selectedNetwork.rpcUrl,
          rpcUrl,
          prefixedChainId,
          ticker,
          networkName,
          {
            ...rpcPrefs,
            blockExplorerUrl: blockExplorerUrl || rpcPrefs.blockExplorerUrl,
          },
        );
      } else {
        await setRpcTarget(rpcUrl, prefixedChainId, ticker, networkName, {
          ...rpcPrefs,
          blockExplorerUrl: blockExplorerUrl || rpcPrefs.blockExplorerUrl,
        });
      }

      if (addNewNetwork) {
        setNewNetworkAdded(networkName);
        onAddNetwork();
      }
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  }, [networkName, chainId, rpcUrl, ticker, blockExplorerUrl, addNewNetwork]);

  const onCancel = () => {
    console.log('oncancel');
    if (addNewNetwork) {
      onClear();
    } else {
      resetForm();
    }
  };

  const onDelete = () => {
    console.log('onDelete');

    showConfirmDeleteNetworkModal({
      target: selectedNetwork.rpcUrl,
      onConfirm: () => {
        resetForm();
        onClear();
      },
    });
  };

  const stateIsUnchanged = () => {
    // These added conditions are in case the saved chainId is invalid, which
    // was possible in versions <8.1 of the extension.
    // Basically, we always want to be able to overwrite an invalid chain ID.
    const chainIdIsUnchanged =
      typeof selectedNetwork.chainId === 'string' &&
      selectedNetwork.chainId.toLowerCase().startsWith('0x') &&
      chainId === getDisplayChainId(selectedNetwork.chainId);

    return (
      rpcUrl === selectedNetwork.chainId &&
      chainIdIsUnchanged &&
      ticker === selectedNetwork.ticker &&
      networkName === selectedNetwork.networkName &&
      blockExplorerUrl === selectedNetwork.blockExplorerUrl
    );
  };

  const prevAddNewNetwork = useRef();
  const prevNetworkName = useRef();
  const prevChainId = useRef();
  const prevRpcUrl = useRef();
  const prevTicker = useRef();
  const prevBlockExplorerUrl = useRef();
  useEffect(() => {
    if (!prevAddNewNetwork.current && addNewNetwork) {
      setNetworkName('');
      setRpcUrl('');
      setChainId('');
      setTicker('');
      setBlockExplorerUrl('');
      setErrors({});
      setIsSubmitting(false);
    } else if (
      prevNetworkName.current !== networkName ||
      prevRpcUrl.current !== rpcUrl ||
      prevChainId.current !== chainId ||
      prevTicker.current !== ticker ||
      prevBlockExplorerUrl.current !== blockExplorerUrl
    ) {
      resetForm(selectedNetwork);
    }
  }, [
    selectedNetwork,
    setNetworkName,
    setRpcUrl,
    setChainId,
    setTicker,
    setBlockExplorerUrl,
    setErrors,
    setIsSubmitting,
  ]);

  const renderFormTextField = ({
    className,
    fieldKey,
    textFieldId,
    onChange,
    value,
    optionalTextFieldKey,
    tooltipText,
    autoFocus = false,
  }) => {
    // const { errors } = this.state;
    // const { viewOnly } = this.props;
    const errorMessage = errors[fieldKey]?.msg || '';

    return (
      <div className={className}>
        <div className="networks-tab__network-form-label">
          <div className="networks-tab__network-form-label-text">
            {t(optionalTextFieldKey || fieldKey)}
          </div>
          {!viewOnly && tooltipText ? (
            <Tooltip
              position="top"
              title={tooltipText}
              wrapperClassName="networks-tab__network-form-label-tooltip"
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
          disabled={viewOnly}
          error={errorMessage}
          autoFocus={autoFocus}
        />
      </div>
    );
  };

  const setStateWithValue = (stateKey, validator) => {
    return (e) => {
      validator?.(e.target.value, stateKey);
      // this.setState({ [stateKey]: e.target.value });
      switch (stateKey) {
        case 'networkName':
          setNetworkName(e.target.value);
        case 'rpcUrl':
          setRpcUrl(e.target.value);
        case 'chainId':
          setChainId(e.target.value);
        case 'ticker':
          setTicker(e.target.value);
        case 'blockExplorerUrl':
          setBlockExplorerUrl(e.target.value);
      }
    };
  };

  const setErrorTo = (errorKey, errorVal) => {
    setErrors({ ...errors, [errorKey]: errorVal });
    // this.setState({
    //   errors: {
    //     ...this.state.errors,
    //     [errorKey]: errorVal,
    //   },
    // });
  };

  const setErrorEmpty = (errorKey) => {
    setErrors({
      ...errors,
      [errorKey]: {
        msg: '',
        key: '',
      },
    });
    // this.setState({
    //   errors: {
    //     ...this.state.errors,
    //     [errorKey]: {
    //       msg: '',
    //       key: '',
    //     },
    //   },
    // });
  };

  const hasError = (errorKey, errorKeyVal) => {
    return errors[errorKey]?.key === errorKeyVal;
  };

  const hasErrors = () => {
    // const { errors } = this.state;
    return Object.keys(errors).some((key) => {
      const error = errors[key];
      // Do not factor in duplicate chain id error for submission disabling
      if (key === 'chainId' && error.key === 'chainIdExistsErrorMsg') {
        return false;
      }
      return error.key && error.msg;
    });
  };

  const validateChainIdOnChange = (selfRpcUrl, chainIdArg = '') => {
    // const { t } = this.context;
    // const { networksToRender } = this.props;
    const chainId = chainIdArg.trim();

    let errorKey = '';
    let errorMessage = '';
    let radix = 10;
    let hexChainId = chainId;

    if (!hexChainId.startsWith('0x')) {
      try {
        hexChainId = `0x${decimalToHex(hexChainId)}`;
      } catch (err) {
        setErrorTo('chainId', {
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
      setErrorEmpty('chainId');
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

    setErrorTo('chainId', {
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
  const validateChainIdOnSubmit = async (
    formChainId,
    parsedChainId,
    rpcUrl,
  ) => {
    // const { t } = this.context;
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
      setErrorTo('chainId', {
        key: errorKey,
        msg: errorMessage,
      });
      return false;
    }

    setErrorEmpty('chainId');
    return true;
  };

  const isValidWhenAppended = (url) => {
    const appendedRpc = `http://${url}`;
    return validUrl.isWebUri(appendedRpc) && !url.match(/^https?:\/\/$/u);
  };

  const validateBlockExplorerURL = (url, stateKey) => {
    // const { t } = this.context;
    if (!validUrl.isWebUri(url) && url !== '') {
      let errorKey;
      let errorMessage;

      if (isValidWhenAppended(url)) {
        errorKey = 'urlErrorMsg';
        errorMessage = t('urlErrorMsg');
      } else {
        errorKey = 'invalidBlockExplorerURL';
        errorMessage = t('invalidBlockExplorerURL');
      }

      setErrorTo(stateKey, {
        key: errorKey,
        msg: errorMessage,
      });
    } else {
      setErrorEmpty(stateKey);
    }
  };

  const validateUrlRpcUrl = (url, stateKey) => {
    // const { t } = this.context;
    // const { networksToRender } = this.props;
    // const { chainId: stateChainId } = this.state;
    // const url = e.target.value;
    const isValidUrl = validUrl.isWebUri(url);
    const chainIdFetchFailed = hasError('chainId', 'failedToFetchChainId');
    const [matchingRPCUrl] = networksToRender.filter((e) => e.rpcUrl === url);

    if (!isValidUrl && url !== '') {
      let errorKey;
      let errorMessage;
      if (isValidWhenAppended(url)) {
        errorKey = 'urlErrorMsg';
        errorMessage = t('urlErrorMsg');
      } else {
        errorKey = 'invalidRPC';
        errorMessage = t('invalidRPC');
      }
      setErrorTo(stateKey, {
        key: errorKey,
        msg: errorMessage,
      });
    } else if (matchingRPCUrl) {
      setErrorTo(stateKey, {
        key: 'urlExistsErrorMsg',
        msg: t('urlExistsErrorMsg', [
          matchingRPCUrl.label ?? matchingRPCUrl.labelKey,
        ]),
      });
    } else {
      setErrorEmpty(stateKey);
    }

    // Re-validate the chain id if it could not be found with previous rpc url
    if (chainId && isValidUrl && chainIdFetchFailed) {
      const formChainId = chainId.trim().toLowerCase();
      const stateChainId = prefixChainId(formChainId);
      validateChainIdOnSubmit(formChainId, stateChainId, url);
    }
    // setRpcUrl(url);
  };

  useEffect(() => {
    return () => {
      console.log('unmount networkform');
      setNetworkName('');
      setRpcUrl('');
      setChainId('');
      setTicker('');
      setBlockExplorerUrl('');
      setErrors({});
      // onClear will push the network settings route unless was pass false.
      // Since we call onClear to cause this component to be unmounted, the
      // route will already have been updated, and we avoid setting it twice.
      onClear(false);
    };
  }, [
    setNetworkName,
    setRpcUrl,
    setChainId,
    setTicker,
    setBlockExplorerUrl,
    setErrors,
  ]);

  const deletable = !isCurrentRpcTarget && !viewOnly && !addNewNetwork;
  const isSubmitDisabled =
    hasErrors() || isSubmitting || stateIsUnchanged() || !rpcUrl || !chainId;
  console.log(onCancel);
  // console.log(networkName, chainId, rpcUrl, ticker, blockExplorerUrl)
  return (
    <div
      className={classnames({
        'networks-tab__network-form': !addNewNetwork,
        'networks-tab__add-network-form': addNewNetwork,
      })}
    >
      {addNewNetwork ? (
        <ActionableMessage
          type="warning"
          message={t('onlyAddTrustedNetworks')}
          iconFillColor="#f8c000"
          useIcon
          withRightButton
        />
      ) : null}
      <div
        className={classnames({
          'networks-tab__network-form-body': !addNewNetwork,
          'networks-tab__network-form-body__view-only': viewOnly,
          'networks-tab__add-network-form-body': addNewNetwork,
        })}
      >
        <FormField
          autoFocus
          error={errors.networkName?.msg || ''}
          onChange={setNetworkName}
          titleText={t('networkName')}
          value={networkName}
        />
        <FormField
          error={errors.rpcUrl?.msg || ''}
          onChange={setRpcUrl}
          titleText={t('rpcUrl')}
          value={rpcUrl}
        />
        <FormField
          error={errors.chainId?.msg || ''}
          onChange={setChainId}
          titleText={t('chainId')}
          value={chainId}
          tooltipText={viewOnly ? null : t('networkSettingsChainIdDescription')}
        />
        <FormField
          error={errors.ticker?.msg || ''}
          onChange={setTicker}
          titleText={t('symbol')}
          value={ticker}
        />
        <FormField
          error={errors.blockExplorerUrl?.msg || ''}
          onChange={setBlockExplorerUrl}
          titleText={t('blockExplorerUrl')}
          value={blockExplorerUrl}
        />

        {/* {renderFormTextField({
          className: 'networks-tab__network-form-row',
          fieldKey: 'networkName',
          textFieldId: 'network-name',
          onChange: setStateWithValue('networkName'),
          value: networkName,
        })} */}
        {/* {renderFormTextField({
          className: 'networks-tab__network-form-row',
          fieldKey: 'rpcUrl',
          textFieldId: 'rpc-url',
          onChange: setStateWithValue(
            'rpcUrl',
            validateUrlRpcUrl,
          ),
          value: rpcUrl,
        })} */}
        {/* {renderFormTextField({
          className: 'networks-tab__network-form-row',
          fieldKey: 'chainId',
          textFieldId: 'chainId',
          onChange: setStateWithValue(
            'chainId',
            validateChainIdOnChange.bind(this, rpcUrl),
          ),
          value: chainId,
          tooltipText: viewOnly ? null : t('networkSettingsChainIdDescription'),
        })} */}
        {/* {renderFormTextField({
          className: 'networks-tab__network-form-row',
          fieldKey: 'symbol',
          textFieldId: 'network-ticker',
          onChange: setStateWithValue('ticker'),
          value: ticker,
          optionalTextFieldKey: 'optionalCurrencySymbol',
        })} */}
        {/* {renderFormTextField({
          className: 'networks-tab__network-form-row',
          fieldKey: 'blockExplorerUrl',
          textFieldId: 'block-explorer-url',
          onChange: setStateWithValue(
            'blockExplorerUrl',
            validateBlockExplorerURL,
          ),
          value: blockExplorerUrl,
          optionalTextFieldKey: 'optionalBlockExplorerUrl',
        })}*/}
      </div>
      <div
        className={classnames({
          'networks-tab__network-form-footer': !addNewNetwork,
          'networks-tab__add-network-form-footer': addNewNetwork,
        })}
      >
        {!viewOnly && (
          <>
            {deletable && (
              <Button type="danger" onClick={onDelete}>
                {t('delete')}
              </Button>
            )}
            <Button
              type="secondary"
              onClick={onCancel}
              disabled={stateIsUnchanged}
            >
              {t('cancel')}
            </Button>
            <Button
              type="primary"
              disabled={isSubmitDisabled}
              onClick={onSubmit}
            >
              {t('save')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

NetworkForm.propTypes = {
  editRpc: PropTypes.func,
  showConfirmDeleteNetworkModal: PropTypes.func,
  rpcUrl: PropTypes.string,
  chainId: PropTypes.string,
  ticker: PropTypes.string,
  viewOnly: PropTypes.bool,
  networkName: PropTypes.string,
  onClear: PropTypes.func.isRequired,
  setRpcTarget: PropTypes.func.isRequired,
  isCurrentRpcTarget: PropTypes.bool,
  blockExplorerUrl: PropTypes.string,
  rpcPrefs: PropTypes.object,
  networksToRender: PropTypes.array.isRequired,
  onAddNetwork: PropTypes.func,
  setNewNetworkAdded: PropTypes.func,
  addNewNetwork: PropTypes.bool,
  selectedNetwork: PropTypes.object,
};

NetworkForm.defaultProps = {
  selectedNetwork: {},
};

export default NetworkForm;
