import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import contractMap from '@metamask/contract-metadata';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import {
  checkExistingAddresses,
  getURLHostName,
} from '../../helpers/utils/util';
import { tokenInfoGetter } from '../../helpers/utils/token-util';
import {
  ADD_COLLECTIBLE_ROUTE,
  CONFIRM_IMPORT_TOKEN_ROUTE,
  EXPERIMENTAL_ROUTE,
  ADVANCED_ROUTE,
} from '../../helpers/constants/routes';
import TextField from '../../components/ui/text-field';
import PageContainer from '../../components/ui/page-container';
import { Tabs, Tab } from '../../components/ui/tabs';
import { addHexPrefix } from '../../../app/scripts/lib/util';
import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';
import ActionableMessage from '../../components/ui/actionable-message/actionable-message';
import Typography from '../../components/ui/typography';
import { TYPOGRAPHY, FONT_WEIGHT } from '../../helpers/constants/design-system';
import Button from '../../components/ui/button';
import { TOKEN_STANDARDS } from '../../helpers/constants/common';
import TokenSearch from './token-search';
import TokenList from './token-list';

/*eslint-disable prefer-destructuring*/
const TOKEN_DETECTION_V2 = process.env.TOKEN_DETECTION_V2;

const emptyAddr = '0x0000000000000000000000000000000000000000';

const MIN_DECIMAL_VALUE = 0;
const MAX_DECIMAL_VALUE = 36;

