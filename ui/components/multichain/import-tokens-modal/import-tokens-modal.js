import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import {
  formatChainIdToHex,
  formatChainIdToCaip,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getTokenTrackerLink } from '@metamask/etherscan-link/dist/token-tracker-link';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { NON_EVM_TESTNET_IDS } from '@metamask/multichain-network-controller';
import { Tab, Tabs } from '../../ui/tabs';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getAllNetworkConfigurationsByCaipChainId,
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../shared/modules/selectors/networks';
import {
  getInternalAccounts,
  getSelectedInternalAccount,
  getTokenDetectionSupportNetworkByChainId,
  getTestNetworkBackgroundColor,
  getTokenExchangeRates,
  getPendingTokens,
  getTokenNetworkFilter,
  getAllTokens,
  getEnabledNetworksByNamespace,
} from '../../../selectors';
import {
  addImportedTokens,
  multichainAddAssets,
  clearPendingTokens,
  setPendingTokens,
  showImportNftsModal,
  setNewTokensImported,
  setNewTokensImportedError,
  hideImportTokensModal,
  setConfirmationExchangeRates,
  getTokenStandardAndDetailsByChain,
  getCode,
} from '../../../store/actions';
import {
  BannerAlert,
  Box,
  ButtonLink,
  ButtonPrimary,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  ButtonSecondary,
  IconName,
  Icon,
  IconSize,
  ModalBody,
  AvatarNetworkSize,
  Checkbox,
  Tag,
} from '../../component-library';
import { FormTextField } from '../../component-library/form-text-field/deprecated';
import TokenSearch from '../../app/import-token/token-search';
import TokenList from '../../app/import-token/token-list';

