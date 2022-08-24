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
import fetchWithCache from '../../../../helpers/utils/fetch-with-cache';
import { usePrevious } from '../../../../hooks/usePrevious';

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
  const [warnings, setWarnings] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setNetworkName(selectedNetworkName || '');
    setRpcUrl(selectedNetwork.rpcUrl);
    setChainId(getDisplayChainId(selectedNetwork.chainId));
    setTicker(selectedNetwork?.ticker);
    setBlockExplorerUrl(selectedNetwork?.blockExplorerUrl);
    setErrors({});
    setWarnings({});
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

  const hasErrors = () => {
    return Object.keys(errors).some((key) => {
      const error = errors[key];
      // Do not factor in duplicate chain id error for submission disabling
      if (key === 'chainId' && error?.key === 'chainIdExistsErrorMsg') {
        return false;
      }
      return error?.key && error?.msg;
    });
  };

  const validateBlockExplorerURL = useCallback(
    (url) => {
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

        return {
          key: errorKey,
          msg: errorMessage,
        };
      }
      return null;
    },
    [t],
  );

  const validateChainId = useCallback(
    async (chainArg = '') => {
      const formChainId = chainArg.trim();
      let errorKey = '';
      let errorMessage = '';
      let radix = 10;
      let hexChainId = formChainId;

      if (!hexChainId.startsWith('0x')) {
        try {
          hexChainId = `0x${decimalToHex(hexChainId)}`;
        } catch (err) {
          return {
            key: 'invalidHexNumber',
            msg: t('invalidHexNumber'),
          };
        }
      }

      const [matchingChainId] = networksToRender.filter(
        (e) => e.chainId === hexChainId && e.rpcUrl !== rpcUrl,
      );

      if (formChainId === '') {
        return null;
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

      let endpointChainId;
      let providerError;

      try {
        endpointChainId = await jsonRpcRequest(rpcUrl, 'eth_chainId');
      } catch (err) {
        log.warn('Failed to fetch the chainId from the endpoint.', err);
        providerError = err;
      }

      if (rpcUrl && formChainId) {
        if (providerError || typeof endpointChainId !== 'string') {
          errorKey = 'failedToFetchChainId';
          errorMessage = t('failedToFetchChainId');
        } else if (hexChainId !== endpointChainId) {
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
      }
      if (errorKey) {
        return {
          key: errorKey,
          msg: errorMessage,
        };
      }

      return null;
    },
    [rpcUrl, networksToRender, t],
  );

  /**
   * Validates the ticker symbol by checking it against the nativeCurrency.symbol return
   * value from chainid.network trusted chain data
   * Assumes that all strings are non-empty and correctly formatted.
   *
   * @param {string} formChainId - The Chain ID currently entered in the form.
   * @param {string} formTickerSymbol - The ticker/currency symbol currently entered in the form.
   */
  const validateTickerSymbol = useCallback(
    async (formChainId, formTickerSymbol) => {
      let warningKey;
      let warningMessage;
      let safeChainsList;
      let providerError;

      if (!formChainId || !formTickerSymbol) {
        return null;
      }

      try {
        safeChainsList =
          (await fetchWithCache('https://chainid.network/chains.json')) || [];
      } catch (err) {
        log.warn('Failed to fetch the chainList from chainid.network', err);
        providerError = err;
      }

      if (providerError) {
        warningKey = 'failedToFetchTickerSymbolData';
        warningMessage = t('failedToFetchTickerSymbolData');
      } else {
        const matchedChain = safeChainsList?.find(
          (chain) => chain.chainId.toString() === formChainId,
        );

        if (matchedChain === undefined) {
          warningKey = 'failedToFetchTickerSymbolData';
          warningMessage = t('failedToFetchTickerSymbolData');
        } else {
          const returnedTickerSymbol = matchedChain.nativeCurrency?.symbol;
          if (returnedTickerSymbol !== formTickerSymbol) {
            warningKey = 'chainListReturnedDifferentTickerSymbol';
            warningMessage = t('chainListReturnedDifferentTickerSymbol', [
              formChainId,
              returnedTickerSymbol,
            ]);
          }
        }
      }

      if (warningKey) {
        return {
          key: warningKey,
          msg: warningMessage,
        };
      }

      return null;
    },
    [t],
  );

  const validateRPCUrl = useCallback(
    (url) => {
      const isValidUrl = validUrl.isWebUri(url);
      const [
        {
          rpcUrl: matchingRPCUrl = null,
          label: matchingRPCLabel,
          labelKey: matchingRPCLabelKey,
        } = {},
      ] = networksToRender.filter((e) => e.rpcUrl === url);
      const { rpcUrl: selectedNetworkRpcUrl } = selectedNetwork;

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

        return {
          key: errorKey,
          msg: errorMessage,
        };
      } else if (matchingRPCUrl && matchingRPCUrl !== selectedNetworkRpcUrl) {
        return {
          key: 'urlExistsErrorMsg',
          msg: t('urlExistsErrorMsg', [
            matchingRPCLabel ?? matchingRPCLabelKey,
          ]),
        };
      }
      return null;
    },
    [selectedNetwork, networksToRender, t],
  );

  // validation effect
  const previousRpcUrl = usePrevious(rpcUrl);
  const previousChainId = usePrevious(chainId);
  const previousTicker = usePrevious(ticker);
  const previousBlockExplorerUrl = usePrevious(blockExplorerUrl);
  useEffect(() => {
    if (viewOnly) {
      return;
    }

    if (
      previousRpcUrl === rpcUrl &&
      previousChainId === chainId &&
      previousTicker === ticker &&
      previousBlockExplorerUrl === blockExplorerUrl
    ) {
      return;
    }
    async function validate() {
      const chainIdError = await validateChainId(chainId);
      const tickerWarning = await validateTickerSymbol(chainId, ticker);
      const blockExplorerError = validateBlockExplorerURL(blockExplorerUrl);
      const rpcUrlError = validateRPCUrl(rpcUrl);
      setErrors({
        ...errors,
        blockExplorerUrl: blockExplorerError,
        rpcUrl: rpcUrlError,
      });
      setWarnings({
        ...warnings,
        chainId: chainIdError,
        ticker: tickerWarning,
      });
    }

    validate();
  }, [
    errors,
    warnings,
    rpcUrl,
    chainId,
    ticker,
    blockExplorerUrl,
    viewOnly,
    label,
    previousRpcUrl,
    previousChainId,
    previousTicker,
    previousBlockExplorerUrl,
    validateBlockExplorerURL,
    validateChainId,
    validateTickerSymbol,
    validateRPCUrl,
  ]);

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formChainId = chainId.trim().toLowerCase();
      const prefixedChainId = prefixChainId(formChainId);

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
              blockExplorerUrl: blockExplorerUrl || rpcPrefs?.blockExplorerUrl,
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
        },
      }),
    );
  };
  const deletable = !isCurrentRpcTarget && !viewOnly && !addNewNetwork;
  const stateUnchanged = stateIsUnchanged();
  const isSubmitDisabled =
    hasErrors() ||
    isSubmitting ||
    stateUnchanged ||
    !rpcUrl ||
    !chainId ||
    !ticker;

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
          iconFillColor="var(--color-warning-default)"
          useIcon
          withRightButton
          className="networks-tab__add-network-form__alert"
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
          onChange={setRpcUrl}
          titleText={t('rpcUrl')}
          value={rpcUrl}
          disabled={viewOnly}
        />
        <FormField
          warning={warnings.chainId?.msg || ''}
          onChange={setChainId}
          titleText={t('chainId')}
          value={chainId}
          disabled={viewOnly}
          tooltipText={viewOnly ? null : t('networkSettingsChainIdDescription')}
        />
        <FormField
          warning={warnings.ticker?.msg || ''}
          onChange={setTicker}
          titleText={t('currencySymbol')}
          value={ticker}
          disabled={viewOnly}
        />
        <FormField
          error={errors.blockExplorerUrl?.msg || ''}
          onChange={setBlockExplorerUrl}
          titleText={t('blockExplorerUrl')}
          titleUnit={t('optionalWithParanthesis')}
          value={blockExplorerUrl}
          disabled={viewOnly}
          autoFocus={window.location.hash.split('#')[2] === 'blockExplorerUrl'}
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