class ImportToken extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    /**
     * History object of the router.
     */
    history: PropTypes.object,

    /**
     * Set the state of `pendingTokens`, called when adding a token.
     */
    setPendingTokens: PropTypes.func,

    /**
     * The current list of pending tokens to be added.
     */
    pendingTokens: PropTypes.object,

    /**
     * Clear the list of pending tokens. Called when closing the modal.
     */
    clearPendingTokens: PropTypes.func,

    /**
     * The list of already added tokens.
     */
    tokens: PropTypes.array,

    /**
     * The identities/accounts that are currently added to the wallet.
     */
    identities: PropTypes.object,

    /**
     * Boolean flag that shows/hides the search tab.
     */
    showSearchTab: PropTypes.bool.isRequired,

    /**
     * The most recent overview page route, which is 'navigated' to when closing the modal.
     */
    mostRecentOverviewPage: PropTypes.string.isRequired,

    /**
     * The active chainId in use.
     */
    chainId: PropTypes.string,

    /**
     * The rpc preferences to use for the current provider.
     */
    rpcPrefs: PropTypes.object,

    /**
     * The list of tokens available for search.
     */
    tokenList: PropTypes.object,

    /**
     * Boolean flag indicating whether token detection is enabled or not.
     * When disabled, shows an information alert in the search tab informing the
     * user of the availability of this feature.
     */
    useTokenDetection: PropTypes.bool,

    /**
     * Function called to fetch information about the token standard and
     * details, see `actions.js`.
     */
    getTokenStandardAndDetails: PropTypes.func,

    /**
     * The currently selected active address.
     */
    selectedAddress: PropTypes.string,
    isTokenDetectionSupported: PropTypes.bool.isRequired,
    networkName: PropTypes.string.isRequired,
  };

  static defaultProps = {
    tokenList: {},
  };

  state = {
    customAddress: '',
    customSymbol: '',
    customDecimals: 0,
    searchResults: [],
    selectedTokens: {},
    standard: TOKEN_STANDARDS.NONE,
    tokenSelectorError: null,
    customAddressError: null,
    customSymbolError: null,
    customDecimalsError: null,
    collectibleAddressError: null,
    forceEditSymbol: false,
    symbolAutoFilled: false,
    decimalAutoFilled: false,
    mainnetTokenWarning: null,
  };

  componentDidMount() {
    this.tokenInfoGetter = tokenInfoGetter();
    const { pendingTokens = {} } = this.props;
    const pendingTokenKeys = Object.keys(pendingTokens);

    if (pendingTokenKeys.length > 0) {
      let selectedTokens = {};
      let customToken = {};

      pendingTokenKeys.forEach((tokenAddress) => {
        const token = pendingTokens[tokenAddress];
        const { isCustom } = token;

        if (isCustom) {
          customToken = { ...token };
        } else {
          selectedTokens = { ...selectedTokens, [tokenAddress]: { ...token } };
        }
      });

      const {
        address: customAddress = '',
        symbol: customSymbol = '',
        decimals: customDecimals = 0,
      } = customToken;

      this.setState({
        selectedTokens,
        customAddress,
        customSymbol,
        customDecimals,
      });
    }
  }

  handleToggleToken(token) {
    const { address } = token;
    const { selectedTokens = {} } = this.state;
    const selectedTokensCopy = { ...selectedTokens };

    if (address in selectedTokensCopy) {
      delete selectedTokensCopy[address];
    } else {
      selectedTokensCopy[address] = token;
    }

    this.setState({
      selectedTokens: selectedTokensCopy,
      tokenSelectorError: null,
    });
  }

  hasError() {
    const {
      tokenSelectorError,
      customAddressError,
      customSymbolError,
      customDecimalsError,
      collectibleAddressError,
    } = this.state;

    return (
      tokenSelectorError ||
      customAddressError ||
      customSymbolError ||
      customDecimalsError ||
      collectibleAddressError
    );
  }

  hasSelected() {
    const { customAddress = '', selectedTokens = {} } = this.state;
    return customAddress || Object.keys(selectedTokens).length > 0;
  }

  handleNext() {
    if (this.hasError()) {
      return;
    }

    if (!this.hasSelected()) {
      this.setState({ tokenSelectorError: this.context.t('mustSelectOne') });
      return;
    }

    const { setPendingTokens, history, tokenList } = this.props;
    const tokenAddressList = Object.keys(tokenList).map((address) =>
      address.toLowerCase(),
    );
    const {
      customAddress: address,
      customSymbol: symbol,
      customDecimals: decimals,
      selectedTokens,
      standard,
    } = this.state;

    const customToken = {
      address,
      symbol,
      decimals,
      standard,
    };

    setPendingTokens({ customToken, selectedTokens, tokenAddressList });
    history.push(CONFIRM_IMPORT_TOKEN_ROUTE);
  }

  async attemptToAutoFillTokenParams(address) {
    const { tokenList } = this.props;
    const { symbol = '', decimals } = await this.tokenInfoGetter(
      address,
      tokenList,
    );

    const symbolAutoFilled = Boolean(symbol);
    const decimalAutoFilled = Boolean(decimals);
    this.setState({ symbolAutoFilled, decimalAutoFilled });
    this.handleCustomSymbolChange(symbol || '');
    this.handleCustomDecimalsChange(decimals);
  }

  async handleCustomAddressChange(value) {
    const customAddress = value.trim();
    this.setState({
      customAddress,
      customAddressError: null,
      collectibleAddressError: null,
      tokenSelectorError: null,
      symbolAutoFilled: false,
      decimalAutoFilled: false,
      mainnetTokenWarning: null,
    });

    const addressIsValid = isValidHexAddress(customAddress, {
      allowNonPrefixed: false,
    });
    const standardAddress = addHexPrefix(customAddress).toLowerCase();

    const isMainnetToken = Object.keys(contractMap).some(
      (key) => key.toLowerCase() === customAddress.toLowerCase(),
    );

    const isMainnetNetwork = this.props.chainId === '0x1';

    let standard;
    if (addressIsValid) {
      try {
        ({ standard } = await this.props.getTokenStandardAndDetails(
          standardAddress,
          this.props.selectedAddress,
        ));
      } catch (error) {
        // ignore
      }
    }

    const addressIsEmpty =
      customAddress.length === 0 || customAddress === emptyAddr;

    switch (true) {
      case !addressIsValid && !addressIsEmpty:
        this.setState({
          customAddressError: this.context.t('invalidAddress'),
          customSymbol: '',
          customDecimals: 0,
          customSymbolError: null,
          customDecimalsError: null,
        });

        break;
      case process.env.COLLECTIBLES_V1 &&
        (standard === 'ERC1155' || standard === 'ERC721'):
        this.setState({
          collectibleAddressError: this.context.t('collectibleAddressError', [
            <a
              className="import-token__collectible-address-error-link"
              onClick={() =>
                this.props.history.push({
                  pathname: ADD_COLLECTIBLE_ROUTE,
                  state: {
                    addressEnteredOnImportTokensPage: this.state.customAddress,
                  },
                })
              }
              key="collectibleAddressError"
            >
              {this.context.t('importNFTPage')}
            </a>,
          ]),
        });

        break;
      case isMainnetToken && !isMainnetNetwork:
        this.setState({
          mainnetTokenWarning: this.context.t('mainnetToken'),
          customSymbol: '',
          customDecimals: 0,
          customSymbolError: null,
          customDecimalsError: null,
        });

        break;
      case Boolean(this.props.identities[standardAddress]):
        this.setState({
          customAddressError: this.context.t('personalAddressDetected'),
        });

        break;
      case checkExistingAddresses(customAddress, this.props.tokens):
        this.setState({
          customAddressError: this.context.t('tokenAlreadyAdded'),
        });

        break;
      default:
        if (!addressIsEmpty) {
          this.attemptToAutoFillTokenParams(customAddress);
          if (standard) {
            this.setState({ standard });
          }
        }
    }
  }

  handleCustomSymbolChange(value) {
    const customSymbol = value.trim();
    const symbolLength = customSymbol.length;
    let customSymbolError = null;

    if (symbolLength <= 0 || symbolLength >= 12) {
      customSymbolError = this.context.t('symbolBetweenZeroTwelve');
    }

    this.setState({ customSymbol, customSymbolError });
  }

  handleCustomDecimalsChange(value) {
    let customDecimals;
    let customDecimalsError = null;

    if (value) {
      customDecimals = Number(value.trim());
      customDecimalsError =
        value < MIN_DECIMAL_VALUE || value > MAX_DECIMAL_VALUE
          ? this.context.t('decimalsMustZerotoTen')
          : null;
    } else {
      customDecimals = '';
      customDecimalsError = this.context.t('tokenDecimalFetchFailed');
    }

    this.setState({ customDecimals, customDecimalsError });
  }

  renderCustomTokenForm() {
    const { t } = this.context;
    const {
      customAddress,
      customSymbol,
      customDecimals,
      customAddressError,
      customSymbolError,
      customDecimalsError,
      forceEditSymbol,
      symbolAutoFilled,
      decimalAutoFilled,
      mainnetTokenWarning,
      collectibleAddressError,
    } = this.state;

    const { chainId, rpcPrefs, isTokenDetectionSupported } = this.props;
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

    return (
      <div className="import-token__custom-token-form">
        {TOKEN_DETECTION_V2 ? (
          <ActionableMessage
            type={isTokenDetectionSupported ? 'warning' : 'default'}
            message={t(
              isTokenDetectionSupported
                ? 'customTokenWarningInTokenDetectionNetwork'
                : 'customTokenWarningInNonTokenDetectionNetwork',
              [
                <Button
                  type="link"
                  key="import-token-fake-token-warning"
                  className="import-token__link"
                  rel="noopener noreferrer"
                  target="_blank"
                  href={ZENDESK_URLS.TOKEN_SAFETY_PRACTICES}
                >
                  {t('learnScamRisk')}
                </Button>,
              ],
            )}
            withRightButton
            useIcon
            iconFillColor={
              isTokenDetectionSupported
                ? 'var(--color-warning-default)'
                : 'var(--color-info-default)'
            }
          />
        ) : (
          <ActionableMessage
            message={this.context.t('fakeTokenWarning', [
              <Button
                type="link"
                key="import-token-fake-token-warning"
                className="import-token__link"
                rel="noopener noreferrer"
                target="_blank"
                href={ZENDESK_URLS.TOKEN_SAFETY_PRACTICES}
              >
                {this.context.t('learnScamRisk')}
              </Button>,
            ])}
            type="warning"
            withRightButton
            useIcon
            iconFillColor="var(--color-warning-default)"
          />
        )}
        <TextField
          id="custom-address"
          label={t('tokenContractAddress')}
          type="text"
          value={customAddress}
          onChange={(e) => this.handleCustomAddressChange(e.target.value)}
          error={
            customAddressError || mainnetTokenWarning || collectibleAddressError
          }
          fullWidth
          autoFocus
          margin="normal"
        />
        <TextField
          id="custom-symbol"
          label={
            <div className="import-token__custom-symbol__label-wrapper">
              <span className="import-token__custom-symbol__label">
                {t('tokenSymbol')}
              </span>
              {symbolAutoFilled && !forceEditSymbol && (
                <div
                  className="import-token__custom-symbol__edit"
                  onClick={() => this.setState({ forceEditSymbol: true })}
                >
                  {t('edit')}
                </div>
              )}
            </div>
          }
          type="text"
          value={customSymbol}
          onChange={(e) => this.handleCustomSymbolChange(e.target.value)}
          error={customSymbolError}
          fullWidth
          margin="normal"
          disabled={symbolAutoFilled && !forceEditSymbol}
        />
        <TextField
          id="custom-decimals"
          label={t('decimal')}
          type="number"
          value={customDecimals}
          onChange={(e) => this.handleCustomDecimalsChange(e.target.value)}
          error={customDecimals ? customDecimalsError : null}
          fullWidth
          margin="normal"
          disabled={decimalAutoFilled}
          min={MIN_DECIMAL_VALUE}
          max={MAX_DECIMAL_VALUE}
        />
        {customDecimals === '' && (
          <ActionableMessage
            message={
              <>
                <Typography
                  variant={TYPOGRAPHY.H7}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  {t('tokenDecimalFetchFailed')}
                </Typography>
                <Typography
                  variant={TYPOGRAPHY.H7}
                  fontWeight={FONT_WEIGHT.NORMAL}
                >
                  {t('verifyThisTokenDecimalOn', [
                    <Button
                      type="link"
                      key="import-token-verify-token-decimal"
                      className="import-token__link"
                      rel="noopener noreferrer"
                      target="_blank"
                      href={blockExplorerTokenLink}
                    >
                      {blockExplorerLabel}
                    </Button>,
                  ])}
                </Typography>
              </>
            }
            type="warning"
            withRightButton
            className="import-token__decimal-warning"
          />
        )}
      </div>
    );
  }

  renderSearchToken() {
    const { t } = this.context;
    const { tokenList, history, useTokenDetection, networkName } = this.props;
    const { tokenSelectorError, selectedTokens, searchResults } = this.state;
    return (
      <div className="import-token__search-token">
        {!useTokenDetection && (
          <ActionableMessage
            message={
              TOKEN_DETECTION_V2
                ? t('tokenDetectionAlertMessage', [
                    networkName,
                    <Button
                      type="link"
                      key="token-detection-announcement"
                      className="import-token__link"
                      onClick={() =>
                        history.push(`${ADVANCED_ROUTE}#token-description`)
                      }
                    >
                      {t('enableFromSettings')}
                    </Button>,
                  ])
                : this.context.t('tokenDetectionAnnouncement', [
                    <Button
                      type="link"
                      key="token-detection-announcement"
                      className="import-token__link"
                      onClick={() => history.push(`${EXPERIMENTAL_ROUTE}`)}
                    >
                      {t('enableFromSettings')}
                    </Button>,
                  ])
            }
            withRightButton
            useIcon
            iconFillColor="var(--color-primary-default)"
            className="import-token__token-detection-announcement"
          />
        )}
        <TokenSearch
          onSearch={({ results = [] }) =>
            this.setState({ searchResults: results })
          }
          error={tokenSelectorError}
          tokenList={tokenList}
        />
        <div className="import-token__token-list">
          <TokenList
            results={searchResults}
            selectedTokens={selectedTokens}
            onToggleToken={(token) => this.handleToggleToken(token)}
          />
        </div>
      </div>
    );
  }

  renderTabs() {
    const { t } = this.context;
    const { showSearchTab } = this.props;
    const tabs = [];

    if (showSearchTab) {
      tabs.push(
        <Tab name={t('search')} key="search-tab">
          {this.renderSearchToken()}
        </Tab>,
      );
    }
    tabs.push(
      <Tab name={t('customToken')} key="custom-tab">
        {this.renderCustomTokenForm()}
      </Tab>,
    );

    return <Tabs>{tabs}</Tabs>;
  }

  render() {
    const { history, clearPendingTokens, mostRecentOverviewPage } = this.props;

    return (
      <PageContainer
        title={this.context.t('importTokensCamelCase')}
        tabsComponent={this.renderTabs()}
        onSubmit={() => this.handleNext()}
        hideCancel
        disabled={Boolean(this.hasError()) || !this.hasSelected()}
        onClose={() => {
          clearPendingTokens();
          history.push(mostRecentOverviewPage);
        }}
      />
    );
  }
}

export default ImportToken;
