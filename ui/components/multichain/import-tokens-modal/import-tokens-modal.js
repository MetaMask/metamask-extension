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
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getTokenTrackerLink } from '@metamask/etherscan-link/dist/token-tracker-link';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Tab, Tabs } from '../../ui/tabs';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../shared/modules/selectors/networks';
import {
  getInternalAccounts,
  getIsDynamicTokenListAvailable,
  getIsTokenDetectionInactiveOnMainnet,
  getIsTokenDetectionSupported,
  getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  getSelectedInternalAccount,
  getTokenDetectionSupportNetworkByChainId,
  getCurrentNetwork,
  getTestNetworkBackgroundColor,
  getTokenExchangeRates,
  getPendingTokens,
  getTokenNetworkFilter,
  getAllTokens,
  getEnabledNetworksByNamespace,
} from '../../../selectors';
import {
  addImportedTokens,
  addMultichainAssets,
  clearPendingTokens,
  setPendingTokens,
  showImportNftsModal,
  setNewTokensImported,
  setNewTokensImportedError,
  hideImportTokensModal,
  setConfirmationExchangeRates,
  getTokenStandardAndDetailsByChain,
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
  ModalBody,
  AvatarNetworkSize,
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
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { addHexPrefix } from '../../../../app/scripts/lib/util';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../../shared/constants/tokens';
import {
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';
import {
  checkExistingAddresses,
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
import { AssetPickerModalNetwork } from '../asset-picker-amount/asset-picker-modal/asset-picker-modal-network';
import { NetworkSelectorCustomImport } from '../../app/import-token/network-selector-custom-import';
import { getImageForChainId } from '../../../selectors/multichain';
import { getSelectedMultichainNetworkChainId } from '../../../selectors/multichain/networks';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import { NetworkListItem } from '../network-list-item';
import TokenListPlaceholder from '../../app/import-token/token-list/token-list-placeholder';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import { isGlobalNetworkSelectorRemoved } from '../../../selectors/selectors';
import { useTokensWithFiltering } from '../../../hooks/bridge/useTokensWithFiltering';
import { getAllBridgeableNetworks } from '../../../ducks/bridge/selectors';
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
  const history = useHistory();
  const dispatch = useDispatch();

  const [mode, setMode] = useState('');

  const [tokenSelectorError, setTokenSelectorError] = useState(null);
  const [selectedTokens, setSelectedTokens] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  // const networkClientId = useSelector(getSelectedNetworkClientId);
  const currentNetwork = useSelector(getCurrentNetwork);
  const chainId = useSelector(getCurrentChainId);

  // Initialize with current EVM network chainId (custom import only supports EVM)
  const [selectedNetworkForCustomImport, setSelectedNetworkForCustomImport] =
    useState(chainId);

  const [defaultActiveTabKey, setDefaultActiveTabKey] = useState(
    TAB_NAMES.SEARCH,
  );

  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  // Tracks which page the user is on
  const [actionMode, setActionMode] = useState(ACTION_MODES.CUSTOM_IMPORT);

  const tokenNetworkFilter = useSelector(getTokenNetworkFilter);
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const allBridgeableNetworks = useSelector(getAllBridgeableNetworks);
  const currentMultichainChainId = useSelector(
    getSelectedMultichainNetworkChainId,
  );

  const [networkFilter, setNetworkFilter] = useState(
    isGlobalNetworkSelectorRemoved
      ? enabledNetworksByNamespace
      : tokenNetworkFilter,
  );

  // Use all bridgeable networks including multichain (Solana, Bitcoin)
  const availableNetworks = useMemo(() => {
    // For the search tab, show all bridgeable networks
    return allBridgeableNetworks || [];
  }, [allBridgeableNetworks]);

  const [selectedSearchNetwork, setSelectedSearchNetwork] = useState(null);
  const [isSearchNetworkSelectorOpen, setIsSearchNetworkSelectorOpen] =
    useState(false);

  // Initialize selected network with current network when available networks are loaded
  useEffect(() => {
    if (availableNetworks.length > 0 && !selectedSearchNetwork) {
      // Try to match the current selected network
      let matchingNetwork = null;

      if (currentMultichainChainId) {
        if (isEvmChainId(currentMultichainChainId)) {
          const hexChainId = formatChainIdToHex(currentMultichainChainId);
          // Extract hex chainId from CAIP format for EVM networks
          matchingNetwork = availableNetworks.find(
            (network) => network.chainId === hexChainId,
          );
        } else {
          // For non-EVM networks, the chainId in availableNetworks should match directly
          matchingNetwork = availableNetworks.find(
            (network) => network.chainId === currentMultichainChainId,
          );
        }
      }

      // Use matching network if found, otherwise default to first available
      setSelectedSearchNetwork(matchingNetwork || availableNetworks[0]);
    }
  }, [availableNetworks, selectedSearchNetwork, currentMultichainChainId]);

  // Determine if we should show the search tab
  const isTokenDetectionSupported = useSelector(getIsTokenDetectionSupported);
  const isTokenDetectionInactiveOnMainnet = useSelector(
    getIsTokenDetectionInactiveOnMainnet,
  );
  const showSearchTab =
    isTokenDetectionSupported ||
    isTokenDetectionInactiveOnMainnet ||
    Boolean(process.env.IN_TEST);

  const useTokenDetection = useSelector(
    ({ metamask }) => metamask.useTokenDetection,
  );
  const networkName = useSelector(getTokenDetectionSupportNetworkByChainId);
  const nativeCurrency = useSelector(getNativeCurrency);

  // Custom token stuff
  const tokenDetectionInactiveOnNonMainnetSupportedNetwork = useSelector(
    getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  );
  const isDynamicTokenListAvailable = useSelector(
    getIsDynamicTokenListAvailable,
  );
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const accounts = useSelector(getInternalAccounts);
  const allTokens = useSelector(getAllTokens);
  const tokens = allTokens?.[chainId]?.[selectedAccount.address] || [];
  const contractExchangeRates = useSelector(getTokenExchangeRates);

  // Determine which chain to use based on the active tab
  const activeChainId = useMemo(() => {
    if (defaultActiveTabKey === TAB_NAMES.SEARCH && selectedSearchNetwork) {
      return selectedSearchNetwork.chainId;
    }
    // For custom token tab or when search network is not selected
    return selectedNetworkForCustomImport || chainId;
  }, [
    defaultActiveTabKey,
    selectedSearchNetwork,
    selectedNetworkForCustomImport,
    chainId,
  ]);

  // Use the new useTokensWithFiltering hook for getting token data
  const { filteredTokenListGenerator } = useTokensWithFiltering(
    activeChainId,
    null,
    selectedAccount?.address,
  );

  // Convert generator to token list for compatibility with existing components
  const tokenListByChain = useMemo(() => {
    if (!filteredTokenListGenerator) {
      return {};
    }

    const tokenData = {};

    // Generate all tokens from the generator
    for (const token of filteredTokenListGenerator(() => true)) {
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
      [activeChainId]: {
        data: tokenData,
      },
    };
  }, [filteredTokenListGenerator, activeChainId]);

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

  const blockExplorerUrl =
    networkConfigurations[selectedNetworkForCustomImport]?.blockExplorerUrls?.[
      networkConfigurations[selectedNetworkForCustomImport]
        ?.defaultBlockExplorerUrlIndex
    ] ?? null;

  const blockExplorerTokenLink = getTokenTrackerLink(
    customAddress,
    selectedNetworkForCustomImport,
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

      // All tokens should be from the same chain since UI clears selection on network change
      const { chainId: tokenChainId } = addedTokenValues[0];
      const isNonEvm = isNonEvmChainId(tokenChainId);

      if (isNonEvm) {
        // Handle non-EVM tokens
        const accountForChain = getAccountForChain(tokenChainId);

        if (!accountForChain) {
          console.warn(`No account found for chain ${tokenChainId}`);
          return;
        }

        // Convert all tokens to CAIP asset format
        const assetIds = addedTokenValues
          .map((token) => {
            // Convert address to CAIP asset format
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
          .filter((assetId) => assetId !== null); // Remove any failed conversions

        if (assetIds.length > 0) {
          await dispatch(addMultichainAssets(assetIds, accountForChain.id));
        }
      } else {
        // Handle EVM tokens - use existing batch import
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
      history.push(DEFAULT_ROUTE);
    } catch (err) {
      dispatch(setNewTokensImportedError('error'));
      dispatch(clearPendingTokens());
      history.push(DEFAULT_ROUTE);
    }
  }, [
    dispatch,
    history,
    pendingTokens,
    trackEvent,
    networkConfigurations,
    getAccountForChain,
  ]);

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
          ...selectedTokens,
          [tokenAddress]: { ...token },
        };
      }
    });

    setSelectedTokens(initialSelectedTokens);
    setCustomAddress(initialCustomToken.address);
    setCustomSymbol(initialCustomToken.symbol);
    setCustomDecimals(initialCustomToken.decimals);
  }, [pendingTokens]);

  // Initialize network filter when selected search network is set
  useEffect(() => {
    if (selectedSearchNetwork) {
      setNetworkFilter({
        [selectedSearchNetwork.chainId]: selectedSearchNetwork,
      });
    }
  }, [selectedSearchNetwork]);

  useEffect(() => {
    setSelectedTokens({});
  }, [networkFilter]);

  const handleCustomSymbolChange = (value) => {
    const symbol = value.trim();
    const symbolLength = symbol.length;
    let symbolError = null;

    if (symbolLength <= 0 || symbolLength >= 12) {
      symbolError = t('symbolBetweenZeroTwelve');
    }

    setCustomSymbol(symbol);
    setCustomSymbolError(symbolError);
  };

  const handleCustomDecimalsChange = (value) => {
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
  };

  const attemptToAutoFillTokenParams = useCallback(
    async (address) => {
      const {
        symbol = '',
        decimals,
        name = '',
      } = await infoGetter.current(
        address,
        tokenListByChain?.[activeChainId]?.data,
      );

      setDecimalAutoFilled(Boolean(decimals));
      handleCustomSymbolChange(symbol || '');
      handleCustomDecimalsChange(decimals);
      // Set custom token name
      setCustomName(name);
      setShowSymbolAndDecimals(true);
    },
    [
      activeChainId,
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

    const tokenList = tokenListByChain?.[activeChainId]?.data ?? {};

    const tokenAddressList = Object.keys(tokenList);
    const customToken = customAddress
      ? {
          address: customAddress,
          symbol: customSymbol,
          decimals: customDecimals,
          standard: tokenStandard,
          name: customName,
          chainId: selectedNetworkForCustomImport,
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
        activeChainId,
      );
      // dispatch action
      dispatch(setConfirmationExchangeRates(result));
    }
    setMode('confirm');
  };

  const handleCustomAddressChange = async (value) => {
    const address = value.trim();

    setCustomAddress(address);
    setCustomAddressError(null);
    setNftAddressError(null);
    setDecimalAutoFilled(false);
    setMainnetTokenWarning(null);
    setShowSymbolAndDecimals(false);

    const addressIsValid = isValidHexAddress(address, {
      allowNonPrefixed: false,
    });
    const standardAddress = addHexPrefix(address).toLowerCase();

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
          selectedNetworkForCustomImport,
        ));
      } catch (error) {
        // ignore
      }
    }

    const addressIsEmpty = address.length === 0 || address === EMPTY_ADDRESS;
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

      case isMainnetToken &&
        selectedNetworkForCustomImport !== CHAIN_IDS.MAINNET:
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

      case checkExistingAddresses(address, tokens):
        setCustomAddressError(t('tokenAlreadyAdded'));
        setShowSymbolAndDecimals(false);
        break;

      default:
        if (standard) {
          setTokenStandard(standard);
        }
    }
  };

  const accountAddress = useMemo(
    () =>
      isEvmChainId(activeChainId)
        ? getAccountForChain(formatChainIdToCaip(activeChainId))?.address
        : getAccountForChain(activeChainId)?.id,
    [activeChainId, getAccountForChain],
  );

  // Determines whether to show the Search/Import or Confirm action
  const isConfirming = mode === 'confirm';

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
                      setSelectedNetworkForCustomImport(network.chainId);
                      setCustomAddress('');
                      setCustomSymbol('');
                      setCustomDecimals(0);
                      setShowSymbolAndDecimals(false);

                      setActionMode(ACTION_MODES.IMPORT_TOKEN);
                    }}
                    selected={
                      network?.chainId === selectedNetworkForCustomImport
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

  if (isSearchNetworkSelectorOpen) {
    return (
      <AssetPickerModalNetwork
        isOpen
        onClose={() => {
          setIsSearchNetworkSelectorOpen(false);
        }}
        onBack={() => {
          setIsSearchNetworkSelectorOpen(false);
        }}
        network={selectedSearchNetwork}
        networks={availableNetworks}
        onNetworkChange={(network) => {
          setSelectedSearchNetwork(network);
        }}
        header={t('networks')}
      />
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
            <ImportTokensModalConfirm networkFilter={networkFilter} />
          ) : (
            <Tabs
              t={t}
              onTabClick={(tabKey) => setDefaultActiveTabKey(tabKey)}
              defaultActiveTabKey={defaultActiveTabKey}
              tabListProps={{ className: 'px-4' }}
            >
              {showSearchTab ? (
                <Tab
                  tabKey={TAB_NAMES.SEARCH}
                  name={t('search')}
                  onClick={() => setDefaultActiveTabKey(TAB_NAMES.SEARCH)}
                  className="flex-1"
                >
                  <Box paddingTop={4}>
                    {useTokenDetection ? null : (
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
                                  history.push(
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

                    {availableNetworks.length > 0 && selectedSearchNetwork && (
                      <NetworkSelectorCustomImport
                        title={selectedSearchNetwork.name}
                        buttonDataTestId="test-import-tokens-drop-down"
                        chainId={selectedSearchNetwork.chainId}
                        onSelectNetwork={() =>
                          setIsSearchNetworkSelectorOpen(true)
                        }
                      />
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
                        chainId={activeChainId}
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
                        currentNetwork={currentNetwork}
                        testNetworkBackgroundColor={testNetworkBackgroundColor}
                        results={searchResults}
                        selectedTokens={selectedTokens}
                        onToggleToken={(token) => handleToggleToken(token)}
                        isTokenNetworkFilterEqualCurrentNetwork={
                          Object.keys(networkFilter).length === 1 &&
                          networkFilter[chainId]
                        }
                        accountAddress={accountAddress}
                      />
                    )}
                  </Box>
                </Tab>
              ) : null}
              <Tab
                tabKey={TAB_NAMES.CUSTOM_TOKEN}
                name={t('customToken')}
                onClick={() => setDefaultActiveTabKey(TAB_NAMES.CUSTOM_TOKEN)}
                data-testid="import-tokens-modal-custom-token-tab"
                className="flex-1"
              >
                {isConfirming ? (
                  <ImportTokensModalConfirm networkFilter={networkFilter} />
                ) : (
                  <Box paddingTop={4}>
                    <Box className="import-tokens-modal__custom-token-form__container">
                      {tokenDetectionInactiveOnNonMainnetSupportedNetwork ? (
                        <Box paddingLeft={4} paddingRight={4}>
                          <BannerAlert severity={Severity.Warning}>
                            <Text variant={TextVariant.bodyMd}>
                              {t(
                                'customTokenWarningInTokenDetectionNetworkWithTDOFF',
                                [
                                  <ButtonLink
                                    key="import-token-security-risk"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    href={ZENDESK_URLS.TOKEN_SAFETY_PRACTICES}
                                  >
                                    {t('tokenScamSecurityRisk')}
                                  </ButtonLink>,
                                  <ButtonLink
                                    type="link"
                                    key="import-token-token-detection-announcement"
                                    onClick={() => {
                                      onClose();
                                      history.push(
                                        `${SECURITY_ROUTE}#auto-detect-tokens`,
                                      );
                                    }}
                                  >
                                    {t('inYourSettings')}
                                  </ButtonLink>,
                                ],
                              )}
                            </Text>
                          </BannerAlert>
                        </Box>
                      ) : (
                        <Box paddingLeft={4} paddingRight={4}>
                          <BannerAlert
                            severity={
                              isDynamicTokenListAvailable
                                ? Severity.Warning
                                : Severity.Info
                            }
                            data-testid="custom-token-warning"
                          >
                            <Text variant={TextVariant.bodyMd}>
                              {t(
                                isDynamicTokenListAvailable
                                  ? 'customTokenWarningInTokenDetectionNetwork'
                                  : 'customTokenWarningInNonTokenDetectionNetwork',
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
                      )}
                      <NetworkSelectorCustomImport
                        title={
                          selectedNetworkForCustomImport
                            ? networkConfigurations[
                                selectedNetworkForCustomImport
                              ]?.name
                            : t('networkMenuHeading')
                        }
                        buttonDataTestId="test-import-tokens-drop-down-custom-import"
                        chainId={selectedNetworkForCustomImport}
                        onSelectNetwork={() =>
                          setActionMode(ACTION_MODES.NETWORK_SELECTOR)
                        }
                      />
                      <Box>
                        <FormTextField
                          paddingLeft={4}
                          paddingRight={4}
                          size={Size.LG}
                          label={t('tokenContractAddress')}
                          value={customAddress}
                          onChange={(e) => {
                            if (selectedNetworkForCustomImport) {
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
                            'data-testid': 'import-tokens-modal-custom-address',
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
                )}
              </Tab>
            </Tabs>
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
                history.push(DEFAULT_ROUTE);
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
                (defaultActiveTabKey === TAB_NAMES.CUSTOM_TOKEN &&
                  !selectedNetworkForCustomImport)
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
