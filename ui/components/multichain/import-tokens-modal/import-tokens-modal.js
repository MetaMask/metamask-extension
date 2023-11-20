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
import { Tab, Tabs } from '../../ui/tabs';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCurrentChainId,
  getIsDynamicTokenListAvailable,
  getIsMainnet,
  getIsTokenDetectionInactiveOnMainnet,
  getIsTokenDetectionSupported,
  getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  getMetaMaskIdentities,
  getRpcPrefsForCurrentProvider,
  getSelectedAddress,
  getSelectedNetworkClientId,
  getTokenDetectionSupportNetworkByChainId,
  getTokenList,
} from '../../../selectors';
import {
  addImportedTokens,
  clearPendingTokens,
  getTokenStandardAndDetails,
  setPendingTokens,
  showImportNftsModal,
} from '../../../store/actions';
import {
  BannerAlert,
  Box,
  ButtonLink,
  ButtonPrimary,
  FormTextField,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../component-library';
import TokenSearch from '../../app/import-token/token-search';
import TokenList from '../../app/import-token/token-list';

import {
  FontWeight,
  Severity,
  Size,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';

import { ASSET_ROUTE, SECURITY_ROUTE } from '../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { isValidHexAddress } from '../../../../shared/modules/hexstring-utils';
import { addHexPrefix } from '../../../../app/scripts/lib/util';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../../shared/constants/tokens';
import {
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';
import {
  checkExistingAddresses,
  getURLHostName,
} from '../../../helpers/utils/util';
import { tokenInfoGetter } from '../../../helpers/utils/token-util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getPendingTokens } from '../../../ducks/metamask/metamask';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../shared/constants/metametrics';
import { ImportTokensModalConfirm } from './import-tokens-modal-confirm';

export const ImportTokensModal = ({ onClose }) => {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();

  const [mode, setMode] = useState('');

  const [tokenSelectorError, setTokenSelectorError] = useState(null);
  const [selectedTokens, setSelectedTokens] = useState({});
  const [searchResults, setSearchResults] = useState([]);

  // Determine if we should show the search tab
  const isTokenDetectionSupported = useSelector(getIsTokenDetectionSupported);
  const isTokenDetectionInactiveOnMainnet = useSelector(
    getIsTokenDetectionInactiveOnMainnet,
  );
  const showSearchTab =
    isTokenDetectionSupported ||
    isTokenDetectionInactiveOnMainnet ||
    Boolean(process.env.IN_TEST);

  const tokenList = useSelector(getTokenList);
  const useTokenDetection = useSelector(
    ({ metamask }) => metamask.useTokenDetection,
  );
  const networkName = useSelector(getTokenDetectionSupportNetworkByChainId);

  // Custom token stuff
  const tokenDetectionInactiveOnNonMainnetSupportedNetwork = useSelector(
    getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  );
  const isDynamicTokenListAvailable = useSelector(
    getIsDynamicTokenListAvailable,
  );
  const selectedAddress = useSelector(getSelectedAddress);
  const isMainnet = useSelector(getIsMainnet);
  const identities = useSelector(getMetaMaskIdentities);
  const tokens = useSelector((state) => state.metamask.tokens);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);

  const [customAddress, setCustomAddress] = useState('');
  const [customAddressError, setCustomAddressError] = useState(null);
  const [nftAddressError, setNftAddressError] = useState(null);
  const [symbolAutoFilled, setSymbolAutoFilled] = useState(false);
  const [decimalAutoFilled, setDecimalAutoFilled] = useState(false);
  const [mainnetTokenWarning, setMainnetTokenWarning] = useState(null);
  const [customSymbol, setCustomSymbol] = useState('');
  const [customSymbolError, setCustomSymbolError] = useState(null);
  const [customDecimals, setCustomDecimals] = useState(0);
  const [customDecimalsError, setCustomDecimalsError] = useState(null);
  const [tokenStandard, setTokenStandard] = useState(TokenStandard.none);
  const [forceEditSymbol, setForceEditSymbol] = useState(false);

  const chainId = useSelector(getCurrentChainId);
  const blockExplorerTokenLink = getTokenTrackerLink(
    customAddress,
    chainId,
    null,
    null,
    { blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null },
  );
  const blockExplorerLabel = rpcPrefs?.blockExplorerUrl
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
  const networkClientId = useSelector(getSelectedNetworkClientId);

  const handleAddTokens = useCallback(async () => {
    const addedTokenValues = Object.values(pendingTokens);
    await dispatch(addImportedTokens(addedTokenValues, networkClientId));

    const firstTokenAddress = addedTokenValues?.[0].address?.toLowerCase();

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

    dispatch(clearPendingTokens());

    if (firstTokenAddress) {
      history.push(`${ASSET_ROUTE}/${firstTokenAddress}`);
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
      decimalsError = t('tokenDecimalFetchFailed');
    }

    setCustomDecimals(decimals);
    setCustomDecimalsError(decimalsError);
  };

  const attemptToAutoFillTokenParams = async (address) => {
    const { symbol = '', decimals } = await infoGetter.current(
      address,
      tokenList,
    );

    setSymbolAutoFilled(Boolean(symbol));
    setDecimalAutoFilled(Boolean(decimals));

    handleCustomSymbolChange(symbol || '');
    handleCustomDecimalsChange(decimals);
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

  const handleNext = () => {
    if (hasError()) {
      return;
    }

    if (!hasSelected()) {
      setTokenSelectorError(t('mustSelectOne'));
      return;
    }

    const tokenAddressList = Object.keys(tokenList);
    const customToken = customAddress
      ? {
          address: customAddress,
          symbol: customSymbol,
          decimals: customDecimals,
          standard: tokenStandard,
        }
      : null;

    dispatch(
      setPendingTokens({ customToken, selectedTokens, tokenAddressList }),
    );
    setMode('confirm');
  };

  const handleCustomAddressChange = async (value) => {
    const address = value.trim();

    setCustomAddress(address);
    setCustomAddressError(null);
    setNftAddressError(null);
    setSymbolAutoFilled(false);
    setDecimalAutoFilled(false);
    setMainnetTokenWarning(null);

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
        ({ standard } = await getTokenStandardAndDetails(
          standardAddress,
          selectedAddress,
          null,
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
        break;

      case isMainnetToken && !isMainnet:
        setMainnetTokenWarning(t('mainnetToken'));
        setCustomSymbol('');
        setCustomDecimals(0);
        setCustomSymbolError(null);
        setCustomDecimalsError(null);
        break;

      case Boolean(identities[standardAddress]):
        setCustomAddressError(t('personalAddressDetected'));
        break;

      case checkExistingAddresses(address, tokens):
        setCustomAddressError(t('tokenAlreadyAdded'));
        break;

      default:
        if (!addressIsEmpty) {
          attemptToAutoFillTokenParams(address);
          if (standard) {
            setTokenStandard(standard);
          }
        }
    }
  };

  // Determines whether to show the Search/Import or Confirm action
  const isConfirming = mode === 'confirm';

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
      <ModalContent>
        <ModalHeader
          onBack={isConfirming ? () => setMode('') : null}
          onClose={() => {
            dispatch(clearPendingTokens());
            onClose();
          }}
        >
          {t('importTokensCamelCase')}
        </ModalHeader>
        <Box marginTop={6}>
          {isConfirming ? (
            <ImportTokensModalConfirm
              onBackClick={() => {
                dispatch(clearPendingTokens());
                setMode('');
              }}
              onImportClick={async () => {
                await handleAddTokens();
                onClose();
              }}
            />
          ) : (
            <>
              <Tabs t={t}>
                {showSearchTab ? (
                  <Tab tabKey="search" name={t('search')}>
                    <Box paddingTop={4} paddingBottom={4}>
                      {useTokenDetection ? null : (
                        <BannerAlert severity={Severity.Info} marginBottom={4}>
                          <Text>
                            {t('enhancedTokenDetectionAlertMessage', [
                              networkName,
                              <ButtonLink
                                key="token-detection-announcement"
                                className="import-tokens-modal__autodetect"
                                onClick={() => {
                                  history.push(
                                    `${SECURITY_ROUTE}#auto-detect-tokens`,
                                  );
                                  onClose();
                                }}
                              >
                                {t('enableFromSettings')}
                              </ButtonLink>,
                            ])}
                          </Text>
                        </BannerAlert>
                      )}
                      <TokenSearch
                        onSearch={({ results = [] }) =>
                          setSearchResults(results)
                        }
                        error={tokenSelectorError}
                        tokenList={tokenList}
                      />
                      <Box
                        marginTop={4}
                        className="import-tokens-modal__search-list"
                      >
                        <TokenList
                          results={searchResults}
                          selectedTokens={selectedTokens}
                          onToggleToken={(token) => handleToggleToken(token)}
                        />
                      </Box>
                    </Box>
                  </Tab>
                ) : null}
                <Tab tabKey="customToken" name={t('customToken')}>
                  <Box
                    paddingTop={4}
                    paddingBottom={4}
                    className="import-tokens-modal__custom-token-form"
                  >
                    {tokenDetectionInactiveOnNonMainnetSupportedNetwork ? (
                      <BannerAlert severity={Severity.Warning}>
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
                                history.push(
                                  `${SECURITY_ROUTE}#auto-detect-tokens`,
                                );
                                onClose();
                              }}
                            >
                              {t('inYourSettings')}
                            </ButtonLink>,
                          ],
                        )}
                      </BannerAlert>
                    ) : (
                      <BannerAlert
                        severity={
                          isDynamicTokenListAvailable
                            ? Severity.Warning
                            : Severity.Info
                        }
                      >
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
                      </BannerAlert>
                    )}
                    <FormTextField
                      label={t('tokenContractAddress')}
                      value={customAddress}
                      onChange={(e) =>
                        handleCustomAddressChange(e.target.value)
                      }
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
                      autoFocus
                      marginTop={6}
                      inputProps={{
                        'data-testid': 'import-tokens-modal-custom-address',
                      }}
                    />
                    <FormTextField
                      label={
                        <>
                          {t('tokenSymbol')}
                          {symbolAutoFilled && !forceEditSymbol && (
                            <ButtonLink
                              onClick={() => setForceEditSymbol(true)}
                              textAlign={TextAlign.End}
                              paddingInlineEnd={1}
                              paddingInlineStart={1}
                              color={TextColor.primaryDefault}
                            >
                              {t('edit')}
                            </ButtonLink>
                          )}
                        </>
                      }
                      value={customSymbol}
                      onChange={(e) => handleCustomSymbolChange(e.target.value)}
                      helpText={customSymbolError}
                      error={customSymbolError}
                      disabled={symbolAutoFilled && !forceEditSymbol}
                      marginTop={6}
                      inputProps={{
                        'data-testid': 'import-tokens-modal-custom-symbol',
                      }}
                    />
                    <FormTextField
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
                      marginTop={6}
                      inputProps={{
                        'data-testid': 'import-tokens-modal-custom-decimals',
                      }}
                    />
                    {customDecimals === '' && (
                      <BannerAlert severity={Severity.Warning}>
                        <Text fontWeight={FontWeight.Bold}>
                          {t('tokenDecimalFetchFailed')}
                        </Text>
                        {t('verifyThisTokenDecimalOn', [
                          <ButtonLink
                            key="import-token-verify-token-decimal"
                            rel="noopener noreferrer"
                            target="_blank"
                            href={blockExplorerTokenLink}
                          >
                            {blockExplorerLabel}
                          </ButtonLink>,
                        ])}
                      </BannerAlert>
                    )}
                  </Box>
                </Tab>
              </Tabs>
              <Box paddingTop={6} paddingBottom={6}>
                <ButtonPrimary
                  onClick={() => handleNext()}
                  size={Size.LG}
                  disabled={Boolean(hasError()) || !hasSelected()}
                  block
                >
                  {t('next')}
                </ButtonPrimary>
              </Box>
            </>
          )}
        </Box>
      </ModalContent>
    </Modal>
  );
};

ImportTokensModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
