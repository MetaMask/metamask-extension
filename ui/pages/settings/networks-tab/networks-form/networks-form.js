import classnames from 'classnames';
import { isEqual } from 'lodash';
import log from 'loglevel';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isWebUrl } from '../../../../../app/scripts/lib/util';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsNetworkEventSource,
} from '../../../../../shared/constants/metametrics';
import {
  BUILT_IN_NETWORKS,
  FEATURED_RPCS,
  infuraProjectId,
} from '../../../../../shared/constants/network';
import fetchWithCache from '../../../../../shared/lib/fetch-with-cache';
import { decimalToHex } from '../../../../../shared/modules/conversion.utils';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/modules/network.utils';
import { jsonRpcRequest } from '../../../../../shared/modules/rpc.utils';
import ActionableMessage from '../../../../components/ui/actionable-message';
import Button from '../../../../components/ui/button';
import FormField from '../../../../components/ui/form-field';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { getNetworkLabelKey } from '../../../../helpers/utils/i18n-helper';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePrevious } from '../../../../hooks/usePrevious';
import { useSafeChainsListValidationSelector } from '../../../../selectors';
import {
  editAndSetNetworkConfiguration,
  setNewNetworkAdded,
  setSelectedNetworkConfigurationId,
  showModal,
  upsertNetworkConfiguration,
} from '../../../../store/actions';
import {
  ButtonLink,
  FormTextField,
  HelpText,
  HelpTextSeverity,
  Text,
} from '../../../../components/component-library';
import {
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

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

const NetworksForm = ({
  addNewNetwork,
  restrictHeight,
  isCurrentRpcTarget,
  networksToRender,
  selectedNetwork,
  cancelCallback,
  submitCallback,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { label, labelKey, viewOnly, rpcPrefs } = selectedNetwork;
  const selectedNetworkName =
    label || (labelKey && t(getNetworkLabelKey(labelKey)));
  const [networkName, setNetworkName] = useState(selectedNetworkName || '');
  const [rpcUrl, setRpcUrl] = useState(selectedNetwork?.rpcUrl || '');
  const [chainId, setChainId] = useState(selectedNetwork?.chainId || '');
  const [ticker, setTicker] = useState(selectedNetwork?.ticker || '');
  const [suggestedTicker, setSuggestedTicker] = useState('');
  const [blockExplorerUrl, setBlockExplorerUrl] = useState(
    selectedNetwork?.blockExplorerUrl || '',
  );
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chainIdMatchesFeaturedRPC = FEATURED_RPCS.some(
    (featuredRpc) => Number(featuredRpc.chainId) === Number(chainId),
  );
  const [isEditing, setIsEditing] = useState(Boolean(addNewNetwork));
  const [previousNetwork, setPreviousNetwork] = useState(selectedNetwork);

  const trackEvent = useContext(MetaMetricsContext);

  const useSafeChainsListValidation = useSelector(
    useSafeChainsListValidationSelector,
  );
  const safeChainsList = useRef([]);

  useEffect(() => {
    async function fetchChainList() {
      try {
        const chainList = await fetchWithCache({
          url: 'https://chainid.network/chains.json',
          functionName: 'getSafeChainsList',
        });
        Object.values(BUILT_IN_NETWORKS).forEach((network) => {
          const index = chainList.findIndex(
            (chain) =>
              chain.chainId.toString() === getDisplayChainId(network.chainId),
          );
          if (network.ticker && index !== -1) {
            chainList[index].nativeCurrency.symbol = network.ticker;
          }
        });
        safeChainsList.current = chainList;
      } catch (error) {
        log.warn('Failed to fetch chainList from chainid.network', error);
      }
    }
    if (useSafeChainsListValidation) {
      fetchChainList();
    }
  }, [useSafeChainsListValidation]);

  const resetForm = useCallback(() => {
    setNetworkName(selectedNetworkName || '');
    setRpcUrl(selectedNetwork.rpcUrl);
    setChainId(getDisplayChainId(selectedNetwork.chainId));
    setTicker(selectedNetwork?.ticker);
    setBlockExplorerUrl(selectedNetwork?.blockExplorerUrl);
    setErrors({});
    setWarnings({});
    setSuggestedTicker('');
    setIsSubmitting(false);
    setIsEditing(false);
    setPreviousNetwork(selectedNetwork);
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
  // This effect is used to reset the form when the user switches between networks
  useEffect(() => {
    if (!prevAddNewNetwork.current && addNewNetwork) {
      setNetworkName('');
      setRpcUrl('');
      setChainId('');
      setTicker('');
      setBlockExplorerUrl('');
      setErrors({});
      setIsSubmitting(false);
    } else {
      const networkNameChanged =
        prevNetworkName.current !== selectedNetworkName;
      const rpcUrlChanged = prevRpcUrl.current !== selectedNetwork.rpcUrl;
      const chainIdChanged = prevChainId.current !== selectedNetwork.chainId;
      const tickerChanged = prevTicker.current !== selectedNetwork.ticker;
      const blockExplorerUrlChanged =
        prevBlockExplorerUrl.current !== selectedNetwork.blockExplorerUrl;

      if (
        (networkNameChanged ||
          rpcUrlChanged ||
          chainIdChanged ||
          tickerChanged ||
          blockExplorerUrlChanged) &&
        (!isEditing || !isEqual(selectedNetwork, previousNetwork))
      ) {
        resetForm(selectedNetwork);
      }
    }

    prevAddNewNetwork.current = addNewNetwork;
    prevNetworkName.current = selectedNetworkName;
    prevRpcUrl.current = selectedNetwork.rpcUrl;
    prevChainId.current = selectedNetwork.chainId;
    prevTicker.current = selectedNetwork.ticker;
    prevBlockExplorerUrl.current = selectedNetwork.blockExplorerUrl;
  }, [
    selectedNetwork,
    selectedNetworkName,
    addNewNetwork,
    previousNetwork,
    resetForm,
    isEditing,
  ]);

  useEffect(() => {
    return () => {
      setNetworkName('');
      setRpcUrl('');
      setChainId('');
      setTicker('');
      setBlockExplorerUrl('');
      setErrors({});
      dispatch(setSelectedNetworkConfigurationId(''));
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

  const autoSuggestTicker = useCallback((formChainId) => {
    const decimalChainId = getDisplayChainId(formChainId);
    if (decimalChainId.trim() === '' || safeChainsList.current.length === 0) {
      setSuggestedTicker('');
      return;
    }
    const matchedChain = safeChainsList.current?.find(
      (chain) => chain.chainId.toString() === decimalChainId,
    );
    if (matchedChain === undefined) {
      setSuggestedTicker('');
      return;
    }
    const returnedTickerSymbol = matchedChain.nativeCurrency?.symbol;
    setSuggestedTicker(returnedTickerSymbol);
  }, []);

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
      if (url?.length > 0 && !isWebUrl(url)) {
        if (isWebUrl(`https://${url}`)) {
          return {
            key: 'urlErrorMsg',
            msg: t('urlErrorMsg'),
          };
        }

        return {
          key: 'invalidBlockExplorerURL',
          msg: t('invalidBlockExplorerURL'),
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
      let warningKey = '';
      let warningMessage = '';
      let radix = 10;
      let hexChainId = formChainId;

      if (!hexChainId.startsWith('0x')) {
        try {
          hexChainId = `0x${decimalToHex(hexChainId)}`;
        } catch (err) {
          return {
            error: {
              key: 'invalidHexNumber',
              msg: t('invalidHexNumber'),
            },
          };
        }
      }

      const [matchingChainId] = networksToRender.filter(
        (e) => e.chainId === hexChainId && e.rpcUrl !== rpcUrl,
      );

      if (formChainId === '') {
        return null;
      } else if (matchingChainId) {
        warningKey = 'chainIdExistsErrorMsg';
        warningMessage = t('chainIdExistsErrorMsg', [
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
          error: {
            key: errorKey,
            msg: errorMessage,
          },
        };
      }
      if (warningKey) {
        return {
          warning: {
            key: warningKey,
            msg: warningMessage,
          },
        };
      }
      autoSuggestTicker(formChainId);
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
      const decimalChainId = getDisplayChainId(formChainId);

      if (!decimalChainId || !formTickerSymbol) {
        return null;
      }

      if (safeChainsList.current.length === 0) {
        warningKey = 'failedToFetchTickerSymbolData';
        warningMessage = t('failedToFetchTickerSymbolData');
      } else {
        const matchedChain = safeChainsList.current?.find(
          (chain) => chain.chainId.toString() === decimalChainId,
        );

        if (matchedChain === undefined) {
          warningKey = 'failedToFetchTickerSymbolData';
          warningMessage = t('failedToFetchTickerSymbolData');
        } else {
          const returnedTickerSymbol = matchedChain.nativeCurrency?.symbol;
          if (
            returnedTickerSymbol.toLowerCase() !==
            formTickerSymbol.toLowerCase()
          ) {
            warningKey = 'chainListReturnedDifferentTickerSymbol';
            warningMessage = t('chainListReturnedDifferentTickerSymbol', [
              returnedTickerSymbol,
            ]);
            setSuggestedTicker(returnedTickerSymbol);
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
      const [
        {
          rpcUrl: matchingRPCUrl = null,
          label: matchingRPCLabel,
          labelKey: matchingRPCLabelKey,
        } = {},
      ] = networksToRender.filter((e) => e.rpcUrl === url);
      const { rpcUrl: selectedNetworkRpcUrl } = selectedNetwork;

      if (url?.length > 0 && !isWebUrl(url)) {
        if (isWebUrl(`https://${url}`)) {
          return {
            key: 'urlErrorMsg',
            msg: t('urlErrorMsg'),
          };
        }
        return {
          key: 'invalidRPC',
          msg: t('invalidRPC'),
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
      const { error: chainIdError, warning: chainIdWarning } =
        (await validateChainId(chainId)) || {};
      const tickerWarning = await validateTickerSymbol(chainId, ticker);
      const blockExplorerError = validateBlockExplorerURL(blockExplorerUrl);
      const rpcUrlError = validateRPCUrl(rpcUrl);
      setErrors({
        ...errors,
        blockExplorerUrl: blockExplorerError,
        rpcUrl: rpcUrlError,
        chainId: chainIdError,
      });
      setWarnings({
        ...warnings,
        chainId: chainIdWarning,
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
      let networkConfigurationId;
      // After this point, isSubmitting will be reset in componentDidUpdate
      if (selectedNetwork.rpcUrl && rpcUrl !== selectedNetwork.rpcUrl) {
        await dispatch(
          editAndSetNetworkConfiguration(
            {
              rpcUrl,
              ticker,
              networkConfigurationId: selectedNetwork.networkConfigurationId,
              chainId: prefixedChainId,
              nickname: networkName,
              rpcPrefs: {
                ...rpcPrefs,
                blockExplorerUrl:
                  blockExplorerUrl || rpcPrefs?.blockExplorerUrl,
              },
            },
            {
              source: MetaMetricsNetworkEventSource.CustomNetworkForm,
            },
          ),
        );
      } else {
        networkConfigurationId = await dispatch(
          upsertNetworkConfiguration(
            {
              rpcUrl,
              ticker,
              chainId: prefixedChainId,
              nickname: networkName,
              rpcPrefs: {
                ...rpcPrefs,
                blockExplorerUrl:
                  blockExplorerUrl || rpcPrefs?.blockExplorerUrl,
              },
            },
            {
              setActive: true,
              source: MetaMetricsNetworkEventSource.CustomNetworkForm,
            },
          ),
        );
      }
      if (addNewNetwork) {
        dispatch(
          setNewNetworkAdded({
            nickname: networkName,
            networkConfigurationId,
          }),
        );

        trackEvent({
          event: MetaMetricsEventName.CustomNetworkAdded,
          category: MetaMetricsEventCategory.Network,
          properties: {
            block_explorer_url: blockExplorerUrl,
            chain_id: prefixedChainId,
            network_name: networkName,
            source_connection_method:
              MetaMetricsNetworkEventSource.CustomNetworkForm,
            token_symbol: ticker,
          },
        });

        submitCallback?.();
      }
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  };

  const onCancel = () => {
    if (addNewNetwork) {
      dispatch(setSelectedNetworkConfigurationId(''));
      cancelCallback?.();
    } else {
      resetForm();
    }
  };

  const onDelete = () => {
    dispatch(
      showModal({
        name: 'CONFIRM_DELETE_NETWORK',
        target: selectedNetwork.networkConfigurationId,
        onConfirm: () => {
          resetForm();
          dispatch(setSelectedNetworkConfigurationId(''));
        },
      }),
    );
  };
  const deletable = !isCurrentRpcTarget && !viewOnly && !addNewNetwork;
  const stateUnchanged = stateIsUnchanged();
  const chainIdErrorOnFeaturedRpcDuringEdit =
    selectedNetwork?.rpcUrl && errors.chainId && chainIdMatchesFeaturedRPC;
  const isSubmitDisabled =
    hasErrors() ||
    isSubmitting ||
    stateUnchanged ||
    chainIdErrorOnFeaturedRpcDuringEdit ||
    !rpcUrl ||
    !chainId ||
    !ticker;

  return (
    <div
      className={classnames({
        'networks-tab__network-form': !addNewNetwork,
        'networks-tab__add-network-form': addNewNetwork,
        'networks-tab__restrict-height': restrictHeight,
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
          onChange={(value) => {
            setIsEditing(true);
            setNetworkName(value);
          }}
          titleText={t('networkName')}
          value={networkName}
          disabled={viewOnly}
        />
        <FormField
          error={errors.rpcUrl?.msg || ''}
          onChange={(value) => {
            setIsEditing(true);
            setRpcUrl(value);
          }}
          titleText={t('rpcUrl')}
          value={
            rpcUrl?.includes(`/v3/${infuraProjectId}`)
              ? rpcUrl.replace(`/v3/${infuraProjectId}`, '')
              : rpcUrl
          }
          disabled={viewOnly}
        />
        <FormField
          warning={warnings.chainId?.msg || ''}
          error={errors.chainId?.msg || ''}
          onChange={(value) => {
            setIsEditing(true);
            setChainId(value);
            autoSuggestTicker(value);
          }}
          titleText={t('chainId')}
          value={chainId}
          disabled={viewOnly}
          tooltipText={viewOnly ? null : t('networkSettingsChainIdDescription')}
        />
        <FormTextField
          data-testid="network-form-ticker"
          helpText={
            suggestedTicker ? (
              <Text
                as="span"
                variant={TextVariant.bodySm}
                color={TextColor.textDefault}
              >
                {t('suggestedTokenSymbol')}
                <ButtonLink
                  as="button"
                  variant={TextVariant.bodySm}
                  color={TextColor.primaryDefault}
                  onClick={() => {
                    setTicker(suggestedTicker);
                  }}
                  paddingLeft={1}
                  paddingRight={1}
                  style={{ verticalAlign: 'baseline' }}
                >
                  {suggestedTicker}
                </ButtonLink>
              </Text>
            ) : null
          }
          onChange={(e) => {
            setIsEditing(true);
            setTicker(e.target.value);
          }}
          label={t('currencySymbol')}
          labelProps={{
            variant: TextVariant.bodySm,
            fontWeight: FontWeight.Bold,
            paddingBottom: 1,
            paddingTop: 1,
          }}
          inputProps={{
            paddingLeft: 2,
            variant: TextVariant.bodySm,
            'data-testid': 'network-form-ticker-input',
          }}
          value={ticker}
          disabled={viewOnly}
        />
        {warnings.ticker?.msg ? (
          <HelpText
            severity={HelpTextSeverity.Warning}
            marginTop={1}
            data-testid="network-form-ticker-warning"
          >
            {warnings.ticker.msg}
          </HelpText>
        ) : null}
        <FormField
          error={errors.blockExplorerUrl?.msg || ''}
          onChange={(value) => {
            setIsEditing(true);
            setBlockExplorerUrl(value);
          }}
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
  cancelCallback: PropTypes.func,
  submitCallback: PropTypes.func,
  restrictHeight: PropTypes.bool,
};

NetworksForm.defaultProps = {
  selectedNetwork: {},
};

export default NetworksForm;
