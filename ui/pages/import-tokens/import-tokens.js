import React, { useContext, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getTokenTrackerLink } from '@metamask/etherscan-link/dist/token-tracker-link';
import { I18nContext } from '../../contexts/i18n';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { getMostRecentOverviewPage } from '../../ducks/history/history';

import {
  getTokenStandardAndDetails,
  setPendingTokens,
  showImportNftsModal,
  addImportedTokens,
  clearPendingTokens,
  setNewTokensImported,
  setNewTokensImportedError,
  showModal,
} from '../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../shared/constants/metametrics';
import {
  TokenStandard,
  AssetType,
} from '../../../shared/constants/transaction';
import {
  getIsTokenDetectionInactiveOnMainnet,
  getIsTokenDetectionSupported,
  getTokenDetectionSupportNetworkByChainId,
  getTokenList,
  getCurrentNetwork,
  getTestNetworkBackgroundColor,
  getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  getIsDynamicTokenListAvailable,
  getSelectedAddress,
  getIsMainnet,
  getMetaMaskIdentities,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getSelectedNetworkClientId,
  getTheme,
} from '../../selectors';
import {
  Text,
  Box,
  ButtonIcon,
  IconName,
  ButtonIconSize,
  BannerAlert,
  ButtonLink,
  FormTextField,
  ButtonPrimary,
  ButtonSecondary,
} from '../../components/component-library';
import {
  TextVariant,
  TextAlign,
  Severity,
  TextColor,
  FontWeight,
  Size,
} from '../../helpers/constants/design-system';
import { Tab, Tabs } from '../../components/ui/tabs';
import { SECURITY_ROUTE, DEFAULT_ROUTE } from '../../helpers/constants/routes';
import TokenSearch from '../../components/app/import-token/token-search';
import TokenList from '../../components/app/import-token/token-list';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';
import { addHexPrefix } from '../../../app/scripts/lib/util';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../shared/constants/tokens';
import {
  checkExistingAddresses,
  getURLHostName,
} from '../../helpers/utils/util';
import { tokenInfoGetter } from '../../helpers/utils/token-util';
import { getPendingTokens } from '../../ducks/metamask/metamask';
import ImportTokensConfirmation from '../import-tokens-confirmation';

