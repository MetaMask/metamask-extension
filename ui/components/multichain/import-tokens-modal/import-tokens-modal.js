import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getTokenTrackerLink } from '@metamask/etherscan-link/dist/token-tracker-link';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Tab, Tabs } from '../../ui/tabs';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCurrentChainId,
  getIsAllNetworksFilterEnabled,
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
  selectERC20TokensByChain,
  getTokenNetworkFilter,
  getAllTokens,
} from '../../../selectors';
import {
  addImportedTokens,
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
  AvatarNetwork,
} from '../../component-library';
import { FormTextField } from '../../component-library/form-text-field/deprecated';
import TokenSearch from '../../app/import-token/token-search';
import TokenList from '../../app/import-token/token-list';

import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
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
import { NetworkFilterImportToken } from '../../app/import-token/network-filter-import-token';
import { FEATURED_NETWORK_CHAIN_IDS } from '../../../../shared/constants/network';
import { NetworkSelectorCustomImport } from '../../app/import-token/network-selector-custom-import';
import { getImageForChainId } from '../../../selectors/multichain';
import { NetworkListItem } from '../network-list-item';
import TokenListPlaceholder from '../../app/import-token/token-list/token-list-placeholder';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import { ImportTokensModalConfirm } from './import-tokens-modal-confirm';

const ACTION_MODES = {
  // Displays the import token modal
  IMPORT_TOKEN: 'IMPORT_TOKEN',
  // Displays the page for selecting a network from custom import
  NETWORK_SELECTOR: 'NETWORK_SELECTOR',
  // Displays the page for selecting a network from a search
  SEARCH_NETWORK_SELECTOR: 'SEARCH_NETWORK_SELECTOR',
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
  const [selectedNetworkForCustomImport, setSelectedNetworkForCustomImport] =
    useState(null);

  const [defaultActiveTabKey, setDefaultActiveTabKey] = useState(
    TAB_NAMES.SEARCH,
  );

  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  // Tracks which page the user is on
  const [actionMode, setActionMode] = useState(ACTION_MODES.CUSTOM_IMPORT);

  const tokenNetworkFilter = useSelector(getTokenNetworkFilter);
  const [networkFilter, setNetworkFilter] = useState(tokenNetworkFilter);

  // Determine if we should show the search tab
  const isTokenDetectionSupported = useSelector(getIsTokenDetectionSupported);
  const isTokenDetectionInactiveOnMainnet = useSelector(
    getIsTokenDetectionInactiveOnMainnet,
  );
  const showSearchTab =
    isTokenDetectionSupported ||
    isTokenDetectionInactiveOnMainnet ||
    Boolean(process.env.IN_TEST);

  const tokenListByChain = useSelector(selectERC20TokensByChain);

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
  const chainId = useSelector(getCurrentChainId);
  const allTokens = useSelector(getAllTokens);
  const tokens = allTokens?.[chainId]?.[selectedAccount.address] || [];
  const contractExchangeRates = useSelector(getTokenExchangeRates);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const allOpts = useSelector(getIsAllNetworksFilterEnabled);

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

  const handleAddTokens = useCallback(async () => {
    try {
      const addedTokenValues = Object.values(pendingTokens);

      const addedTokensByChain = addedTokenValues.reduce((groups, token) => {
        if (!groups[token.chainId]) {
          groups[token.chainId] = [];
        }
        groups[token.chainId].push(token);
        return groups;
      }, {});

      const promiseAllImport = Object.keys(addedTokensByChain).map(
        (networkId) => {
          const clientId =
            networkConfigurations[networkId]?.rpcEndpoints[
              networkConfigurations[networkId]?.defaultRpcEndpointIndex
            ]?.networkClientId;
          return dispatch(
            addImportedTokens(addedTokensByChain[networkId], clientId),
          );
        },
      );
      await Promise.all(promiseAllImport);

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
            token_standard: TokenStandard.ERC20,
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
  }, [dispatch, history, pendingTokens, trackEvent]);

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
        tokenListByChain?.[selectedNetworkForCustomImport]?.data,
      );

      setDecimalAutoFilled(Boolean(decimals));
      handleCustomSymbolChange(symbol || '');
      handleCustomDecimalsChange(decimals);
      // Set custom token name
      setCustomName(name);
      setShowSymbolAndDecimals(true);
    },
    [selectedNetworkForCustomImport, tokenListByChain],
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

    const tokenList =
      tokenListByChain?.[selectedNetworkForCustomImport]?.data ?? {};

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
        chainId,
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
  if (actionMode === ACTION_MODES.SEARCH_NETWORK_SELECTOR) {
    return (
      <Modal isOpen>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            onBack={() => setActionMode(ACTION_MODES.IMPORT_TOKEN)}
            onClose={onClose}
          >
            <Text variant={TextVariant.headingSm} align={TextAlign.Center}>
              {t('networks')}
            </Text>
          </ModalHeader>
          <ModalBody>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              width={BlockSize.Full}
            >
              {FEATURED_NETWORK_CHAIN_IDS.filter((chain) => allOpts[chain]).map(
                (chain) => (
                  <Box
                    key={chain}
                    padding={4}
                    gap={4}
                    display={Display.Flex}
                    alignItems={AlignItems.center}
                    justifyContent={JustifyContent.spaceBetween}
                    width={BlockSize.Full}
                  >
                    <AvatarNetwork
                      name={getImageForChainId(chain)}
                      src={getImageForChainId(chain)}
                      size={AvatarNetworkSize.Sm}
                    />
                    <Box
                      width={BlockSize.Full}
                      display={Display.Flex}
                      alignItems={AlignItems.center}
                    >
                      <Text variant={TextVariant.bodyMdMedium}>
                        {networkConfigurations[chain]?.name}
                      </Text>
                    </Box>
                  </Box>
                ),
              )}
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
            <ImportTokensModalConfirm networkFilter={networkFilter} />
          ) : (
            <Tabs
              t={t}
              tabsClassName="import-tokens-modal__tabs"
              onTabClick={(tabKey) => setDefaultActiveTabKey(tabKey)}
              defaultActiveTabKey={defaultActiveTabKey}
            >
              {showSearchTab ? (
                <Tab
                  activeClassName="import-tokens-modal__active-tab"
                  buttonClassName="import-tokens-modal__button-tab"
                  tabKey={TAB_NAMES.SEARCH}
                  name={t('search')}
                  onClick={() => setDefaultActiveTabKey(TAB_NAMES.SEARCH)}
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

                    {FEATURED_NETWORK_CHAIN_IDS.some(
                      (networkId) => networkId === currentNetwork.chainId,
                    ) && (
                      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
                        <NetworkFilterImportToken
                          buttonDataTestId="test-import-tokens-drop-down"
                          openListNetwork={() =>
                            setActionMode(ACTION_MODES.SEARCH_NETWORK_SELECTOR)
                          }
                          networkFilter={networkFilter}
                          setNetworkFilter={setNetworkFilter}
                        />
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
                      />
                    )}
                  </Box>
                </Tab>
              ) : null}
              <Tab
                activeClassName="import-tokens-modal__active-tab"
                buttonClassName="import-tokens-modal__button-tab"
                tabKey={TAB_NAMES.CUSTOM_TOKEN}
                name={t('customToken')}
                onClick={() => setDefaultActiveTabKey(TAB_NAMES.CUSTOM_TOKEN)}
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