import {
  BlockSize,
  Display,
  FlexDirection,
  Severity,
  Size,
  TextAlign,
  TextColor,
  TextVariant,
  FontWeight,
  AlignItems,
  BorderRadius,
  BorderColor,
  BackgroundColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import {
  SECURITY_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import {
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../../../shared/modules/hexstring-utils';
// eslint-disable-next-line import/no-restricted-paths
import { addHexPrefix } from '../../../../app/scripts/lib/util';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../../shared/constants/tokens';
import {
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';
import {
  getURLHostName,
  fetchTokenExchangeRates,
} from '../../../helpers/utils/util';
import { tokenInfoGetter } from '../../../helpers/utils/token-util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../shared/constants/metametrics';
import { isEvmChainId, toAssetId } from '../../../../shared/lib/asset-utils';
import { NetworkSelectorCustomImport } from '../../app/import-token/network-selector-custom-import';
import { getImageForChainId } from '../../../selectors/multichain';
import { getSelectedMultichainNetworkChainId } from '../../../selectors/multichain/networks';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import { NetworkListItem } from '../network-list-item';
import TokenListPlaceholder from '../../app/import-token/token-list/token-list-placeholder';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import { isGlobalNetworkSelectorRemoved } from '../../../selectors/selectors';
import { useTokensWithFiltering } from '../../../hooks/bridge/useTokensWithFiltering';
import { ImportTokensModalConfirm } from './import-tokens-modal-confirm';

const ACTION_MODES = {
  // Displays the import token modal
  IMPORT_TOKEN: 'IMPORT_TOKEN',
  // Displays the page for selecting a network from custom import
  NETWORK_SELECTOR: 'NETWORK_SELECTOR',
};

const TAB_NAMES = {
  SEARCH: 'search',
  CUSTOM_TOKEN: 'customToken',
};

export const ImportTokensModal = ({ onClose }) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [mode, setMode] = useState('');

  const [tokenSelectorError, setTokenSelectorError] = useState(null);
  const [selectedTokens, setSelectedTokens] = useState({});
  const [searchResults, setSearchResults] = useState([]);

  const chainId = useSelector(getCurrentChainId);
  const currentMultichainChainId = useSelector(
    getSelectedMultichainNetworkChainId,
  );

  const [selectedNetwork, setSelectedNetwork] = useState(chainId);

  const allNetworkConfigurations = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );

  const allNetworks = useMemo(() => {
    return Object.fromEntries(
      Object.entries(allNetworkConfigurations).filter(
        ([key]) => !NON_EVM_TESTNET_IDS.includes(key),
      ),
    );
  }, [allNetworkConfigurations]);

  // Tracks which page the user is on
  const [actionMode, setActionMode] = useState(ACTION_MODES.IMPORT_TOKEN);

  const tokenNetworkFilter = useSelector(getTokenNetworkFilter);
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const [networkFilter, setNetworkFilter] = useState(
    isGlobalNetworkSelectorRemoved
      ? enabledNetworksByNamespace
      : tokenNetworkFilter,
  );

  // Initialize selected network with current multichain network, handling both EVM and non-EVM
  useEffect(() => {
    if (!selectedNetwork || selectedNetwork === chainId) {
      // Initialize or update with the current multichain network
      if (currentMultichainChainId) {
        if (isEvmChainId(currentMultichainChainId)) {
          // For EVM networks, convert from CAIP format to hex
          const hexChainId = formatChainIdToHex(currentMultichainChainId);
          setSelectedNetwork(hexChainId);
        } else {
          // For non-EVM networks, use the chain ID directly
          setSelectedNetwork(currentMultichainChainId);
        }
      } else if (!selectedNetwork) {
        // Fallback to default EVM chain if no multichain network selected
        setSelectedNetwork(chainId);
      }
    }
  }, [currentMultichainChainId, chainId, selectedNetwork]); // This should not be executed when selectedNetwork changes

  const useTokenDetection = useSelector(
    ({ metamask }) => metamask.useTokenDetection,
  );

  const networkName = useSelector(getTokenDetectionSupportNetworkByChainId);
  const nativeCurrency = useSelector(getNativeCurrency);

  const selectedAccount = useSelector(getSelectedInternalAccount);
  const accounts = useSelector(getInternalAccounts);
  const allTokens = useSelector(getAllTokens);
  const contractExchangeRates = useSelector(getTokenExchangeRates);

  // Use the new useTokensWithFiltering hook for getting token data
  const { filteredTokenListGenerator, isLoading } = useTokensWithFiltering(
    selectedNetwork,
    null,
    selectedAccount?.address,
  );

  const shouldAddToken = useCallback(
    (_symbol, _address, tokenChainId) => {
      if (!tokenChainId || !selectedNetwork) {
        return false;
      }

      return tokenChainId === selectedNetwork;
    },
    [selectedNetwork],
  );

  // Convert generator to token list for compatibility with existing components
  const tokenListByChain = useMemo(() => {
    if (!filteredTokenListGenerator) {
      return {};
    }

    const tokenData = {};
    for (const token of filteredTokenListGenerator(shouldAddToken)) {
      if (token.address) {
        tokenData[token.address.toLowerCase()] = {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          iconUrl: token.image,
          aggregators: token.aggregators,
          occurrences: token.occurrences,
        };
      }
    }

    return {
      [selectedNetwork]: {
        data: tokenData,
      },
    };
  }, [filteredTokenListGenerator, selectedNetwork, shouldAddToken]);

  const [customAddress, setCustomAddress] = useState('');
  const [customAddressError, setCustomAddressError] = useState(null);
  const [nftAddressError, setNftAddressError] = useState(null);
  const [decimalAutoFilled, setDecimalAutoFilled] = useState(false);
  const [mainnetTokenWarning, setMainnetTokenWarning] = useState(null);
  const [customSymbol, setCustomSymbol] = useState('');
  const [customName, setCustomName] = useState('');
  const [customSymbolError, setCustomSymbolError] = useState(null);
  const [customDecimals, setCustomDecimals] = useState(0);
  const [customDecimalsError, setCustomDecimalsError] = useState(null);
  const [tokenStandard, setTokenStandard] = useState(TokenStandard.none);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);
  const [showSymbolAndDecimals, setShowSymbolAndDecimals] = useState(false);
  const [multichainChains, setMultichainChains] = useState([]);
  const [selectedChainsForImport, setSelectedChainsForImport] = useState([]);
  const [chainsWhereTokenExists, setChainsWhereTokenExists] = useState([]);
  const [isDetectingChains, setIsDetectingChains] = useState(false);
  // Ref to track the address currently being detected to prevent race conditions
  const detectingAddressRef = useRef(null);

  const blockExplorerUrl =
    networkConfigurations[selectedNetwork]?.blockExplorerUrls?.[
      networkConfigurations[selectedNetwork]?.defaultBlockExplorerUrlIndex
    ] ?? null;

  const blockExplorerTokenLink = getTokenTrackerLink(
    customAddress,
    selectedNetwork,
    null,
    null,
    { blockExplorerUrl },
  );

  const blockExplorerLabel = blockExplorerTokenLink
    ? getURLHostName(blockExplorerTokenLink)
    : t('etherscan');

  // Min and Max decimal values
  const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
  const MIN_DECIMAL_VALUE = 0;
  const MAX_DECIMAL_VALUE = 36;

  const infoGetter = useRef(tokenInfoGetter());

  // CONFIRMATION MODE
  const trackEvent = useContext(MetaMetricsContext);
  const pendingTokens = useSelector(getPendingTokens);

  // Get accounts for non-EVM chains using the account tree selector
  const getAccountForChain = useSelector((state) => {
    return (caipChainId) =>
      getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId);
  });

  const handleAddTokens = useCallback(async () => {
    try {
      const addedTokenValues = Object.values(pendingTokens);

      if (addedTokenValues.length === 0) {
        return;
      }

      const hasMultichainImport =
        selectedChainsForImport.length > 0 &&
        customAddress &&
        customSymbol &&
        customDecimals !== undefined;

      if (hasMultichainImport) {
        const allChainsToImport = [
          selectedNetwork,
          ...selectedChainsForImport.filter((id) => id !== selectedNetwork),
        ];

        const importPromises = allChainsToImport.map(async (targetChainId) => {
          const chainConfig =
            allNetworks[targetChainId] || networkConfigurations[targetChainId];
          if (!chainConfig) {
            console.warn(`No network config found for chain ${targetChainId}`);
            return;
          }

          let networkClientId;
          if (isNonEvmChainId(targetChainId)) {
            const accountForChain = getAccountForChain(targetChainId);
            if (!accountForChain) {
              console.warn(`No account found for chain ${targetChainId}`);
              return;
            }

            const assetId = toAssetId(customAddress, targetChainId);
            if (assetId) {
              await dispatch(
                multichainAddAssets([assetId], accountForChain.id),
              );

              trackEvent({
                event: MetaMetricsEventName.TokenAdded,
                category: MetaMetricsEventCategory.Wallet,
                sensitiveProperties: {
                  token_symbol: customSymbol,
                  token_contract_address: customAddress,
                  token_decimal_precision: customDecimals,
                  source_connection_method: MetaMetricsTokenEventSource.Custom,
                  token_standard: TokenStandard.none,
                  asset_type: AssetType.token,
                  chain_id: targetChainId,
                },
              });
            }
          } else {
            const defaultRpcIndex = chainConfig.defaultRpcEndpointIndex ?? 0;
            networkClientId =
              chainConfig.rpcEndpoints?.[defaultRpcIndex]?.networkClientId;

            if (!networkClientId) {
              console.warn(
                `No network client ID found for chain ${targetChainId}`,
              );
              return;
            }

            const tokenForChain = {
              address: customAddress,
              symbol: customSymbol,
              decimals: customDecimals,
              chainId: targetChainId,
              name: customName || customSymbol,
              standard: tokenStandard,
              isCustom: true,
            };

            await dispatch(addImportedTokens([tokenForChain], networkClientId));

            // Track event for EVM
            trackEvent({
              event: MetaMetricsEventName.TokenAdded,
              category: MetaMetricsEventCategory.Wallet,
              sensitiveProperties: {
                token_symbol: customSymbol,
                token_contract_address: customAddress,
                token_decimal_precision: customDecimals,
                source_connection_method: MetaMetricsTokenEventSource.Custom,
                token_standard: TokenStandard.ERC20,
                asset_type: AssetType.token,
                chain_id: targetChainId,
              },
            });
          }
        });

        await Promise.all(importPromises);

        dispatch(setNewTokensImported(customSymbol));
        dispatch(clearPendingTokens());
        dispatch(hideImportTokensModal());
        navigate(DEFAULT_ROUTE);
        return;
      }

      const { chainId: tokenChainId } = addedTokenValues[0];
      const isNonEvm = isNonEvmChainId(tokenChainId);

      if (isNonEvm) {
        const accountForChain = getAccountForChain(tokenChainId);

        if (!accountForChain) {
          console.warn(`No account found for chain ${tokenChainId}`);
          return;
        }

        const assetIds = addedTokenValues
          .map((token) => {
            const assetId =
              token.assetId || toAssetId(token.address, tokenChainId);

            if (!assetId) {
              console.warn(
                `Failed to create assetId for token ${token.address} on chain ${tokenChainId}`,
              );
              return null;
            }

            return assetId;
          })
          .filter((assetId) => assetId !== null);

        if (assetIds.length > 0) {
          await dispatch(multichainAddAssets(assetIds, accountForChain.id));
        }
      } else {
        const networkConfig = networkConfigurations[tokenChainId];
        if (!networkConfig) {
          console.warn(`No network config found for chain ${tokenChainId}`);
          return;
        }

        const clientId =
          networkConfig.rpcEndpoints[networkConfig.defaultRpcEndpointIndex]
            ?.networkClientId;

        if (!clientId) {
          console.warn(`No network client ID found for chain ${tokenChainId}`);
          return;
        }

        await dispatch(addImportedTokens(addedTokenValues, clientId));
      }

      addedTokenValues.forEach((pendingToken) => {
        trackEvent({
          event: MetaMetricsEventName.TokenAdded,
          category: MetaMetricsEventCategory.Wallet,
          sensitiveProperties: {
            token_symbol: pendingToken.symbol,
            token_contract_address: pendingToken.address,
            token_decimal_precision: pendingToken.decimals,
            unlisted: pendingToken.unlisted,
            source_connection_method: pendingToken.isCustom
              ? MetaMetricsTokenEventSource.Custom
              : MetaMetricsTokenEventSource.List,
            token_standard: isNonEvm ? TokenStandard.none : TokenStandard.ERC20,
            asset_type: AssetType.token,
          },
        });
      });
      const tokenSymbols = [];
      for (const key in pendingTokens) {
        if (Object.prototype.hasOwnProperty.call(pendingTokens, key)) {
          tokenSymbols.push(pendingTokens[key].symbol);
        }
      }

      dispatch(setNewTokensImported(tokenSymbols.join(', ')));
      dispatch(clearPendingTokens());
      dispatch(hideImportTokensModal());
      navigate(DEFAULT_ROUTE);
    } catch (err) {
      dispatch(setNewTokensImportedError('error'));
      dispatch(clearPendingTokens());
      navigate(DEFAULT_ROUTE);
    }
  }, [
    dispatch,
    navigate,
    pendingTokens,
    trackEvent,
    networkConfigurations,
    getAccountForChain,
    selectedChainsForImport,
    customAddress,
    customSymbol,
    customDecimals,
    customName,
    tokenStandard,
    selectedNetwork,
    allNetworks,
  ]);

  // Detects which chains the token contract actually exists on
  const detectTokenOnChains = useCallback(
    async (address) => {
      if (
        !address ||
        !isValidHexAddress(address, { allowNonPrefixed: false })
      ) {
        return [];
      }

      // Store the address we're detecting to prevent race conditions
      detectingAddressRef.current = address;
      setIsDetectingChains(true);
      // Popular EVM chains to check (mainnet and testnet)
      const chainsToCheck = [
        CHAIN_IDS.MAINNET,
        CHAIN_IDS.BASE,
        CHAIN_IDS.ARBITRUM,
        CHAIN_IDS.BNB_CHAIN,
        CHAIN_IDS.POLYGON,
        CHAIN_IDS.OPTIMISM,
        CHAIN_IDS.AVALANCHE,
        CHAIN_IDS.LINEA_MAINNET,
        CHAIN_IDS.SEPOLIA,
        CHAIN_IDS.GOERLI,
        CHAIN_IDS.BASE_SEPOLIA,
        CHAIN_IDS.ARBITRUM_SEPOLIA,
        CHAIN_IDS.MEGAETH_TESTNET,
        CHAIN_IDS.MONAD_TESTNET,
      ];

      const checkPromises = chainsToCheck.map(async (checkChainId) => {
        try {
          const chainConfig =
            allNetworks[checkChainId] || networkConfigurations[checkChainId];
          if (!chainConfig) {
            return null;
          }

          const defaultRpcIndex = chainConfig.defaultRpcEndpointIndex ?? 0;
          const networkClientId =
            chainConfig.rpcEndpoints?.[defaultRpcIndex]?.networkClientId;

          if (!networkClientId) {
            return null;
          }

          const code = await getCode(address, networkClientId);
          const contractExists = code && code !== '0x' && code !== '0x0';

          if (contractExists) {
            return checkChainId;
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.all(checkPromises);
      const existingChains = results.filter(Boolean);

      // Only update state if the address being detected still matches the current customAddress
      // This prevents race conditions where an older detection completes after a newer one
      setChainsWhereTokenExists((prevChains) => {
        // Check if the address we're detecting is still the current one
        if (detectingAddressRef.current === address) {
          return existingChains;
        }
        // If address has changed, return previous state to avoid stale updates
        return prevChains;
      });
      setIsDetectingChains((prevIsDetecting) => {
        // Only set to false if this is still the current detection
        if (detectingAddressRef.current === address) {
          return false;
        }
        return prevIsDetecting;
      });

      return existingChains;
    },
    [allNetworks, networkConfigurations],
  );

  useEffect(() => {
    const pendingTokenKeys = Object.keys(pendingTokens);

    if (pendingTokenKeys.length === 0) {
      return;
    }

    let initialSelectedTokens = {};
    let initialCustomToken = {};

    pendingTokenKeys.forEach((tokenAddress) => {
      const token = pendingTokens[tokenAddress];
      const { isCustom } = token;

      if (isCustom) {
        initialCustomToken = { ...token };
      } else {
        initialSelectedTokens = {
          ...initialSelectedTokens,
          [tokenAddress]: { ...token },
        };
      }
    });

    setSelectedTokens(initialSelectedTokens);
    setCustomAddress(initialCustomToken.address);
    setCustomSymbol(initialCustomToken.symbol);
    setCustomDecimals(initialCustomToken.decimals);
  }, [pendingTokens]);

  useEffect(() => {
    if (selectedNetwork) {
      // For non-EVM networks, check allNetworks first (they use CAIP chain IDs)
      // For EVM networks, check networkConfigurations (they use hex chain IDs)
      const networkConfig =
        allNetworks[selectedNetwork] || networkConfigurations[selectedNetwork];
      if (networkConfig) {
        setNetworkFilter({
          [selectedNetwork]: networkConfig,
        });
      }
    }
  }, [selectedNetwork, networkConfigurations, allNetworks]);

  useEffect(() => {
    setSelectedTokens({});
  }, [networkFilter]);

  const handleCustomSymbolChange = useCallback(
    (value) => {
      const symbol = value.trim();
      const symbolLength = symbol.length;
      let symbolError = null;

      if (symbolLength <= 0 || symbolLength >= 12) {
        symbolError = t('symbolBetweenZeroTwelve');
      }

      setCustomSymbol(symbol);
      setCustomSymbolError(symbolError);
    },
    [t],
  );

  const handleCustomDecimalsChange = useCallback(
    (value) => {
      let decimals;
      let decimalsError = null;

      if (value) {
        decimals = Number(value.trim());
        decimalsError =
          value < MIN_DECIMAL_VALUE || value > MAX_DECIMAL_VALUE
            ? t('decimalsMustZerotoTen')
            : null;
      } else {
        decimals = '';
        decimalsError = t('tokenDecimalFetchFailed', [
          <ButtonLink
            className="import-tokens-modal__button-link"
            key="import-token-verify-token-decimal"
            rel="noopener noreferrer"
            target="_blank"
            href={blockExplorerTokenLink}
            endIconName={IconName.Export}
          >
            {blockExplorerLabel}
          </ButtonLink>,
        ]);
      }

      setCustomDecimals(decimals);
      setCustomDecimalsError(decimalsError);
    },
    [t, blockExplorerTokenLink, blockExplorerLabel],
  );

  const attemptToAutoFillTokenParams = useCallback(
    async (address) => {
      const {
        symbol = '',
        decimals,
        name = '',
      } = await infoGetter.current(
        address,
        tokenListByChain?.[selectedNetwork]?.data,
      );

      setDecimalAutoFilled(Boolean(decimals));
      handleCustomSymbolChange(symbol || '');
      handleCustomDecimalsChange(decimals);
      // Set custom token name
      setCustomName(name);
      setShowSymbolAndDecimals(true);
    },
    [
      selectedNetwork,
      tokenListByChain,
      handleCustomDecimalsChange,
      handleCustomSymbolChange,
    ],
  );

  useEffect(() => {
    const canAttemptAutofill =
      customAddress && // Address is present
      !customAddressError && // No general address error
      !nftAddressError && // Not an NFT address
      !mainnetTokenWarning; // Not a mainnet token on the wrong chain

    if (canAttemptAutofill) {
      attemptToAutoFillTokenParams(customAddress);
    }
  }, [
    customAddress,
    customAddressError,
    nftAddressError,
    mainnetTokenWarning,
    attemptToAutoFillTokenParams,
  ]);

  const clearAllFormData = () => {
    // Clear custom token fields
    setCustomAddress('');
    setCustomSymbol('');
    setCustomDecimals(0);
    setCustomName('');
    setShowSymbolAndDecimals(false);

    // Clear selected tokens and search results
    setSelectedTokens({});
    setSearchResults([]);

    // Clear all error states
    setTokenSelectorError(null);
    setCustomAddressError(null);
    setCustomSymbolError(null);
    setCustomDecimalsError(null);
    setNftAddressError(null);
    setMainnetTokenWarning(null);
    setDecimalAutoFilled(false);
  };

  const handleToggleToken = (token) => {
    const { address } = token;
    const selectedTokensCopy = { ...selectedTokens };

    if (address in selectedTokensCopy) {
      delete selectedTokensCopy[address];
    } else {
      selectedTokensCopy[address] = token;
    }

    setSelectedTokens(selectedTokensCopy);
    setTokenSelectorError(null);
  };

  const hasError = () => {
    return (
      tokenSelectorError ||
      customAddressError ||
      customSymbolError ||
      customDecimalsError ||
      nftAddressError
    );
  };

  const hasSelected = () => {
    return customAddress || Object.keys(selectedTokens).length > 0;
  };

  const handleNext = async () => {
    if (hasError()) {
      return;
    }

    if (!hasSelected()) {
      setTokenSelectorError(t('mustSelectOne'));
      return;
    }

    const tokenList = tokenListByChain?.[selectedNetwork]?.data ?? {};

    const tokenAddressList = Object.keys(tokenList);
    const customToken = customAddress
      ? {
          address: customAddress,
          symbol: customSymbol,
          decimals: customDecimals,
          standard: tokenStandard,
          name: customName,
          chainId: selectedNetwork,
        }
      : null;
    dispatch(
      setPendingTokens({ customToken, selectedTokens, tokenAddressList }),
    );

    const tempTokensToAdd = {
      ...selectedTokens,
      ...(customToken?.address && {
        [customToken.address]: {
          ...customToken,
        },
      }),
    };

    const tmpTokens = Object.values(tempTokensToAdd);
    const tmpTokensToDispatch = tmpTokens.filter(
      (elm) =>
        contractExchangeRates?.[toChecksumHexAddress(elm.address)] ===
        undefined,
    );

    const tokenAddresses = tmpTokensToDispatch.map((obj) => obj.address);
    if (tmpTokensToDispatch.length !== 0) {
      const result = await fetchTokenExchangeRates(
        nativeCurrency,
        tokenAddresses,
        selectedNetwork,
      );
      // dispatch action
      dispatch(setConfirmationExchangeRates(result));
    }
    setMode('confirm');
  };

  // Checks if a token address exists on multiple chains
  function checkTokenAcrossChains(
    address,
    allTokensByChain,
    accountAddress,
    currentChainId,
  ) {
    if (!address || !allTokensByChain || !accountAddress) {
      return { existsOnChains: [], isMultichain: false };
    }

    const existsOnChains = [];
    const lowerAddress = address.toLowerCase();

    // Check all chains
    Object.keys(allTokensByChain).forEach((tokenChainId) => {
      const tokensOnChain =
        allTokensByChain[tokenChainId]?.[accountAddress] || [];
      const exists = tokensOnChain.some(
        (token) => token.address.toLowerCase() === lowerAddress,
      );
      if (exists) {
        existsOnChains.push(tokenChainId);
      }
    });

    return {
      existsOnChains,
      isMultichain: existsOnChains.length > 0,
      existsOnCurrentChain: existsOnChains.includes(currentChainId),
    };
  }

  const handleCustomAddressChange = async (value) => {
    const address = value.trim();

    setCustomAddress(address);
    setCustomAddressError(null);
    setNftAddressError(null);
    setDecimalAutoFilled(false);
    setMainnetTokenWarning(null);
    setShowSymbolAndDecimals(false);
    // Reset detection ref when address changes to prevent race conditions
    detectingAddressRef.current = null;

    const addressIsValid = isValidHexAddress(address, {
      allowNonPrefixed: false,
    });
    const standardAddress = addHexPrefix(address).toLowerCase();

    const addressIsEmpty = address.length === 0 || address === EMPTY_ADDRESS;

    if (addressIsEmpty) {
      setCustomSymbol('');
      setCustomDecimals(0);
      setCustomSymbolError(null);
      setCustomDecimalsError(null);
      setChainsWhereTokenExists([]);
      return;
    }

    const isMainnetToken = Object.keys(STATIC_MAINNET_TOKEN_LIST).some(
      (key) => key.toLowerCase() === address.toLowerCase(),
    );

    let standard;
    if (addressIsValid) {
      try {
        ({ standard } = await getTokenStandardAndDetailsByChain(
          standardAddress,
          selectedAccount.address,
          null,
          selectedNetwork,
        ));
      } catch (error) {
        // ignore
      }
    }

    const multichainCheck =
      addressIsValid && !addressIsEmpty
        ? checkTokenAcrossChains(
            address,
            allTokens,
            selectedAccount.address,
            selectedNetwork,
          )
        : {
            existsOnChains: [],
            isMultichain: false,
            existsOnCurrentChain: false,
          };

    // Detect on-chain token existence if address is valid
    if (addressIsValid && !addressIsEmpty && standard === TokenStandard.ERC20) {
      // Set the detecting address ref before starting detection
      detectingAddressRef.current = standardAddress;
      detectTokenOnChains(standardAddress).catch((error) => {
        console.warn('Failed to detect token on chains:', error);
      });
    } else {
      // Clear detection state if address is invalid or empty
      detectingAddressRef.current = null;
      setChainsWhereTokenExists([]);
      setIsDetectingChains(false);
    }
    switch (true) {
      case !addressIsValid && !addressIsEmpty:
        setCustomAddressError(t('invalidAddress'));
        setCustomSymbol('');
        setCustomDecimals(0);
        setCustomSymbolError(null);
        setCustomDecimalsError(null);
        setShowSymbolAndDecimals(false);
        break;

      case standard === TokenStandard.ERC1155 ||
        standard === TokenStandard.ERC721:
        setNftAddressError(
          t('nftAddressError', [
            <ButtonLink
              className="import-tokens-modal__nft-address-error-link"
              onClick={() => {
                dispatch(showImportNftsModal({ tokenAddress: address }));
                onClose();
              }}
              color={TextColor.primaryDefault}
              key="nftAddressError"
            >
              {t('importNFTPage')}
            </ButtonLink>,
          ]),
        );
        setShowSymbolAndDecimals(false);
        break;

      case isMainnetToken && selectedNetwork !== CHAIN_IDS.MAINNET:
        setMainnetTokenWarning(t('mainnetToken'));
        setCustomSymbol('');
        setCustomDecimals(0);
        setCustomSymbolError(null);
        setCustomDecimalsError(null);
        setShowSymbolAndDecimals(false);
        break;

      case Boolean(
        accounts.find(
          (internalAccount) =>
            internalAccount.address.toLowerCase() === standardAddress,
        ),
      ):
        setCustomAddressError(t('personalAddressDetected'));
        setShowSymbolAndDecimals(false);
        break;

      case multichainCheck.existsOnCurrentChain:
        setCustomAddressError(t('tokenAlreadyAdded'));
        setShowSymbolAndDecimals(false);
        setMultichainChains([]);
        setSelectedChainsForImport([]);
        break;

      case multichainCheck.isMultichain &&
        !multichainCheck.existsOnCurrentChain:
        setCustomAddressError(null);
        setMultichainChains(multichainCheck.existsOnChains);
        // Reset selected chains when switching to a new multichain token
        // to prevent stale selections from previous token addresses
        setSelectedChainsForImport([]);
        break;

      default:
        setCustomAddressError(null);
        setMultichainChains([]);
        setSelectedChainsForImport([]);
        if (standard) {
          setTokenStandard(standard);
        }
    }
  };

  const MultichainImportSelector = () => {
    // Helper to check if chain is testnet
    const isTestnetChain = (inputChainId) => {
      const chainIdToCompare = isEvmChainId(inputChainId)
        ? formatChainIdToHex(inputChainId)
        : inputChainId;
      return (
        chainIdToCompare === CHAIN_IDS.GOERLI ||
        chainIdToCompare === CHAIN_IDS.SEPOLIA ||
        chainIdToCompare === CHAIN_IDS.LINEA_GOERLI ||
        chainIdToCompare === CHAIN_IDS.LINEA_SEPOLIA ||
        chainIdToCompare === CHAIN_IDS.BASE_SEPOLIA ||
        chainIdToCompare === CHAIN_IDS.ARBITRUM_SEPOLIA ||
        chainIdToCompare === CHAIN_IDS.OPTIMISM_SEPOLIA ||
        chainIdToCompare === CHAIN_IDS.MEGAETH_TESTNET ||
        chainIdToCompare === CHAIN_IDS.MEGAETH_TESTNET_V2 ||
        chainIdToCompare === CHAIN_IDS.MONAD_TESTNET ||
        inputChainId.includes('testnet') ||
        inputChainId.includes('Testnet') ||
        NON_EVM_TESTNET_IDS.includes(inputChainId)
      );
    };

    // Combine both sources: chains from wallet (multichainChains) and chains detected on-chain
    // Use a Set to avoid duplicates
    const allChainsSet = new Set([
      ...multichainChains,
      ...chainsWhereTokenExists,
    ]);
    const chainsToShow = Array.from(allChainsSet);

    // Helper function to find network by chainId (handles both hex and CAIP formats)
    const findNetworkByChainId = (lookupChainId) => {
      let network =
        allNetworks[lookupChainId] || networkConfigurations[lookupChainId];

      if (network) {
        return { network, chainIdToCompare: lookupChainId };
      }

      if (isEvmChainId(lookupChainId)) {
        const hexChainId = formatChainIdToHex(lookupChainId);
        const caipChainId = formatChainIdToCaip(lookupChainId);

        network = allNetworks[caipChainId];
        if (network) {
          return { network, chainIdToCompare: hexChainId };
        }

        network = networkConfigurations[hexChainId];
        if (network) {
          return { network, chainIdToCompare: hexChainId };
        }
      }

      const foundNetwork = Object.values(allNetworks).find((n) => {
        const nChainId = isEvmChainId(n.chainId)
          ? formatChainIdToHex(n.chainId)
          : n.chainId;
        const inputChainId = isEvmChainId(lookupChainId)
          ? formatChainIdToHex(lookupChainId)
          : lookupChainId;
        return nChainId === inputChainId;
      });

      if (foundNetwork) {
        const chainIdToCompare = isEvmChainId(foundNetwork.chainId)
          ? formatChainIdToHex(foundNetwork.chainId)
          : foundNetwork.chainId;
        return { network: foundNetwork, chainIdToCompare };
      }

      return null;
    };

    // Get network info for each chain where token exists.
    // Mark a chain as "already imported" if it exists in the user's wallet (multichainChains).
    // This ensures already-imported chains never show as checkboxes, even before on-chain detection completes.
    const chainsWithNetworkInfo = chainsToShow
      .map((tokenChainId) => {
        const result = findNetworkByChainId(tokenChainId);

        if (!result || !result.network) {
          return null;
        }

        const { network, chainIdToCompare } = result;
        // If token is in wallet (multichainChains), it's already imported
        // This check happens immediately, preventing checkboxes from showing initially
        const isAlreadyImported = multichainChains.includes(chainIdToCompare);

        return {
          chainId: network.chainId,
          chainIdToCompare,
          network,
          isTestnet: isTestnetChain(network.chainId),
          isAlreadyImported,
        };
      })
      .filter(Boolean);
    // Hide multichain selector if the token only exists on the currently selected network
    const otherChainsWithNetworkInfo = chainsWithNetworkInfo.filter(
      (item) => item.chainIdToCompare !== selectedNetwork,
    );
    const alreadyImportedChains = otherChainsWithNetworkInfo.filter(
      (item) => item.isAlreadyImported,
    );
    const availableChains = otherChainsWithNetworkInfo.filter(
      (item) => !item.isAlreadyImported,
    );

    // Only hide the selector if there are no chains to show at all
    // (neither already imported nor available to import)
    if (
      availableChains.length === 0 &&
      alreadyImportedChains.length === 0 &&
      !isDetectingChains
    ) {
      return null;
    }

    // Separate mainnet and testnet chains from the ones that are still
    // available to import (checkboxes). Already-imported chains are shown
    // in a separate read-only list above the checkboxes.
    const mainnetChains = availableChains.filter((item) => !item.isTestnet);
    const testnetChains = availableChains.filter((item) => item.isTestnet);

    return (
      <Box paddingTop={2} paddingLeft={4} paddingRight={4} paddingBottom={2}>
        <Box marginBottom={3}>
          <Text
            variant={TextVariant.headingSm}
            marginBottom={1}
            fontWeight={FontWeight.Bold}
          >
            {t('tokenExistsOnMultipleChainsTitle')}
          </Text>
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textMuted}
            marginBottom={0}
          >
            {t('tokenExistsOnMultipleChainsSubtitle')}
          </Text>
        </Box>

        {alreadyImportedChains.length > 0 && (
          <Box
            marginBottom={3}
            padding={3}
            borderRadius={BorderRadius.MD}
            backgroundColor={BackgroundColor.backgroundAlternative}
            borderWidth={1}
            borderColor={BorderColor.borderMuted}
          >
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              marginBottom={2}
            >
              <Icon
                name={IconName.CheckCircle}
                color={IconColor.successDefault}
                marginRight={1}
              />
              <Text
                variant={TextVariant.bodySm}
                fontWeight={FontWeight.Medium}
                color={TextColor.textDefault}
              >
                {t('tokenAlreadyAdded')}
              </Text>
            </Box>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={1}
            >
              {alreadyImportedChains.map((item) => {
                const networkDisplayName =
                  item.network?.nickname || item.network?.name || item.chainId;

                return (
                  <Box
                    key={`imported-${item.chainId}`}
                    display={Display.Flex}
                    alignItems={AlignItems.center}
                    justifyContent="space-between"
                    padding={2}
                    borderRadius={BorderRadius.SM}
                    backgroundColor={BackgroundColor.backgroundDefault}
                  >
                    <Box
                      display={Display.Flex}
                      alignItems={AlignItems.center}
                      gap={1}
                    >
                      <Icon
                        name={IconName.Check}
                        color={IconColor.successDefault}
                        size={IconSize.Sm}
                      />
                      <Text
                        variant={TextVariant.bodyMd}
                        fontWeight={FontWeight.Medium}
                      >
                        {networkDisplayName}
                      </Text>
                    </Box>
                    <Tag
                      label={t('alreadyImported')}
                      backgroundColor={BackgroundColor.successMuted}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {isDetectingChains && (
          <Box marginBottom={4}>
            <Text variant={TextVariant.bodySm} color={TextColor.textMuted}>
              {t('detectingTokenChains')}...
            </Text>
          </Box>
        )}

        {mainnetChains.length > 0 && (
          <Box marginBottom={3}>
            <Text
              variant={TextVariant.bodySm}
              marginBottom={1}
              fontWeight={FontWeight.Bold}
            >
              {t('tokenExistsOnMainnets')}
            </Text>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textMuted}
              marginBottom={2}
            >
              {t('selectMainnetsToImport')}
            </Text>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={1}
            >
              {mainnetChains.map((item) => {
                const networkDisplayName =
                  item.network?.nickname || item.network?.name || item.chainId;
                const isChecked =
                  selectedChainsForImport.includes(item.chainIdToCompare) ||
                  item.isAlreadyImported;

                return (
                  <Box
                    key={item.chainId}
                    display={Display.Flex}
                    alignItems={AlignItems.center}
                    padding={2}
                    borderRadius={BorderRadius.MD}
                    borderWidth={1}
                    borderColor={
                      isChecked
                        ? BorderColor.primaryDefault
                        : BorderColor.borderMuted
                    }
                    backgroundColor={
                      isChecked
                        ? BackgroundColor.primaryMuted
                        : BackgroundColor.backgroundDefault
                    }
                    style={{
                      transition: 'all 0.2s ease',
                      cursor: item.isAlreadyImported ? 'default' : 'pointer',
                    }}
                  >
                    <Checkbox
                      id={`multichain-import-${item.chainId}`}
                      label={
                        <Text
                          variant={TextVariant.bodyMd}
                          fontWeight={
                            isChecked ? FontWeight.Medium : FontWeight.Normal
                          }
                        >
                          {networkDisplayName}
                        </Text>
                      }
                      isChecked={isChecked}
                      isDisabled={item.isAlreadyImported}
                      onChange={(e) => {
                        if (!item.isAlreadyImported && e.target.checked) {
                          setSelectedChainsForImport([
                            ...selectedChainsForImport,
                            item.chainIdToCompare,
                          ]);
                        } else if (!item.isAlreadyImported) {
                          setSelectedChainsForImport(
                            selectedChainsForImport.filter(
                              (id) => id !== item.chainIdToCompare,
                            ),
                          );
                        }
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {testnetChains.length > 0 && (
          <Box marginBottom={3}>
            <Text
              variant={TextVariant.bodySm}
              marginBottom={1}
              fontWeight={FontWeight.Bold}
            >
              {t('tokenExistsOnTestnets')}
            </Text>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textMuted}
              marginBottom={2}
            >
              {t('selectTestnetsToImport')}
            </Text>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={1}
            >
              {testnetChains.map((item) => {
                const networkDisplayName =
                  item.network?.nickname || item.network?.name || item.chainId;
                const isChecked =
                  selectedChainsForImport.includes(item.chainIdToCompare) ||
                  item.isAlreadyImported;

                return (
                  <Box
                    key={item.chainId}
                    display={Display.Flex}
                    alignItems={AlignItems.center}
                    padding={2}
                    borderRadius={BorderRadius.MD}
                    borderWidth={1}
                    borderColor={
                      isChecked
                        ? BorderColor.primaryDefault
                        : BorderColor.borderMuted
                    }
                    backgroundColor={
                      isChecked
                        ? BackgroundColor.primaryMuted
                        : BackgroundColor.backgroundDefault
                    }
                    style={{
                      transition: 'all 0.2s ease',
                      cursor: item.isAlreadyImported ? 'default' : 'pointer',
                    }}
                  >
                    <Checkbox
                      id={`multichain-import-${item.chainId}`}
                      label={
                        <Box
                          display={Display.Flex}
                          alignItems={AlignItems.center}
                          gap={1}
                        >
                          <Text
                            variant={TextVariant.bodyMd}
                            fontWeight={
                              isChecked ? FontWeight.Medium : FontWeight.Normal
                            }
                          >
                            {networkDisplayName}
                          </Text>
                          <Tag
                            label={t('testnet')}
                            backgroundColor={BackgroundColor.warningMuted}
                          />
                        </Box>
                      }
                      isChecked={isChecked}
                      isDisabled={item.isAlreadyImported}
                      onChange={(e) => {
                        if (!item.isAlreadyImported && e.target.checked) {
                          setSelectedChainsForImport([
                            ...selectedChainsForImport,
                            item.chainIdToCompare,
                          ]);
                        } else if (!item.isAlreadyImported) {
                          setSelectedChainsForImport(
                            selectedChainsForImport.filter(
                              (id) => id !== item.chainIdToCompare,
                            ),
                          );
                        }
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const accountAddress = useMemo(
    () =>
      isEvmChainId(selectedNetwork)
        ? getAccountForChain(formatChainIdToCaip(selectedNetwork))?.address
        : getAccountForChain(selectedNetwork)?.id,
    [selectedNetwork, getAccountForChain],
  );

  // Determines whether to show the Search/Import or Confirm action
  const isConfirming = mode === 'confirm';

  const hasSearchTokens = useMemo(() => {
    const tokenData = tokenListByChain?.[selectedNetwork]?.data;
    return tokenData && Object.keys(tokenData).length > 0;
  }, [tokenListByChain, selectedNetwork]);

  const shouldShowSearchTab = hasSearchTokens;
  const shouldShowCustomTab = isEvmChainId(selectedNetwork);
  const shouldShowNoSupportPlaceholder =
    !shouldShowSearchTab && !shouldShowCustomTab;

  if (actionMode === ACTION_MODES.NETWORK_SELECTOR) {
    return (
      <Modal isOpen>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            onBack={() => setActionMode(ACTION_MODES.IMPORT_TOKEN)}
            onClose={onClose}
          >
            <Text variant={TextVariant.headingSm} align={TextAlign.Center}>
              {t('networkMenuHeading')}
            </Text>
          </ModalHeader>
          <ModalBody>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              width={BlockSize.Full}
            >
              {Object.values(allNetworks).map((network) => (
                <Box
                  key={network.chainId}
                  data-testid={`select-network-item-${network.chainId}`}
                >
                  <NetworkListItem
                    key={network.chainId}
                    chainId={network.chainId}
                    name={network.name}
                    iconSrc={getImageForChainId(network.chainId)}
                    iconSize={AvatarNetworkSize.Sm}
                    focus={false}
                    onClick={() => {
                      const networkChainId = isEvmChainId(network.chainId)
                        ? formatChainIdToHex(network.chainId)
                        : network.chainId;
                      setSelectedNetwork(networkChainId);
                      clearAllFormData();
                      setActionMode(ACTION_MODES.IMPORT_TOKEN);
                    }}
                    selected={
                      isEvmChainId(network.chainId)
                        ? formatChainIdToHex(network.chainId) ===
                          selectedNetwork
                        : network.chainId === selectedNetwork
                    }
                  />
                </Box>
              ))}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={() => {
        dispatch(clearPendingTokens());
        onClose();
      }}
      className="import-tokens-modal"
    >
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          className: 'import-tokens-modal__modal-dialog-content',
        }}
      >
        <ModalHeader
          onBack={isConfirming ? () => setMode('') : null}
          paddingBottom={4}
          paddingRight={4}
          paddingLeft={4}
          onClose={() => {
            dispatch(clearPendingTokens());
            onClose();
          }}
        >
          {t('importTokensCamelCase')}
        </ModalHeader>
        <Box className="import-tokens-modal__body">
          {isConfirming ? (
            // <ImportTokensModalConfirm networkFilter={networkFilter} />
            <Box>
              <ImportTokensModalConfirm networkFilter={networkFilter} />
              {/* Show multichain selector if token exists on other chains */}
              {(chainsWhereTokenExists.length > 0 ||
                multichainChains.length > 0) &&
                customAddress && <MultichainImportSelector />}
            </Box>
          ) : (
            <>
              <NetworkSelectorCustomImport
                title={
                  allNetworks[selectedNetwork]?.name ||
                  networkConfigurations[selectedNetwork]?.name
                }
                buttonDataTestId="test-import-tokens-drop-down-custom-import"
                chainId={selectedNetwork}
                onSelectNetwork={() =>
                  setActionMode(ACTION_MODES.NETWORK_SELECTOR)
                }
              />

              {/* Content based on network support */}
              {isLoading && (
                /* Loading indicator */
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  alignItems="center"
                  justifyContent="center"
                  paddingTop={8}
                  paddingBottom={8}
                  data-testid="import-tokens-loading"
                >
                  <Text
                    variant={TextVariant.bodyMd}
                    color={TextColor.textMuted}
                  >
                    {t('loading')}...
                  </Text>
                </Box>
              )}
              {!isLoading && shouldShowNoSupportPlaceholder && (
                /* No support placeholder */
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  alignItems="center"
                  justifyContent="center"
                  paddingTop={8}
                  paddingBottom={8}
                  paddingLeft={4}
                  paddingRight={4}
                  data-testid="import-tokens-no-support"
                >
                  <Text
                    variant={TextVariant.bodyMd}
                    color={TextColor.textMuted}
                    textAlign={TextAlign.Center}
                  >
                    {t('currentlyUnavailable')}
                  </Text>
                </Box>
              )}
              {!isLoading && !shouldShowNoSupportPlaceholder && (
                <Tabs
                  tabListProps={{ className: 'px-4' }}
                  onTabClick={() => clearAllFormData()}
                >
                  {shouldShowSearchTab && (
                    <Tab
                      tabKey={TAB_NAMES.SEARCH}
                      name={t('search')}
                      className="flex-1"
                    >
                      <Box paddingTop={4}>
                        {!useTokenDetection && (
                          <Box paddingLeft={4} paddingRight={4}>
                            <BannerAlert
                              severity={Severity.Info}
                              marginBottom={4}
                              paddingLeft={4}
                              paddingRight={4}
                            >
                              <Text variant={TextVariant.bodyMd} fontSize="16">
                                {t('enhancedTokenDetectionAlertMessage', [
                                  networkName,
                                  <ButtonLink
                                    key="token-detection-announcement"
                                    className="import-tokens-modal__autodetect"
                                    onClick={() => {
                                      onClose();
                                      navigate(
                                        `${SECURITY_ROUTE}#auto-detect-tokens`,
                                      );
                                    }}
                                  >
                                    {t('enableFromSettings')}
                                  </ButtonLink>,
                                ])}
                              </Text>
                            </BannerAlert>
                          </Box>
                        )}

                        <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
                          <TokenSearch
                            searchClassName="import-tokens-modal__button-search"
                            onSearch={({ results = [] }) =>
                              setSearchResults(results)
                            }
                            error={tokenSelectorError}
                            tokenList={tokenListByChain}
                            networkFilter={networkFilter}
                            setSearchResults={setSearchResults}
                            chainId={selectedNetwork}
                          />
                        </Box>

                        {searchResults.length === 0 ? (
                          <Box
                            paddingLeft={4}
                            paddingRight={4}
                            className="token-list__empty-list"
                          >
                            <TokenListPlaceholder />
                          </Box>
                        ) : (
                          <TokenList
                            currentNetwork={networkFilter[selectedNetwork]}
                            testNetworkBackgroundColor={
                              testNetworkBackgroundColor
                            }
                            results={searchResults}
                            selectedTokens={selectedTokens}
                            onToggleToken={(token) => handleToggleToken(token)}
                            accountAddress={accountAddress}
                          />
                        )}
                      </Box>
                    </Tab>
                  )}

                  {shouldShowCustomTab && (
                    <Tab
                      tabKey={TAB_NAMES.CUSTOM_TOKEN}
                      name={t('customToken')}
                      data-testid="import-tokens-modal-custom-token-tab"
                      className="flex-1"
                    >
                      <Box paddingTop={4}>
                        <Box className="import-tokens-modal__custom-token-form__container">
                          <Box paddingLeft={4} paddingRight={4}>
                            <BannerAlert
                              severity={Severity.Warning}
                              data-testid="custom-token-warning"
                            >
                              <Text variant={TextVariant.bodyMd}>
                                {t(
                                  'customTokenWarningInTokenDetectionNetwork',
                                  [
                                    <ButtonLink
                                      key="import-token-fake-token-warning"
                                      rel="noopener noreferrer"
                                      target="_blank"
                                      href={ZENDESK_URLS.TOKEN_SAFETY_PRACTICES}
                                    >
                                      {t('learnScamRisk')}
                                    </ButtonLink>,
                                  ],
                                )}
                              </Text>
                            </BannerAlert>
                          </Box>
                          <Box>
                            <FormTextField
                              paddingLeft={4}
                              paddingRight={4}
                              paddingTop={4}
                              size={Size.LG}
                              label={t('tokenContractAddress')}
                              value={customAddress}
                              onChange={(e) => {
                                if (selectedNetwork) {
                                  handleCustomAddressChange(e.target.value);
                                } else {
                                  setCustomAddress(e.target.value);
                                }
                              }}
                              helpText={
                                customAddressError ||
                                mainnetTokenWarning ||
                                nftAddressError
                              }
                              error={
                                customAddressError ||
                                mainnetTokenWarning ||
                                nftAddressError
                              }
                              textFieldProps={{
                                className:
                                  customAddressError ||
                                  mainnetTokenWarning ||
                                  nftAddressError
                                    ? 'import-tokens-modal__custom-token-form__text-outline-error'
                                    : 'import-tokens-modal__custom-token-form__text-outline-success',
                              }}
                              inputProps={{
                                'data-testid':
                                  'import-tokens-modal-custom-address',
                              }}
                            />
                            {showSymbolAndDecimals && (
                              <Box>
                                <FormTextField
                                  paddingLeft={4}
                                  paddingRight={4}
                                  paddingTop={4}
                                  size={Size.LG}
                                  label={<>{t('tokenSymbol')}</>}
                                  value={customSymbol}
                                  onChange={(e) =>
                                    handleCustomSymbolChange(e.target.value)
                                  }
                                  helpText={customSymbolError}
                                  error={customSymbolError}
                                  textFieldProps={{
                                    className: customSymbolError
                                      ? 'import-tokens-modal__custom-token-form__text-outline-error'
                                      : 'import-tokens-modal__custom-token-form__text-outline-success',
                                  }}
                                  inputProps={{
                                    'data-testid':
                                      'import-tokens-modal-custom-symbol',
                                  }}
                                />
                                <FormTextField
                                  paddingLeft={4}
                                  paddingRight={4}
                                  paddingTop={4}
                                  size={Size.LG}
                                  label={t('decimal')}
                                  type="number"
                                  value={customDecimals}
                                  onChange={(e) =>
                                    handleCustomDecimalsChange(e.target.value)
                                  }
                                  helpText={customDecimalsError}
                                  error={customDecimalsError}
                                  disabled={decimalAutoFilled}
                                  min={MIN_DECIMAL_VALUE}
                                  max={MAX_DECIMAL_VALUE}
                                  textFieldProps={{
                                    className: customDecimalsError
                                      ? 'import-tokens-modal__custom-token-form__text-outline-error'
                                      : 'import-tokens-modal__custom-token-form__text-outline-success',
                                  }}
                                  inputProps={{
                                    'data-testid':
                                      'import-tokens-modal-custom-decimals',
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Tab>
                  )}
                </Tabs>
              )}
            </>
          )}
        </Box>
        {isConfirming ? (
          <Box
            paddingTop={5}
            paddingLeft={4}
            paddingRight={4}
            display={Display.Flex}
          >
            <ButtonSecondary
              size={Size.LG}
              onClick={() => {
                dispatch(clearPendingTokens());
                setMode('');
              }}
              block
              marginRight={5}
            >
              {t('back')}
            </ButtonSecondary>
            <ButtonPrimary
              size={Size.LG}
              onClick={async () => {
                trace({ name: TraceName.ImportTokens });
                await handleAddTokens();
                endTrace({ name: TraceName.ImportTokens });
                navigate(DEFAULT_ROUTE);
              }}
              block
              data-testid="import-tokens-modal-import-button"
            >
              {t('import')}
            </ButtonPrimary>
          </Box>
        ) : (
          <Box paddingTop={6} paddingLeft={4} paddingRight={4}>
            <ButtonPrimary
              onClick={() => handleNext()}
              size={Size.LG}
              disabled={
                Boolean(hasError()) ||
                !hasSelected() ||
                !selectedNetwork ||
                shouldShowNoSupportPlaceholder ||
                isLoading
              }
              block
              data-testid="import-tokens-button-next"
            >
              {t('next')}
            </ButtonPrimary>
          </Box>
        )}
      </ModalContent>
    </Modal>
  );
};

ImportTokensModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
