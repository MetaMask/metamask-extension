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
import { ORIGIN_METAMASK } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { isWebUrl } from '../../../../../app/scripts/lib/util';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsNetworkEventSource,
} from '../../../../../shared/constants/metametrics';
import {
  BUILT_IN_NETWORKS,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_ID_TO_RPC_URL_MAP,
  CHAIN_IDS,
  CHAINLIST_CURRENCY_SYMBOLS_MAP_NETWORK_COLLISION,
  FEATURED_RPCS,
  infuraProjectId,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';
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
import {
  getNonTestNetworks,
  getOrderedNetworksList,
} from '../../../../selectors';
import {
  upsertNetworkConfiguration,
  requestUserApproval,
  setEditedNetwork,
  setNewNetworkAdded,
  setSelectedNetworkConfigurationId,
  showDeprecatedNetworkModal,
  showModal,
  toggleNetworkMenu,
} from '../../../../store/actions';
import {
  Box,
  ButtonLink,
  ButtonPrimary,
  ButtonPrimarySize,
  HelpText,
  HelpTextSeverity,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import { FormTextField } from '../../../../components/component-library/form-text-field/deprecated';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  FontWeight,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  getMatchedChain,
  getMatchedNames,
  getMatchedSymbols,
} from '../../../../helpers/utils/network-helper';
import { getLocalNetworkMenuRedesignFeatureFlag } from '../../../../helpers/utils/feature-flags';
import { ACTION_MODES } from '../../../../components/multichain/network-list-menu/network-list-menu';
import InfoTooltip from '../../../../components/ui/info-tooltip';
import { useSafeChains, rpcIdentifierUtility } from './use-safe-chains';

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
  setActiveOnSubmit = false,
  restrictHeight,
  isCurrentRpcTarget,
  networksToRender,
  selectedNetwork,
  cancelCallback,
  submitCallback,
  onEditNetwork,
  prevActionMode,
  networkFormInformation = {},
  setNetworkFormInformation = () => null,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const DEFAULT_SUGGESTED_TICKER = [];
  const DEFAULT_SUGGESTED_NAME = [];
  const CHAIN_LIST_URL = 'https://chainid.network/';
  const BASE_HEX = 16;
  const BASE_DECIMAL = 10;
  const MAX_CHAIN_ID_LENGTH = 12;

  const { label, labelKey, viewOnly, rpcPrefs } = selectedNetwork;
  const selectedNetworkName =
    label || (labelKey && t(getNetworkLabelKey(labelKey)));
  const networkNameForm =
    prevActionMode === ACTION_MODES.ADD
      ? networkFormInformation.networkNameForm
      : '';
  const networkChainIdForm =
    prevActionMode === ACTION_MODES.ADD
      ? networkFormInformation.networkChainIdForm
      : '';
  const networkTickerForm =
    prevActionMode === ACTION_MODES.ADD
      ? networkFormInformation.networkTickerForm
      : '';

  const [networkName, setNetworkName] = useState(
    selectedNetworkName || networkNameForm,
  );
  const [rpcUrl, setRpcUrl] = useState(selectedNetwork?.rpcUrl || '');
  const [chainId, setChainId] = useState(
    selectedNetwork?.chainId || networkChainIdForm,
  );
  const [ticker, setTicker] = useState(
    selectedNetwork?.ticker || networkTickerForm,
  );
  const [suggestedTicker, setSuggestedTicker] = useState(
    DEFAULT_SUGGESTED_TICKER,
  );
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
  const [suggestedNames, setSuggestedNames] = useState(DEFAULT_SUGGESTED_NAME);
  const nonTestNetworks = useSelector(getNonTestNetworks);

  const trackEvent = useContext(MetaMetricsContext);
  const { safeChains } = useSafeChains();

  const orderedNetworksList = useSelector(getOrderedNetworksList);

  const networkMenuRedesign = useSelector(
    getLocalNetworkMenuRedesignFeatureFlag,
  );

  const safeChainsList = useRef([]);

  useEffect(() => {
    Object.values(BUILT_IN_NETWORKS).forEach((network) => {
      const index = safeChains.findIndex(
        (chain) =>
          chain.chainId.toString() === getDisplayChainId(network.chainId),
      );
      if (network.ticker && index !== -1) {
        safeChains[index].nativeCurrency.symbol = network.ticker;
      }
    });
    safeChainsList.current = [
      ...safeChains,
      {
        chainId: 137,
        nativeCurrency: {
          symbol: CHAINLIST_CURRENCY_SYMBOLS_MAP_NETWORK_COLLISION.MATIC,
        },
      },
      {
        chainId: 78,
        nativeCurrency: {
          symbol: CHAINLIST_CURRENCY_SYMBOLS_MAP_NETWORK_COLLISION.WETHIO,
        },
      },
      {
        chainId: 88888,
        nativeCurrency: {
          symbol: CHAINLIST_CURRENCY_SYMBOLS_MAP_NETWORK_COLLISION.CHZ,
        },
      },
    ];
  }, [safeChains]);

  const resetForm = useCallback(() => {
    setNetworkName(selectedNetworkName || '');
    setRpcUrl(selectedNetwork.rpcUrl);
    setChainId(getDisplayChainId(selectedNetwork.chainId));
    setTicker(selectedNetwork?.ticker);
    setBlockExplorerUrl(selectedNetwork?.blockExplorerUrl);
    setErrors({});
    setWarnings({});
    setSuggestedTicker([]);
    setSuggestedNames([]);
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
    if (
      !prevAddNewNetwork.current &&
      addNewNetwork &&
      prevActionMode !== ACTION_MODES.ADD
    ) {
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
    prevActionMode,
  ]);

  const newOrderNetworks = () => {
    if (!orderedNetworksList || orderedNetworksList.length === 0) {
      return nonTestNetworks;
    }

    // Create a mapping of chainId to index in orderedNetworksList
    const orderedIndexMap = {};
    orderedNetworksList.forEach((network, index) => {
      orderedIndexMap[`${network.networkId}_${network.networkRpcUrl}`] = index;
    });

    // Sort nonTestNetworks based on the order in orderedNetworksList
    const sortedNonTestNetworks = nonTestNetworks.sort((a, b) => {
      const keyA = `${a.chainId}_${a.rpcUrl}`;
      const keyB = `${b.chainId}_${b.rpcUrl}`;
      return orderedIndexMap[keyA] - orderedIndexMap[keyB];
    });

    return sortedNonTestNetworks;
  };

  const handleEditNetworkClick = () => {
    const networksList = networkMenuRedesign
      ? nonTestNetworks
      : newOrderNetworks();

    const networkToEdit = Object.values(networksList).find(
      (network) =>
        getDisplayChainId(chainId) === getDisplayChainId(network.chainId),
    );

    if (networkToEdit) {
      onEditNetwork(networkToEdit);
    }
  };

  useEffect(() => {
    return () => {
      if (prevActionMode !== ACTION_MODES.ADD) {
        setNetworkName('');
        setRpcUrl('');
        setChainId('');
      }
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
    prevActionMode,
  ]);

  const autoSuggestTicker = useCallback((formChainId) => {
    const decimalChainId = getDisplayChainId(formChainId);
    if (decimalChainId.trim() === '' || safeChainsList.current.length === 0) {
      setSuggestedTicker([]);
      return;
    }
    const matchedChain = safeChainsList.current?.find(
      (chain) => chain.chainId.toString() === decimalChainId,
    );

    const matchedSymbol = safeChainsList.current?.reduce(
      (accumulator, currentNetwork) => {
        if (currentNetwork.chainId.toString() === decimalChainId) {
          accumulator.push(currentNetwork.nativeCurrency?.symbol);
        }
        return accumulator;
      },
      [],
    );

    if (matchedChain === undefined) {
      setSuggestedTicker([]);
      return;
    }
    setSuggestedTicker([...matchedSymbol]);
  }, []);

  const autoSuggestName = useCallback((formChainId) => {
    const decimalChainId = getDisplayChainId(formChainId);
    if (decimalChainId.trim() === '' || safeChainsList.current.length === 0) {
      setSuggestedNames([]);
      return;
    }
    const matchedChain = safeChainsList.current?.find(
      (chain) => chain.chainId.toString() === decimalChainId,
    );

    const matchedNames = safeChainsList.current?.reduce(
      (accumulator, currentNetwork) => {
        if (currentNetwork.chainId.toString() === decimalChainId) {
          accumulator.push(currentNetwork?.name);
        }
        return accumulator;
      },
      [],
    );

    if (matchedChain === undefined) {
      setSuggestedNames([]);
      return;
    }
    setSuggestedNames([...matchedNames]);
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

  const networksList = Object.values(orderedNetworksList);
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

      if (
        addNewNetwork &&
        networksList.some(
          (network) =>
            getDisplayChainId(chainArg) ===
              parseInt(network.networkId, BASE_HEX).toString(BASE_DECIMAL) &&
            rpcUrl === network.networkRpcUrl,
        )
      ) {
        return {
          error: {
            key: 'existingChainId',
          },
        };
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
          if (networkMenuRedesign) {
            errorMessage = t('wrongChainId');
          } else {
            errorMessage = t('endpointReturnedDifferentChainId', [
              endpointChainId.length <= MAX_CHAIN_ID_LENGTH
                ? endpointChainId
                : `${endpointChainId.slice(0, 9)}...`,
            ]);
          }
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
      autoSuggestName(formChainId);
      return null;
    },
    [
      rpcUrl,
      networksToRender,
      t,
      addNewNetwork,
      autoSuggestName,
      autoSuggestTicker,
      orderedNetworksList,
    ],
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
        const matchedChain = getMatchedChain(
          decimalChainId,
          safeChainsList.current,
        );
        const matchedSymbols = getMatchedSymbols(
          decimalChainId,
          safeChainsList.current,
        );

        if (matchedChain === undefined) {
          warningKey = 'failedToFetchTickerSymbolData';
          warningMessage = t('failedToFetchTickerSymbolData');
        } else if (
          !matchedSymbols.some(
            (symbol) => symbol.toLowerCase() === formTickerSymbol.toLowerCase(),
          )
        ) {
          warningKey = 'chainListReturnedDifferentTickerSymbol';
          warningMessage = t('chainListReturnedDifferentTickerSymbol');
          setSuggestedTicker([...matchedSymbols]);
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

  const validateNetworkName = useCallback(
    async (formChainId, formName) => {
      let warningKey;
      let warningMessage;
      const decimalChainId = getDisplayChainId(formChainId);

      let hexChainId = formChainId;
      if (!formChainId.startsWith('0x')) {
        try {
          hexChainId = `0x${decimalToHex(formChainId)}`;
        } catch (err) {
          return {
            error: {
              key: 'invalidHexNumber',
              msg: t('invalidHexNumber'),
            },
          };
        }
      }

      const isMatchedName = NETWORK_TO_NAME_MAP[hexChainId] === formName;

      if (!decimalChainId || !formName || isMatchedName) {
        setSuggestedNames([]);
        return null;
      }

      if (safeChainsList.current.length === 0) {
        warningKey = 'failedToFetchTickerSymbolData';
        warningMessage = t('failedToFetchTickerSymbolData');
      } else {
        const matchedChain = getMatchedChain(
          decimalChainId,
          safeChainsList.current,
        );

        const matchedNames = getMatchedNames(
          decimalChainId,
          safeChainsList.current,
        );
        setSuggestedNames([...matchedNames]);

        if (matchedChain === undefined) {
          warningKey = 'failedToFetchTickerSymbolData';
          warningMessage = t('failedToFetchTickerSymbolData');
        } else if (
          !matchedNames.some(
            (name) => name?.toLowerCase() === formName.toLowerCase(),
          )
        ) {
          warningKey = 'wrongNetworkName';
          warningMessage = t('wrongNetworkName');
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
    async (url, formChainId) => {
      const decimalChainId = getDisplayChainId(formChainId);

      const [
        {
          rpcUrl: matchingRPCUrl = null,
          label: matchingRPCLabel,
          labelKey: matchingRPCLabelKey,
        } = {},
      ] = networksToRender.filter((e) => e.rpcUrl === url);
      const { rpcUrl: selectedNetworkRpcUrl } = selectedNetwork;

      if (
        networksList.some((network) => url === network.networkRpcUrl) &&
        addNewNetwork &&
        networkMenuRedesign
      ) {
        return {
          key: 'existingRpcUrl',
          msg: t('existingRpcUrl'),
        };
      }

      if (!url || (!decimalChainId && networkMenuRedesign)) {
        return null;
      }

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

      if (networkMenuRedesign) {
        let endpointChainId;
        let providerError;

        try {
          endpointChainId = await jsonRpcRequest(rpcUrl, 'eth_chainId');
        } catch (err) {
          log.warn('Failed to fetch the chainId from the endpoint.', err);
          providerError = err;
        }

        if (providerError || typeof endpointChainId !== 'string') {
          return {
            key: 'failedToFetchChainId',
            msg: t('unMatchedChain'),
          };
        }
      }

      return null;
    },
    [selectedNetwork, networksToRender, t, rpcUrl],
  );

  // validation effect
  const previousRpcUrl = usePrevious(rpcUrl);
  const previousChainId = usePrevious(chainId);
  const previousTicker = usePrevious(ticker);
  const previousBlockExplorerUrl = usePrevious(blockExplorerUrl);
  const previousNetworkName = usePrevious(networkName);

  useEffect(() => {
    if (viewOnly) {
      return;
    }

    if (
      previousRpcUrl === rpcUrl &&
      previousChainId === chainId &&
      previousTicker === ticker &&
      previousBlockExplorerUrl === blockExplorerUrl &&
      previousNetworkName === networkName
    ) {
      return;
    }
    async function validate() {
      const { error: chainIdError, warning: chainIdWarning } =
        (await validateChainId(chainId)) || {};
      const tickerWarning = await validateTickerSymbol(chainId, ticker);
      const nameWarning = await validateNetworkName(chainId, networkName);
      const blockExplorerError = validateBlockExplorerURL(blockExplorerUrl);
      const rpcUrlError = await validateRPCUrl(rpcUrl, chainId);

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
        networkName: nameWarning,
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
    networkName,
    label,
    previousRpcUrl,
    previousChainId,
    previousTicker,
    previousBlockExplorerUrl,
    previousNetworkName,
    validateBlockExplorerURL,
    validateChainId,
    validateTickerSymbol,
    validateRPCUrl,
    validateNetworkName,
  ]);

  const onSubmit = async () => {
    setIsSubmitting(true);
    if (networkMenuRedesign && addNewNetwork) {
      dispatch(toggleNetworkMenu());
      await dispatch(
        requestUserApproval({
          origin: ORIGIN_METAMASK,
          type: ApprovalType.AddEthereumChain,
          requestData: {
            chainId: prefixChainId(chainId),
            rpcUrl,
            ticker,
            imageUrl:
              CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[prefixChainId(chainId)] ?? '',
            chainName: networkName,
            rpcPrefs: {
              ...rpcPrefs,
              blockExplorerUrl: blockExplorerUrl || rpcPrefs?.blockExplorerUrl,
            },
            referrer: ORIGIN_METAMASK,
            source: MetaMetricsNetworkEventSource.NewAddNetworkFlow,
          },
        }),
      );
      return;
    }
    try {
      const formChainId = chainId.trim().toLowerCase();
      const prefixedChainId = prefixChainId(formChainId);
      let networkConfigurationId;
      // After this point, isSubmitting will be reset in componentDidUpdate
      if (prefixedChainId === CHAIN_IDS.GOERLI) {
        dispatch(showDeprecatedNetworkModal());
      } else if (selectedNetwork.rpcUrl && rpcUrl !== selectedNetwork.rpcUrl) {
        await dispatch(
          upsertNetworkConfiguration(
            {
              rpcUrl,
              ticker,
              id: selectedNetwork.networkConfigurationId,
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
              setActive: true,
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
              setActive: setActiveOnSubmit,
              source: MetaMetricsNetworkEventSource.CustomNetworkForm,
            },
          ),
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
          sensitiveProperties: {
            rpcUrl: rpcIdentifierUtility(rpcUrl, safeChains),
          },
        });
        if (networkMenuRedesign) {
          dispatch(
            setEditedNetwork({
              networkConfigurationId,
              nickname: networkName,
              editCompleted: true,
            }),
          );
        }
      }

      if (
        addNewNetwork &&
        !setActiveOnSubmit &&
        prefixedChainId !== CHAIN_IDS.GOERLI
      ) {
        dispatch(
          setNewNetworkAdded({
            nickname: networkName,
            networkConfigurationId,
          }),
        );
      }
      submitCallback?.();
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

  const isPopularNetwork = Object.values(FEATURED_RPCS).some(
    (network) =>
      getDisplayChainId(chainId) === getDisplayChainId(network.chainId) &&
      rpcUrl === network.rpcUrl,
  );

  const isDefaultNetwork = (networkId, rpcUrlLink, targetChainId) =>
    getDisplayChainId(networkId) === parseInt(targetChainId, 16).toString(10) &&
    rpcUrlLink === CHAIN_ID_TO_RPC_URL_MAP[targetChainId];

  const isDefaultMainnet = isDefaultNetwork(chainId, rpcUrl, CHAIN_IDS.MAINNET);
  const isDefaultLineaMainnet = isDefaultNetwork(
    chainId,
    rpcUrl,
    CHAIN_IDS.LINEA_MAINNET,
  );
  const isDefaultSepoliaTestnet = isDefaultNetwork(
    chainId,
    rpcUrl,
    CHAIN_IDS.SEPOLIA,
  );
  const isDefaultLineaSepoliaTestnet = isDefaultNetwork(
    chainId,
    rpcUrl,
    CHAIN_IDS.LINEA_SEPOLIA,
  );

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

  let displayRpcUrl = rpcUrl?.includes(`/v3/${infuraProjectId}`)
    ? rpcUrl.replace(`/v3/${infuraProjectId}`, '')
    : rpcUrl;
  if (viewOnly) {
    displayRpcUrl = displayRpcUrl?.toLowerCase();
  }

  const disableEdit =
    viewOnly ||
    isDefaultMainnet ||
    isDefaultLineaMainnet ||
    isDefaultLineaSepoliaTestnet ||
    isDefaultSepoliaTestnet;

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      paddingBottom={2}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={1}
      className="networks-tab__scrollable"
    >
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
          <FormTextField
            paddingTop={4}
            paddingBottom={4}
            data-testid="network-form-name-input"
            helpText={
              suggestedNames &&
              suggestedNames.length > 0 &&
              !suggestedNames.some(
                (nameSuggested) => nameSuggested === networkName,
              ) ? (
                <Text
                  as="span"
                  variant={TextVariant.bodySm}
                  color={TextColor.textDefault}
                  data-testid="network-form-name-suggestion"
                >
                  {t('suggestedTokenName')}
                  {suggestedNames.map((suggestedName, i) => (
                    <ButtonLink
                      as="button"
                      variant={TextVariant.bodySm}
                      color={TextColor.primaryDefault}
                      onClick={() => {
                        setNetworkName(suggestedName);
                        setNetworkFormInformation((prevState) => ({
                          ...prevState,
                          networkNameForm: suggestedName,
                        }));
                      }}
                      paddingLeft={1}
                      paddingRight={1}
                      style={{ verticalAlign: 'baseline' }}
                      key={i}
                    >
                      {suggestedName}
                    </ButtonLink>
                  ))}
                </Text>
              ) : null
            }
            onChange={(e) => {
              setIsEditing(true);
              setNetworkName(e.target?.value);
              setNetworkFormInformation((prevState) => ({
                ...prevState,
                networkNameForm: e.target?.value ?? '',
              }));
            }}
            label={t('networkName')}
            labelProps={{
              variant: TextVariant.bodySm,
              fontWeight: FontWeight.Bold,
              paddingBottom: 1,
              paddingTop: 1,
            }}
            inputProps={{
              paddingLeft: 2,
              variant: TextVariant.bodySm,
              'data-testid': 'network-form-network-name',
            }}
            value={networkName}
            disabled={disableEdit && !addNewNetwork}
          />
          {errors.networkName?.msg ? (
            <HelpText
              severity={HelpTextSeverity.Danger}
              marginTop={1}
              data-testid="network-form-network-name-error"
            >
              {errors.networkName.msg}
            </HelpText>
          ) : null}
          {warnings.networkName?.msg ? (
            <HelpText
              severity={HelpTextSeverity.Warning}
              marginTop={1}
              data-testid="network-form-network-name-warning"
            >
              {warnings.networkName.msg}
            </HelpText>
          ) : null}

          <FormField
            onChange={(value) => {
              setIsEditing(true);
              setRpcUrl(value);
            }}
            titleText={t('rpcUrl')}
            value={displayRpcUrl}
            disabled={disableEdit && !addNewNetwork}
            dataTestId="network-form-rpc-url"
          />

          {errors.rpcUrl?.msg ? (
            <HelpText
              severity={HelpTextSeverity.Danger}
              marginTop={1}
              data-testid="network-form-rpc-url-error"
            >
              {errors.rpcUrl.msg}
            </HelpText>
          ) : null}
          <FormTextField
            paddingTop={4}
            data-testid="network-form-chain-id-input"
            onChange={(e) => {
              setIsEditing(true);
              setChainId(e.target?.value);
              autoSuggestTicker(e.target?.value);
              autoSuggestName(e.target?.value);
              setNetworkFormInformation((prevState) => ({
                ...prevState,
                networkChainIdForm: e.target?.value ?? '',
              }));
            }}
            label={
              viewOnly || networkMenuRedesign ? (
                t('chainId')
              ) : (
                <>
                  {t('chainId')}
                  <Box paddingLeft={2}>
                    <InfoTooltip
                      position="top"
                      contentText={t('networkSettingsChainIdDescription')}
                    />
                  </Box>
                </>
              )
            }
            labelProps={{
              variant: TextVariant.bodySm,
              fontWeight: FontWeight.Bold,
              paddingBottom: 1,
              paddingTop: 1,
            }}
            inputProps={{
              paddingLeft: 2,
              variant: TextVariant.bodySm,
              'data-testid': 'network-form-chain-id',
            }}
            value={chainId}
            disabled={(disableEdit || isPopularNetwork) && !addNewNetwork}
          />

          {warnings.chainId?.msg ? (
            <HelpText
              severity={HelpTextSeverity.Warning}
              marginTop={1}
              data-testid="network-form-chain-id-error"
            >
              {warnings.chainId?.msg}
            </HelpText>
          ) : null}
          {errors.chainId?.msg ? (
            <HelpText
              severity={HelpTextSeverity.Danger}
              marginTop={1}
              data-testid="network-form-chain-id-error"
            >
              {errors.chainId.msg}
            </HelpText>
          ) : null}
          {errors.chainId?.key === 'endpointReturnedDifferentChainId' &&
          networkMenuRedesign ? (
            <Box>
              <HelpText
                severity={HelpTextSeverity.Danger}
                marginTop={1}
                data-testid="network-form-chain-id-error"
              >
                {t('findTheRightChainId')}{' '}
                <ButtonLink
                  as="button"
                  variant={TextVariant.bodyXs}
                  color={TextColor.primaryDefault}
                  onClick={() => {
                    global.platform.openTab({
                      url: CHAIN_LIST_URL,
                    });
                  }}
                  endIconName={IconName.Export}
                  endIconProps={{
                    size: IconSize.Xs,
                  }}
                >
                  chainid.network
                </ButtonLink>
              </HelpText>
            </Box>
          ) : null}
          {errors.chainId?.key === 'existingChainId' ? (
            <Box>
              <HelpText
                severity={HelpTextSeverity.Danger}
                marginTop={1}
                data-testid="network-form-chain-id-error"
              >
                {t('existingChainId')}
              </HelpText>
              <HelpText
                severity={HelpTextSeverity.Danger}
                marginTop={1}
                data-testid="network-form-chain-id-error"
              >
                {t('updateOrEditNetworkInformations')}{' '}
                <ButtonLink
                  as="button"
                  variant={TextVariant.bodyXs}
                  color={TextColor.primaryDefault}
                  onClick={handleEditNetworkClick}
                >
                  {t('editNetworkLink')}
                </ButtonLink>
              </HelpText>
            </Box>
          ) : null}
          <FormTextField
            paddingTop={4}
            data-testid="network-form-ticker"
            helpText={
              suggestedTicker &&
              suggestedTicker.length > 0 &&
              !suggestedTicker.some(
                (symbolSuggested) => symbolSuggested === ticker,
              ) ? (
                <Text
                  as="span"
                  variant={TextVariant.bodySm}
                  color={TextColor.textDefault}
                  data-testid="network-form-ticker-suggestion"
                >
                  {t('suggestedTokenSymbol')}
                  {suggestedTicker.map((suggestedSymbol, i) => (
                    <ButtonLink
                      as="button"
                      variant={TextVariant.bodySm}
                      color={TextColor.primaryDefault}
                      onClick={() => {
                        setTicker(suggestedSymbol);
                        setNetworkFormInformation((prevState) => ({
                          ...prevState,
                          networkTickerForm: suggestedSymbol,
                        }));
                      }}
                      paddingLeft={1}
                      paddingRight={1}
                      style={{ verticalAlign: 'baseline' }}
                      key={i}
                    >
                      {suggestedSymbol}
                    </ButtonLink>
                  ))}
                </Text>
              ) : null
            }
            onChange={(e) => {
              setIsEditing(true);
              setTicker(e.target?.value);
              setNetworkFormInformation((prevState) => ({
                ...prevState,
                networkTickerForm: e.target?.value ?? '',
              }));
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
            disabled={disableEdit && !addNewNetwork}
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
          <FormTextField
            paddingTop={4}
            data-testid="network-form-block-explorer-url-input"
            onChange={(e) => {
              setIsEditing(true);
              setBlockExplorerUrl(e.target?.value);
            }}
            label={`${t('blockExplorerUrl')} ${t('optionalWithParanthesis')}`}
            labelProps={{
              variant: TextVariant.bodySm,
              fontWeight: FontWeight.Bold,
              paddingBottom: 1,
              paddingTop: 1,
            }}
            inputProps={{
              paddingLeft: 2,
              variant: TextVariant.bodySm,
              'data-testid': 'network-form-block-explorer-url',
            }}
            value={blockExplorerUrl ?? ''}
            disabled={disableEdit && !addNewNetwork}
            autoFocus={
              window.location.hash.split('#')[2] === 'blockExplorerUrl'
            }
          />
          {errors.blockExplorerUrl?.msg ? (
            <HelpText
              severity={HelpTextSeverity.Danger}
              marginTop={1}
              data-testid="network-form-block-explorer-url-error"
            >
              {errors.blockExplorerUrl.msg}
            </HelpText>
          ) : null}
        </div>
      </div>
      {networkMenuRedesign ? (
        <Box
          backgroundColor={BackgroundColor.backgroundDefault}
          textAlign={TextAlign.Center}
          paddingTop={4}
          paddingLeft={4}
          paddingRight={4}
          width={BlockSize.Full}
        >
          <ButtonPrimary
            disabled={isSubmitDisabled}
            onClick={() => {
              onSubmit();
              if (!networkMenuRedesign || !addNewNetwork) {
                dispatch(toggleNetworkMenu());
              }
            }}
            size={ButtonPrimarySize.Lg}
            width={BlockSize.Full}
            alignItems={AlignItems.center}
          >
            {addNewNetwork ? t('next') : t('save')}
          </ButtonPrimary>
        </Box>
      ) : (
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
                dataTestId="network-form-network-save-button"
              >
                {t('save')}
              </Button>
            </>
          )}
        </div>
      )}
    </Box>
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
  setActiveOnSubmit: PropTypes.bool,
  onEditNetwork: PropTypes.func,
  prevActionMode: PropTypes.string,
  networkFormInformation: PropTypes.object,
  setNetworkFormInformation: PropTypes.func,
};

NetworksForm.defaultProps = {
  selectedNetwork: {},
};

export default NetworksForm;
