import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
import Button from '../../../../components/ui/button';
import FormField from '../../../../components/ui/form-field';
import { decimalToHex } from '../../../../helpers/utils/conversions.util';
import {
  setSelectedSettingsRpcUrl,
  updateAndSetCustomRpc,
  editRpc,
  showModal,
  setNewNetworkAdded,
} from '../../../../store/actions';
import {
  DEFAULT_ROUTE,
  NETWORKS_ROUTE,
} from '../../../../helpers/constants/routes';

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

const isValidWhenAppended = (url) => {
  const appendedRpc = `http://${url}`;
  return validUrl.isWebUri(appendedRpc) && !url.match(/^https?:\/\/$/u);
};

const NetworksForm = ({
  addNewNetwork,
  isCurrentRpcTarget,
  networksToRender,
  selectedNetwork,
}) => {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const { label, labelKey, viewOnly, rpcPrefs } = selectedNetwork;
  const selectedNetworkName = label || (labelKey && t(labelKey));
  const [networkName, setNetworkName] = useState(selectedNetworkName || '');
  const [rpcUrl, setRpcUrl] = useState(selectedNetwork?.rpcUrl || '');
  const [chainId, setChainId] = useState(selectedNetwork?.chainId || '');
  const [ticker, setTicker] = useState(selectedNetwork?.ticker || '');
  const [blockExplorerUrl, setBlockExplorerUrl] = useState(
    selectedNetwork?.blockExplorerUrl || '',
  );
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setNetworkName(selectedNetworkName || '');
    setRpcUrl(selectedNetwork.rpcUrl);
    setChainId(getDisplayChainId(selectedNetwork.chainId));
    setTicker(selectedNetwork?.ticker);
    setBlockExplorerUrl(selectedNetwork?.blockExplorerUrl);
    setErrors({});
    setIsSubmitting(false);
  }, [selectedNetwork, selectedNetworkName]);

  const stateIsUnchanged = () => {
    // These added conditions are in case the saved chainId is invalid, which
    // was possible in versions <8.1 of the extension.
    // Basically, we always want to be able to overwrite an invalid chain ID.
    const chainIdIsUnchanged =
      typeof selectedNetwork.chainId === 'string' &&
      selectedNetwork.chainId.toLowerCase().startsWith('0x') &&
      chainId === getDisplayChainId(selectedNetwork.chainId);
    return (
      rpcUrl === selectedNetwork.rpcUrl &&
      chainIdIsUnchanged &&
      ticker === selectedNetwork.ticker &&
      networkName === selectedNetworkName &&
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
      prevNetworkName.current !== selectedNetworkName ||
      prevRpcUrl.current !== selectedNetwork.rpcUrl ||
      prevChainId.current !== selectedNetwork.chainId ||
      prevTicker.current !== selectedNetwork.ticker ||
      prevBlockExplorerUrl.current !== selectedNetwork.blockExplorerUrl
    ) {
      resetForm(selectedNetwork);
    }
  }, [
    selectedNetwork,
    selectedNetworkName,
    addNewNetwork,
    setNetworkName,
    setRpcUrl,
    setChainId,
    setTicker,
    setBlockExplorerUrl,
    setErrors,
    setIsSubmitting,
    resetForm,
  ]);

  useEffect(() => {
    return () => {
      setNetworkName('');
      setRpcUrl('');
      setChainId('');
      setTicker('');
      setBlockExplorerUrl('');
      setErrors({});
      dispatch(setSelectedSettingsRpcUrl(''));
    };
  }, [
    setNetworkName,
    setRpcUrl,
    setChainId,
    setTicker,
    setBlockExplorerUrl,
    setErrors,
    dispatch,
  ]);

  const setErrorTo = (errorKey, errorVal) => {
    setErrors({ ...errors, [errorKey]: errorVal });
  };

  const setErrorEmpty = (errorKey) => {
    setErrors({
      ...errors,
      [errorKey]: {
        msg: '',
        key: '',
      },
    });
  };

  const hasError = (errorKey, errorKeyVal) => {
    return errors[errorKey]?.key === errorKeyVal;
  };

  const hasErrors = () => {
    return Object.keys(errors).some((key) => {
      const error = errors[key];
      // Do not factor in duplicate chain id error for submission disabling
      if (key === 'chainId' && error.key === 'chainIdExistsErrorMsg') {
        return false;
      }
      return error.key && error.msg;
    });
  };

  const validateChainIdOnChange = (chainArg = '') => {
    const formChainId = chainArg.trim();
    let errorKey = '';
    let errorMessage = '';
    let radix = 10;
    let hexChainId = formChainId;

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
      (e) => e.chainId === hexChainId && e.rpcUrl !== rpcUrl,
    );

    if (formChainId === '') {
      setErrorEmpty('chainId');
      return;
    } else if (matchingChainId) {
      errorKey = 'chainIdExistsErrorMsg';
      errorMessage = t('chainIdExistsErrorMsg', [
        matchingChainId.label ?? matchingChainId.labelKey,
      ]);
    } else if (formChainId.startsWith('0x')) {
      radix = 16;
      if (!/^0x[0-9a-f]+$/iu.test(formChainId)) {
        errorKey = 'invalidHexNumber';
        errorMessage = t('invalidHexNumber');
      } else if (!isPrefixedFormattedHexString(formChainId)) {
        errorMessage = t('invalidHexNumberLeadingZeros');
      }
    } else if (!/^[0-9]+$/u.test(formChainId)) {
      errorKey = 'invalidNumber';
      errorMessage = t('invalidNumber');
    } else if (formChainId.startsWith('0')) {
      errorKey = 'invalidNumberLeadingZeros';
      errorMessage = t('invalidNumberLeadingZeros');
    } else if (!isSafeChainId(parseInt(formChainId, radix))) {
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
   * @param {string} formRpcUrl - The RPC URL from the form.
   */
  const validateChainIdOnSubmit = async (
    formChainId,
    parsedChainId,
    formRpcUrl,
  ) => {
    let errorKey;
    let errorMessage;
    let endpointChainId;
    let providerError;

    try {
      endpointChainId = await jsonRpcRequest(formRpcUrl, 'eth_chainId');
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

  const validateBlockExplorerURL = (url) => {
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

      setErrorTo('blockExplorerUrl', {
        key: errorKey,
        msg: errorMessage,
      });
    } else {
      setErrorEmpty('blockExplorerUrl');
    }
  };

  const validateUrlRpcUrl = (url) => {
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
      setErrorTo('rpcUrl', {
        key: errorKey,
        msg: errorMessage,
      });
    } else if (matchingRPCUrl) {
      setErrorTo('rpcUrl', {
        key: 'urlExistsErrorMsg',
        msg: t('urlExistsErrorMsg', [
          matchingRPCUrl.label ?? matchingRPCUrl.labelKey,
        ]),
      });
    } else {
      setErrorEmpty('rpcUrl');
    }

    // Re-validate the chain id if it could not be found with previous rpc url
    if (chainId && isValidUrl && chainIdFetchFailed) {
      const formChainId = chainId.trim().toLowerCase();
      const prefixedChainId = prefixChainId(formChainId);
      validateChainIdOnSubmit(formChainId, prefixedChainId, url);
    }
  };

  const onSubmit = async () => {
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
        await dispatch(
          editRpc(
            selectedNetwork.rpcUrl,
            rpcUrl,
            prefixedChainId,
            ticker,
            networkName,
            {
              ...rpcPrefs,
              blockExplorerUrl: blockExplorerUrl || rpcPrefs.blockExplorerUrl,
            },
          ),
        );
      } else {
        await dispatch(
          updateAndSetCustomRpc(rpcUrl, prefixedChainId, ticker, networkName, {
            ...rpcPrefs,
            blockExplorerUrl: blockExplorerUrl || rpcPrefs?.blockExplorerUrl,
          }),
        );
      }

      if (addNewNetwork) {
        dispatch(setNewNetworkAdded(networkName));
        history.push(DEFAULT_ROUTE);
      }
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  };

  const onCancel = () => {
    if (addNewNetwork) {
      dispatch(setSelectedSettingsRpcUrl(''));
      history.push(NETWORKS_ROUTE);
    } else {
      resetForm();
    }
  };

  const onDelete = () => {
    dispatch(
      showModal({
        name: 'CONFIRM_DELETE_NETWORK',
        target: selectedNetwork.rpcUrl,
        onConfirm: () => {
          resetForm();
          dispatch(setSelectedSettingsRpcUrl(''));
          history.push(NETWORKS_ROUTE);
        },
      }),
    );
  };
  const deletable = !isCurrentRpcTarget && !viewOnly && !addNewNetwork;
  const stateUnchanged = stateIsUnchanged();
  const isSubmitDisabled =
    hasErrors() || isSubmitting || stateUnchanged || !rpcUrl || !chainId;

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
          disabled={viewOnly}
        />
        <FormField
          error={errors.rpcUrl?.msg || ''}
          onChange={(value) => {
            setRpcUrl(value);
            validateUrlRpcUrl(value);
          }}
          titleText={t('rpcUrl')}
          value={rpcUrl}
          disabled={viewOnly}
        />
        <FormField
          error={errors.chainId?.msg || ''}
          onChange={(value) => {
            setChainId(value);
            validateChainIdOnChange(value);
          }}
          titleText={t('chainId')}
          value={chainId}
          disabled={viewOnly}
          tooltipText={viewOnly ? null : t('networkSettingsChainIdDescription')}
        />
        <FormField
          error={errors.ticker?.msg || ''}
          onChange={setTicker}
          titleText={t('currencySymbol')}
          titleUnit={t('optionalWithParanthesis')}
          value={ticker}
          disabled={viewOnly}
        />
        <FormField
          error={errors.blockExplorerUrl?.msg || ''}
          onChange={(value) => {
            setBlockExplorerUrl(value);
            validateBlockExplorerURL(value);
          }}
          titleText={t('blockExplorerUrl')}
          titleUnit={t('optionalWithParanthesis')}
          value={blockExplorerUrl}
          disabled={viewOnly}
        />
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
              disabled={stateUnchanged}
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

NetworksForm.propTypes = {
  addNewNetwork: PropTypes.bool,
  isCurrentRpcTarget: PropTypes.bool,
  networksToRender: PropTypes.array.isRequired,
  selectedNetwork: PropTypes.object,
};

NetworksForm.defaultProps = {
  selectedNetwork: {},
};

export default NetworksForm;