const ImportTokens = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();

  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const [mode, setMode] = useState('');

  const [searchResults, setSearchResults] = useState([]);
  const [tokenSelectorError, setTokenSelectorError] = useState(null);
  const [selectedTokens, setSelectedTokens] = useState({});
  const tokenList = useSelector(getTokenList);
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
  const currentNetwork = useSelector(getCurrentNetwork);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);
  const selectedAddress = useSelector(getSelectedAddress);
  const isMainnet = useSelector(getIsMainnet);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const identities = useSelector(getMetaMaskIdentities);
  const tokens = useSelector((state) => state.metamask.tokens);
  const pendingTokens = useSelector(getPendingTokens);
  const chainId = useSelector(getCurrentChainId);
  const theme = useSelector((state) => getTheme(state));
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
  const networkClientId = useSelector(getSelectedNetworkClientId);
  const trackEvent = useContext(MetaMetricsContext);

  const handleAddTokens = useCallback(async () => {
    try {
      const addedTokenValues = Object.values(pendingTokens);
      await dispatch(addImportedTokens(addedTokenValues, networkClientId));

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
      for (const key in selectedTokens) {
        if (Object.prototype.hasOwnProperty.call(selectedTokens, key)) {
          tokenSymbols.push(selectedTokens[key].symbol);
        }
      }

      dispatch(setNewTokensImported(tokenSymbols.join(', ')));
      dispatch(clearPendingTokens());
      history.push(DEFAULT_ROUTE);
    } catch (err) {
      dispatch(setNewTokensImportedError('error'));
      dispatch(clearPendingTokens());
      history.push(DEFAULT_ROUTE);
    }
  }, [dispatch, history, pendingTokens, trackEvent]);

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
  // Custom token stuff
  const tokenDetectionInactiveOnNonMainnetSupportedNetwork = useSelector(
    getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  );
  const isDynamicTokenListAvailable = useSelector(
    getIsDynamicTokenListAvailable,
  );

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
                // nClose();
                history.push(mostRecentOverviewPage);
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
    <div className="page-container">
      <div className="import-tokens-page__header">
        <div className="import-tokens-page__title">
          <Text
            as="header"
            variant={TextVariant.headingSm}
            textAlign={TextAlign.Center}
          >
            {t('importTokensCamelCase')}
          </Text>
        </div>
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close')}
          onClick={() => {
            if (Object.keys(selectedTokens).length === 0) {
              dispatch(clearPendingTokens());
              history.push(DEFAULT_ROUTE);
            } else {
              dispatch(
                showModal({
                  name: 'IMPORT_TOKEN_EXIT_MODAL',
                  history,
                }),
              );
            }
          }}
          size={ButtonIconSize.Sm}
          marginLeft="auto"
        />
      </div>
      <div className="page-container__content">
        {isConfirming ? (
          <Text as="header" variant={TextVariant.headingSm}>
            {/* confirmation START */}
            <ImportTokensConfirmation />
            {/* confirmation END */}
          </Text>
        ) : (
          <Tabs t={t}>
            {showSearchTab ? (
              <Tab
                activeClassName="import-tokens-page__active-tab"
                className="import-tokens-page__tab"
                buttonClassName="import-tokens-page__button-tab"
                tabKey="search"
                name={t('search')}
              >
                <Box paddingTop={4} paddingBottom={4}>
                  {useTokenDetection ? null : (
                    <BannerAlert
                      severity={Severity.Info}
                      marginBottom={4}
                      className="banner"
                    >
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
                              history.push(mostRecentOverviewPage);
                            }}
                          >
                            {t('enableFromSettings')}
                          </ButtonLink>,
                        ])}
                      </Text>
                    </BannerAlert>
                  )}
                  <Box className="banner">
                    <TokenSearch
                      searchClassName="import-tokens-page__button-search"
                      onSearch={({ results = [] }) => setSearchResults(results)}
                      error={tokenSelectorError}
                      tokenList={tokenList}
                    />
                  </Box>

                  <Box marginTop={4} className="scrollable">
                    <TokenList
                      currentNetwork={currentNetwork}
                      testNetworkBackgroundColor={testNetworkBackgroundColor}
                      results={searchResults}
                      selectedTokens={selectedTokens}
                      onToggleToken={(token) => handleToggleToken(token)}
                      theme={theme}
                    />
                  </Box>
                </Box>
              </Tab>
            ) : null}
            <Tab
              activeClassName="import-tokens-page__active-tab"
              className="import-tokens-page__tab"
              buttonClassName="import-tokens-page__button-tab"
              tabKey="customToken"
              name={t('customToken')}
            >
              <Box
                paddingTop={4}
                paddingBottom={4}
                className="import-tokens-page__custom-token-form"
              >
                {tokenDetectionInactiveOnNonMainnetSupportedNetwork ? (
                  <BannerAlert severity={Severity.Warning} className="banner">
                    {t('customTokenWarningInTokenDetectionNetworkWithTDOFF', [
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
                          history.push(`${SECURITY_ROUTE}#auto-detect-tokens`);
                          history.push(mostRecentOverviewPage);
                        }}
                      >
                        {t('inYourSettings')}
                      </ButtonLink>,
                    ])}
                  </BannerAlert>
                ) : (
                  <BannerAlert
                    className="banner"
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
                  className="banner"
                  label={t('tokenContractAddress')}
                  value={customAddress}
                  onChange={(e) => handleCustomAddressChange(e.target.value)}
                  helpText={
                    customAddressError || mainnetTokenWarning || nftAddressError
                  }
                  error={
                    customAddressError || mainnetTokenWarning || nftAddressError
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
                  className="banner"
                />
                <FormTextField
                  className="banner"
                  label={t('decimal')}
                  type="number"
                  value={customDecimals}
                  onChange={(e) => handleCustomDecimalsChange(e.target.value)}
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
        )}
      </div>
      {isConfirming ? (
        <div className="import-tokens-page__footer">
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
              await handleAddTokens();
              history.push(DEFAULT_ROUTE);
            }}
            block
            data-testid="import-tokens-modal-import-button"
          >
            {t('import')}
          </ButtonPrimary>
        </div>
      ) : (
        <div className="import-tokens-page__footer">
          <ButtonPrimary
            onClick={() => handleNext()}
            size={Size.LG}
            disabled={Boolean(hasError()) || !hasSelected()}
            block
          >
            {t('next')}
          </ButtonPrimary>
        </div>
      )}
    </div>
  );
};

export default ImportTokens;
